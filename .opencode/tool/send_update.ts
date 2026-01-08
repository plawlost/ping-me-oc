import { tool } from "@opencode-ai/plugin";
import { getChatManager } from "../plugin/pingme.js";

export default tool({
  description:
    "Send a one-way update to the user on Telegram without waiting for a reply. Use for status updates, progress notifications, or heads-up messages.",
  args: {
    message: tool.schema
      .string()
      .describe("The update message. Keep it brief and informative."),
  },
  async execute(args) {
    const manager = getChatManager();
    if (!manager) {
      return "PingMe not initialized. Check PINGME_TELEGRAM_BOT_TOKEN and PINGME_TELEGRAM_CHAT_ID.";
    }

    try {
      await manager.sendUpdate(args.message);
      return "Update sent.";
    } catch (error) {
      return `Failed to send update: ${error instanceof Error ? error.message : error}`;
    }
  },
});
