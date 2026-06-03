import asyncio
import logging

import httpx

from app.core.config import (
    LITELLM_ADMIN_BASE,
    LITELLM_ADMIN_KEY,
    LITELLM_MODEL,
    PROVISION_RETRIES,
    PROVISION_RETRY_DELAY_SECONDS,
)
from app.core.exceptions import AgentSetupError
from app.runtime.storage import update_agent_info
from app.core.utils import safe_slug

logger = logging.getLogger(__name__)


def _key_name(student_id: str, agent_name: str) -> str:
    return f"student-pa:{student_id}:{safe_slug(agent_name, 32)}"


async def create_litellm_key(student_id: str, agent_name: str, telegram_username: str) -> tuple[str, str | None]:
    """Create a labeled, Mythos-only LiteLLM virtual key that expires in 7 days."""
    key_name = _key_name(student_id, agent_name)
    payload = {
        "key_name": key_name,
        "key_alias": key_name,
        "user_id": student_id,
        "models": ["Mythos"],
        "duration": "7d",
        "metadata": {
            "service": "student-pa",
            "student_id": student_id,
            "telegram_username": telegram_username,
            "agent_name": agent_name,
            "key_label": key_name,
        },
    }
    last_error = None
    async with httpx.AsyncClient() as client:
        for attempt in range(1, PROVISION_RETRIES + 1):
            try:
                resp = await client.post(
                    f"{LITELLM_ADMIN_BASE}/key/generate",
                    headers={"Authorization": f"Bearer {LITELLM_ADMIN_KEY}"},
                    json=payload,
                    timeout=30,
                )
                if resp.status_code != 200:
                    logger.error(
                        "LiteLLM /key/generate returned %s: %s",
                        resp.status_code,
                        resp.text[:500],
                    )
                resp.raise_for_status()
                data = resp.json()
                return data["key"], data.get("expires")
            except Exception as e:
                last_error = e
                logger.warning(
                    "LiteLLM key generation attempt %s/%s failed for user %s: %s",
                    attempt,
                    PROVISION_RETRIES,
                    student_id,
                    e,
                )
                if attempt < PROVISION_RETRIES:
                    await asyncio.sleep(PROVISION_RETRY_DELAY_SECONDS)
    raise AgentSetupError(f"Could not generate LiteLLM API key: {last_error}")


async def ensure_litellm_key(user_id: str, info: dict) -> dict:
    if info.get("litellm_key"):
        return info

    update_agent_info(user_id, provisioning_status="creating_key", last_error=None)
    try:
        litellm_key, expires = await create_litellm_key(
            user_id,
            info["agent_name"],
            info.get("telegram_username", ""),
        )
    except AgentSetupError as e:
        update_agent_info(user_id, provisioning_status="key_pending", last_error=str(e))
        raise

    return update_agent_info(
        user_id,
        litellm_key=litellm_key,
        litellm_key_expires_at=expires,
        litellm_key_name=_key_name(user_id, info["agent_name"]),
        litellm_model=LITELLM_MODEL,
        provisioning_status="bot_created",
        last_error=None,
    )


async def delete_litellm_key(key: str | None) -> None:
    if not key:
        return
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{LITELLM_ADMIN_BASE}/key/delete",
            headers={"Authorization": f"Bearer {LITELLM_ADMIN_KEY}"},
            json={"keys": [key]},
            timeout=30,
        )
        if resp.status_code == 404:
            return
        resp.raise_for_status()
