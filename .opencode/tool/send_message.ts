import { tool } from "@opencode-ai/plugin";
import { getChatManager } from "../plugin/pingme.js";

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

      return `Chat started.\n\nChat ID: ${result.chatId}\n\nUser replied: ${result.response}\n\nUse continue_chat for follow-ups.`;
    } catch (error) {
      return `Failed to send message: ${error instanceof Error ? error.message : error}`;
    }
  },
});
