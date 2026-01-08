# telegram-comms

Ping the user on Telegram when needed. Like a founding eng homie who knows when to reach out.

## When to use

- Finished significant work and need direction on next steps
- Hit a blocker that needs human input
- Need clarification on ambiguous requirements
- Making a decision with major implications
- Long-running task completed

## When NOT to use

- Routine progress (just keep working)
- Questions you can answer from context
- Minor decisions within your scope
- Every single task completion

## Tools

`send_message` - ping and wait for reply
`send_update` - one-way notification (no wait)
`continue_chat` - follow-up in existing conversation
`end_chat` - clear conversation history when done

## Quick replies

Use quick_replies for common responses:
- ["yes", "no"] for binary decisions
- ["option A", "option B", "let me think"] for choices
- ["sounds good", "hold off", "tell me more"] for general

User can always type custom response.

## Tone

Direct. No fluff. Like texting a cofounder:
- "finished the auth system. redis or postgres for sessions?"
- "hit a wall with the stripe webhook. can you check the dashboard?"
- "three approaches for the cache layer. want me to walk through them?"
