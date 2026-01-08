import { Bot, InlineKeyboard } from "grammy";

export interface ChatConfig {
  botToken: string;
  chatId: string;
  responseTimeoutMs: number;
  humanizeDelayMs: number;
}

interface ChatState {
  chatId: string;
  conversationHistory: Array<{ role: "assistant" | "user"; message: string }>;
  lastMessageId?: number;
  startTime: number;
}

interface PendingReply {
  resolve: (text: string) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}

export function loadChatConfig(): ChatConfig {
  const botToken = process.env.PINGME_TELEGRAM_BOT_TOKEN;
  const chatId = process.env.PINGME_TELEGRAM_CHAT_ID;

  if (!botToken) throw new Error("Missing PINGME_TELEGRAM_BOT_TOKEN");
  if (!chatId) throw new Error("Missing PINGME_TELEGRAM_CHAT_ID");

  return {
    botToken,
    chatId,
    responseTimeoutMs: parseInt(process.env.PINGME_RESPONSE_TIMEOUT_MS || "180000", 10),
    humanizeDelayMs: parseInt(process.env.PINGME_HUMANIZE_DELAY_MS || "400", 10),
  };
}

export class ChatManager {
  private bot: Bot;
  private config: ChatConfig;
  private activeChats = new Map<string, ChatState>();
  private pendingReplies = new Map<string, PendingReply>();
  private currentChatId = 0;
  private started = false;

  constructor(config: ChatConfig) {
    this.config = config;
    this.bot = new Bot(config.botToken);
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.bot.catch((err) => {
      console.error("[ping-me] Bot error:", err.message);
    });

    this.bot.command("start", async (ctx) => {
      const chatId = ctx.chat.id.toString();
      await ctx.reply(
        `yo. your chat id is ${chatId}\n\n` +
        `if this doesn't match your config, update PINGME_TELEGRAM_CHAT_ID.\n\n` +
        `otherwise you're good - i'll ping you when opencode needs something.`
      );
    });

    this.bot.on("message:text", async (ctx) => {
      const chatId = ctx.chat.id.toString();
      if (chatId !== this.config.chatId) return;

      const pending = this.pendingReplies.get(chatId);
      if (pending) {
        clearTimeout(pending.timeoutId);
        this.pendingReplies.delete(chatId);
        pending.resolve(ctx.message.text);
      }
    });

    this.bot.on("callback_query:data", async (ctx) => {
      const chatId = ctx.chat?.id.toString();
      if (!chatId || chatId !== this.config.chatId) {
        await ctx.answerCallbackQuery();
        return;
      }

      const data = ctx.callbackQuery.data;
      await ctx.answerCallbackQuery();

      try {
        await ctx.editMessageReplyMarkup({ reply_markup: undefined });
      } catch {}

      if (data === "__pingme_chat__") return;

      const pending = this.pendingReplies.get(chatId);
      if (pending) {
        clearTimeout(pending.timeoutId);
        this.pendingReplies.delete(chatId);
        pending.resolve(data);
      }
    });
  }

  async start(): Promise<void> {
    if (this.started) return;
    this.bot.start({ onStart: () => console.error("[ping-me] Bot started") });
    this.started = true;
  }

  stop(): void {
    this.bot.stop();
    this.started = false;
  }

  private async humanDelay(): Promise<void> {
    const base = this.config.humanizeDelayMs;
    const jitter = Math.random() * base * 0.5;
    await new Promise((r) => setTimeout(r, base + jitter));
  }

  private buildKeyboard(quickReplies?: string[]): InlineKeyboard | undefined {
    if (!quickReplies?.length) return undefined;

    const keyboard = new InlineKeyboard();
    for (let i = 0; i < quickReplies.length; i++) {
      keyboard.text(quickReplies[i], quickReplies[i]);
      if ((i + 1) % 3 === 0 && i < quickReplies.length - 1) keyboard.row();
    }
    keyboard.row().text("let me type...", "__pingme_chat__");
    return keyboard;
  }

  async sendMessage(
    message: string,
    options?: { quickReplies?: string[] }
  ): Promise<{ chatId: string; response: string }> {
    const internalChatId = `chat-${++this.currentChatId}-${Date.now()}`;

    const state: ChatState = {
      chatId: internalChatId,
      conversationHistory: [],
      startTime: Date.now(),
    };
    this.activeChats.set(internalChatId, state);

    try {
      await this.bot.api.sendChatAction(this.config.chatId, "typing");
      await this.humanDelay();

      const keyboard = this.buildKeyboard(options?.quickReplies);
      const sent = await this.bot.api.sendMessage(this.config.chatId, message, {
        parse_mode: "HTML",
        reply_markup: keyboard,
      });

      state.lastMessageId = sent.message_id;
      state.conversationHistory.push({ role: "assistant", message });

      const response = await this.waitForReply();
      state.conversationHistory.push({ role: "user", message: response });

      return { chatId: internalChatId, response };
    } catch (error) {
      this.activeChats.delete(internalChatId);
      throw error;
    }
  }

  async continueChat(
    chatId: string,
    message: string,
    options?: { quickReplies?: string[] }
  ): Promise<string> {
    const state = this.activeChats.get(chatId);
    if (!state) throw new Error(`No active chat: ${chatId}`);

    await this.bot.api.sendChatAction(this.config.chatId, "typing");
    await this.humanDelay();

    const keyboard = this.buildKeyboard(options?.quickReplies);
    const sent = await this.bot.api.sendMessage(this.config.chatId, message, {
      parse_mode: "HTML",
      reply_markup: keyboard,
    });

    state.lastMessageId = sent.message_id;
    state.conversationHistory.push({ role: "assistant", message });

    const response = await this.waitForReply();
    state.conversationHistory.push({ role: "user", message: response });

    return response;
  }

  async sendUpdate(message: string): Promise<void> {
    await this.bot.api.sendChatAction(this.config.chatId, "typing");
    await this.humanDelay();
    await this.bot.api.sendMessage(this.config.chatId, message, { parse_mode: "HTML" });
  }

  private waitForReply(): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingReplies.delete(this.config.chatId);
        reject(new Error("Response timeout - no reply received"));
      }, this.config.responseTimeoutMs);

      this.pendingReplies.set(this.config.chatId, { resolve, reject, timeoutId });
    });
  }

  endChat(chatId: string): { durationSeconds: number } {
    const state = this.activeChats.get(chatId);
    if (!state) return { durationSeconds: 0 };

    const durationSeconds = Math.round((Date.now() - state.startTime) / 1000);
    this.activeChats.delete(chatId);
    return { durationSeconds };
  }

  getChatHistory(chatId: string): Array<{ role: "assistant" | "user"; message: string }> {
    return this.activeChats.get(chatId)?.conversationHistory || [];
  }
}
