import { tool } from "@opencode-ai/plugin";
import { getChatManager } from "../plugin/pingme.js";

function formatHistory(history: Array<{ role: "assistant" | "user"; message: string }>): string {
  return history
    .map((h) => `${h.role === "assistant" ? "you" : "user"}: ${h.message}`)
    .join("\n");
}

export default tool({
  description:
    "Continue an existing Telegram chat with a follow-up message. Use after send_message to ask clarifying questions or discuss next steps.",
  args: {
    chat_id: tool.schema.string().describe("The chat ID from send_message"),
    message: tool.schema.string().describe("Your follow-up message"),
    quick_replies: tool.schema
      .array(tool.schema.string())
      .optional()
      .describe("Optional quick reply buttons"),
  },
  async execute(args) {
    const manager = getChatManager();
    if (!manager) {
      return "PingMe not initialized.";
    }

    try {
      const result = await manager.continueChat(args.chat_id, args.message, {
        quickReplies: args.quick_replies,
      });

      return [
        "conversation so far:",
        formatHistory(result.history),
      ].join("\n");
    } catch (error) {
      return `Failed to continue chat: ${error instanceof Error ? error.message : error}`;
    }
  },
});
