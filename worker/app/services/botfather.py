import asyncio
import logging
import re

from telethon import TelegramClient
from telethon.tl.functions.contacts import ResolveUsernameRequest

from app.core.config import TG_API_HASH, TG_API_ID, TG_SESSION
from app.core.exceptions import BotFatherError
from app.core.utils import redact_bot_tokens, safe_slug

logger = logging.getLogger(__name__)
_botfather_lock = asyncio.Lock()


async def _wait_for_botfather_reply(
    client: TelegramClient,
    bf_entity,
    after_id: int,
    timeout: int = 20,
    expected: str | None = None,
) -> tuple[str, int]:
    """Poll BotFather for the next matching incoming message after `after_id`."""
    deadline = asyncio.get_event_loop().time() + timeout
    newest_seen_id = after_id
    while asyncio.get_event_loop().time() < deadline:
        msgs = await client.get_messages(bf_entity, limit=10)
        for msg in reversed(msgs):
            if msg.id <= after_id or not msg.text or msg.out:
                continue

            newest_seen_id = max(newest_seen_id, msg.id)
            text = msg.text
            logger.info("BotFather reply id=%s text=%r", msg.id, redact_bot_tokens(text)[:120])

            if expected is None or expected.lower() in text.lower():
                return text, msg.id

            if "sorry" in text.lower() or "invalid" in text.lower() or "taken" in text.lower():
                logger.info("BotFather reply did not match expected=%r; stopping on error-like response", expected)
                return text, msg.id

        await asyncio.sleep(1)

    raise BotFatherError(
        f"Timed out waiting for BotFather reply"
        f"{f' containing {expected!r}' if expected else ''} after message id {newest_seen_id}"
    )


async def create_telegram_bot(agent_name: str, suffix: str) -> tuple[str, str]:
    """Drive BotFather via Telethon to create a new bot. Returns (token, username)."""
    bot_username = f"{safe_slug(agent_name)}_{suffix}_bot"

    async with _botfather_lock:
        async with TelegramClient(TG_SESSION, TG_API_ID, TG_API_HASH) as client:
            if not await client.is_user_authorized():
                raise RuntimeError(
                    "Telethon session is not authenticated. Run: uv run python auth_telethon.py"
                )

            bf = await client(ResolveUsernameRequest("BotFather"))
            bf_entity = bf.peer

            seed_msgs = await client.get_messages(bf_entity, limit=1)
            last_id = seed_msgs[0].id if seed_msgs else 0

            sent = await client.send_message(bf_entity, "/newbot")
            last_id = max(last_id, sent.id)
            reply, last_id = await _wait_for_botfather_reply(
                client, bf_entity, last_id, expected="choose a name"
            )

            if "already" in reply.lower() or "error" in reply.lower():
                raise BotFatherError(f"BotFather error after /newbot: {redact_bot_tokens(reply)[:200]}")

            sent = await client.send_message(bf_entity, agent_name)
            last_id = max(last_id, sent.id)
            reply, last_id = await _wait_for_botfather_reply(
                client, bf_entity, last_id, expected="choose a username"
            )
            if "username" not in reply.lower() or "choose" not in reply.lower():
                raise BotFatherError(
                    f"Unexpected BotFather reply after bot name: {redact_bot_tokens(reply)[:200]}"
                )

            sent = await client.send_message(bf_entity, bot_username)
            last_id = max(last_id, sent.id)
            final_reply, _ = await _wait_for_botfather_reply(
                client, bf_entity, last_id, expected="HTTP API"
            )

            token = None
            actual_username = bot_username

            if "HTTP API:" in final_reply:
                match = re.search(r"(\d+:[A-Za-z0-9_-]{35,})", final_reply)
                if match:
                    token = match.group(1)
                username_match = re.search(r"@(\w+_bot)", final_reply)
                if username_match:
                    actual_username = username_match.group(1)

            if not token:
                raise BotFatherError(
                    f"BotFather did not return a token for @{bot_username}. "
                    f"Response: {redact_bot_tokens(final_reply)[:200]}"
                )

    return token, actual_username
