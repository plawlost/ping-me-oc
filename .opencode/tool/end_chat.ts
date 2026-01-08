import { tool } from "@opencode-ai/plugin";
import { getChatManager } from "../plugin/pingme.js";

export default tool({
  description:
    "End a Telegram chat session and clear the conversation history. Use when you're done with a topic and want to start fresh next time.",
  args: {
    chat_id: tool.schema.string().describe("The chat ID to end"),
    message: tool.schema
      .string()
      .optional()
      .describe("Optional final message to send before ending (e.g. 'cool, talk later')"),
  },
  async execute(args) {
    const manager = getChatManager();
    if (!manager) {
      return "PingMe not initialized.";
    }

    try {
      if (args.message) {
        await manager.sendUpdate(args.message);
      }

      const { durationSeconds } = manager.endChat(args.chat_id);
      return `chat ended. duration: ${durationSeconds}s`;
    } catch (error) {
      return `Failed to end chat: ${error instanceof Error ? error.message : error}`;
    }
  },
});
