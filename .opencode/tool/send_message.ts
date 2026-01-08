import { tool } from "@opencode-ai/plugin";
import { getChatManager } from "../plugin/pingme.js";

function formatHistory(history: Array<{ role: "assistant" | "user"; message: string }>): string {
  return history
    .map((h) => `${h.role === "assistant" ? "you" : "user"}: ${h.message}`)
    .join("\n");
}

export default tool({
  description:
    "Ping the user on Telegram and wait for their reply. Use when you need input, hit a blocker, or finished significant work. Can include quick reply buttons for common responses.",
  args: {
    message: tool.schema
      .string()
      .describe("What to tell the user. Be direct and natural, like a founding eng homie."),
    quick_replies: tool.schema
      .array(tool.schema.string())
      .optional()
      .describe("Optional quick reply buttons (e.g. ['yes', 'no', 'later']). User can also type custom response."),
  },
  async execute(args) {
    const manager = getChatManager();
    if (!manager) {
      return "PingMe not initialized. Check PINGME_TELEGRAM_BOT_TOKEN and PINGME_TELEGRAM_CHAT_ID.";
    }

    try {
      const result = await manager.sendMessage(args.message, {
        quickReplies: args.quick_replies,
      });

      return [
        `chat_id: ${result.chatId}`,
        "",
        "conversation:",
        formatHistory(result.history),
        "",
        "use continue_chat with this chat_id for follow-ups.",
      ].join("\n");
    } catch (error) {
      return `Failed to send message: ${error instanceof Error ? error.message : error}`;
    }
  },
});
