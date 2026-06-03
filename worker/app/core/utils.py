import re
from collections.abc import Mapping
import secrets
import string

SECRET_KEYS = {"bot_token", "litellm_key", "api_server_key"}


def safe_slug(text: str, max_len: int = 20) -> str:
    slug = re.sub(r"[^a-z0-9_]", "", text.lower())
    return slug[:max_len] or "agent"


def random_suffix(n: int = 6) -> str:
    return "".join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(n))


def redact_text(text: str) -> str:
    text = re.sub(r"\d+:[A-Za-z0-9_-]{35,}", "<telegram-bot-token>", text)
    return re.sub(r"sk-[A-Za-z0-9_-]{8,}", "<api-key>", text)


def redact_bot_tokens(text: str) -> str:
    return redact_text(text)


def redact_secrets(data):
    if isinstance(data, Mapping):
        return {
            key: redact_secrets(value)
            for key, value in data.items()
            if key not in SECRET_KEYS
        }
    if isinstance(data, list):
        return [redact_secrets(value) for value in data]
    if isinstance(data, str):
        return redact_text(data)
    return data
