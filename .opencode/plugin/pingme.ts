import { ChatManager, loadChatConfig } from "../../server/src/telegram-chat.js";

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
    await chatManager.start();
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
