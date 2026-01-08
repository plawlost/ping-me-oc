import { ChatManager, loadChatConfig } from "../../server/src/telegram-chat.ts";

let chatManager: ChatManager | null = null;
let serverStarted = false;

async function initializeBot(ctx: any): Promise<ChatManager | null> {
  if (serverStarted && chatManager) return chatManager;

  try {
    const config = loadChatConfig();

    await ctx.client.app.log({
      service: "pingme-plugin",
      level: "info",
      message: "Starting Telegram bot...",
    });

    chatManager = new ChatManager(config);

    // Start bot with timeout to prevent hanging
    await Promise.race([
      chatManager.start(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Bot startup timeout")), 5000)
      )
    ]);

    serverStarted = true;

    await ctx.client.app.log({
      service: "pingme-plugin",
      level: "info",
      message: `PingMe ready. Chat ID: ${config.chatId}`,
    });

    return chatManager;
  } catch (error) {
    await ctx.client.app.log({
      service: "pingme-plugin",
      level: "error",
      message: `Failed to initialize PingMe: ${error instanceof Error ? error.message : error}`,
    });
    return null;
  }
}

export function getChatManager(): ChatManager | null {
  return chatManager;
}

export const PingMePlugin = async (ctx: any) => {
  // Safety check: Don't load if we're in the ping-me-oc project directory
  const cwd = process.cwd();
  if (cwd.includes('ping-me-oc')) {
    await ctx.client.app.log({
      service: "pingme-plugin",
      level: "info",
      message: "PingMe plugin disabled in ping-me-oc directory to prevent circular loading",
    });
    return {};
  }

  try {
    await initializeBot(ctx);
  } catch (error) {
    await ctx.client.app.log({
      service: "pingme-plugin",
      level: "error",
      message: `Plugin initialization failed: ${error instanceof Error ? error.message : error}`,
    });
  }

  return {};
};
