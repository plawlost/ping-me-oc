# Ping Me OC

Your AI's way of reaching out when it actually matters.

OpenCode plugin that pings you on Telegram. No calls, no noise - just a quick message when there's something worth your attention. Like having a founding eng who knows the difference between "figured it out" and "need your take on this."

## Setup (2 min)

### 1. Create Bot

Open Telegram, find **@BotFather**, send `/newbot`. 
- First it asks for a display name (anything works, e.g. "My Ping Bot")
- Then it asks for a username (must end in `bot`, e.g. "mypingme_bot")
- Copy the token it gives you

### 2. Get Your Chat ID

Find **@userinfobot**, send `/start`. Copy your ID.

### 3. Configure

```bash
# .env
PINGME_TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
PINGME_TELEGRAM_CHAT_ID=123456789
```

### 4. Install

```bash
cd .opencode && bun install
cd ../server && bun install
```

Copy `.opencode/` to your project or `~/.config/opencode/` for global.

### 5. Activate

Send `/start` to your bot. Restart OpenCode. Done.

## Usage

### send_message

Ping and wait for reply.

```
send_message({
  message: "finished the auth system. what's next?",
  quick_replies: ["database", "api routes", "tests"]
})
```

### send_update

One-way heads up.

```
send_update({
  message: "starting the migration. might take a few."
})
```

### continue_chat

Keep the conversation going.

```
continue_chat({
  chat_id: "chat-1-...",
  message: "got it. redis or memcached?",
  quick_replies: ["redis", "memcached"]
})
```

### end_chat

Clear conversation history when done.

```
end_chat({
  chat_id: "chat-1-...",
  message: "cool, talk later"
})
```

## Config

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PINGME_TELEGRAM_BOT_TOKEN` | yes | - | From @BotFather |
| `PINGME_TELEGRAM_CHAT_ID` | yes | - | Your Telegram user ID |
| `PINGME_RESPONSE_TIMEOUT_MS` | no | 180000 | Reply timeout (3 min) |
| `PINGME_HUMANIZE_DELAY_MS` | no | 400 | Typing delay |

## How It Works

```
OpenCode                        Telegram
   |                               |
   |  "done. next?"                |
   |------------------------------>|
   |                               |  [typing...]
   |                               |  "done. next?"
   |                               |  [database] [api] [tests]
   |                               |  [let me type...]
   |                               |
   |                               |  user taps or types
   |<------------------------------|
   |  "database"                   |
```

No servers. No webhooks. No ngrok. Just works.

## Why

Because phone calls are overkill for most things. Sometimes you just need a quick "hey, which approach?" not a full conversation.

## License

MIT
