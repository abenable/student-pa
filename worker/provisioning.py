import asyncio
import logging
import time

from botfather import create_telegram_bot
from containers import refresh_agent_runtime_status, spin_up_container, stop_and_remove_container
from config import AGENT_IMAGE, PROVISION_RETRIES, PROVISION_RETRY_DELAY_SECONDS
from exceptions import AgentContainerError, AgentSetupError, BotFatherError, DuplicateAgentError
from litellm import delete_litellm_key, ensure_litellm_key
from models import ProvisionRequest
from storage import agent_dir, delete_agent_info, load_agent_info, update_agent_info, validate_user_id
from utils import random_suffix, redact_text, safe_slug

logger = logging.getLogger(__name__)
_provision_locks: dict[str, asyncio.Lock] = {}


def _provision_lock(user_id: str) -> asyncio.Lock:
    lock = _provision_locks.get(user_id)
    if lock is None:
        lock = asyncio.Lock()
        _provision_locks[user_id] = lock
    return lock


async def do_provision_phase1(req: ProvisionRequest) -> dict:
    """Create the Telegram bot and LiteLLM key. Does not spin up Docker."""
    user_id = validate_user_id(req.telegram_user_id)
    async with _provision_lock(user_id):
        existing = load_agent_info(user_id)
        if existing:
            raise DuplicateAgentError("You already have an agent! Check your DMs.")

        suffix = random_suffix(4)
        agent_slug = safe_slug(req.agent_name)
        container_name = f"student-pa-{agent_slug}-{suffix}"

        logger.info("Phase 1 provisioning for user %s -> bot_suffix=%s", user_id, suffix)

        bot_token, bot_username = await create_telegram_bot(req.agent_name, suffix)

        agent_data = {
            "telegram_user_id": user_id,
            "telegram_username": req.telegram_username,
            "agent_name": req.agent_name,
            "student_name": req.student_name,
            "bio": req.bio,
            "bot_username": bot_username,
            "bot_token": bot_token,
            "container_name": container_name,
            "container_running": False,
            "provisioning_status": "bot_created",
            "phase2_attempts": 0,
            "last_error": None,
            "created_at": int(time.time()),
            "updated_at": int(time.time()),
        }
        update_agent_info(user_id, **agent_data)

        agent_data = await ensure_litellm_key(user_id, agent_data)
        logger.info("Phase 1 complete: @%s for user %s", bot_username, user_id)
        return agent_data


async def do_provision_phase2(user_id: str, attempts: int = PROVISION_RETRIES) -> dict:
    """Spin up the Docker container for an existing agent."""
    user_id = validate_user_id(user_id)
    async with _provision_lock(user_id):
        info = load_agent_info(user_id)
        if not info:
            raise RuntimeError("No agent found. Run /start to create one.")
        if info.get("container_running"):
            info["provisioning_status"] = "ready"
            update_agent_info(user_id, **info)
            return info
        info = await ensure_litellm_key(user_id, info)

        student_dir = agent_dir(user_id)
        container_name = info["container_name"]
        last_error = None

        for attempt in range(1, max(attempts, 1) + 1):
            info = update_agent_info(
                user_id,
                provisioning_status="starting_container",
                phase2_attempts=int(info.get("phase2_attempts", 0)) + 1,
                last_error=None,
            )
            logger.info(
                "Phase 2 attempt %s/%s for user %s container=%s image=%s",
                attempt,
                attempts,
                user_id,
                container_name,
                AGENT_IMAGE,
            )

            try:
                await asyncio.get_event_loop().run_in_executor(
                    None,
                    spin_up_container,
                    user_id,
                    container_name,
                    student_dir,
                    info["litellm_key"],
                    info["bot_token"],
                    info["student_name"],
                    info["bio"],
                    info["agent_name"],
                )
            except AgentContainerError as e:
                last_error = redact_text(str(e))
                logger.warning("Phase 2 attempt %s/%s failed for user %s: %s", attempt, attempts, user_id, last_error)
                if attempt < attempts:
                    update_agent_info(
                        user_id,
                        provisioning_status="container_retrying",
                        last_error=last_error,
                        next_retry_at=int(time.time() + PROVISION_RETRY_DELAY_SECONDS),
                    )
                    await asyncio.sleep(PROVISION_RETRY_DELAY_SECONDS)
                    continue
                break

            return update_agent_info(
                user_id,
                provisioning_status="ready",
                container_running=True,
                last_error=None,
                next_retry_at=None,
            )

        update_agent_info(
            user_id,
            provisioning_status="container_pending",
            container_running=False,
            last_error=last_error or "Container startup failed.",
            next_retry_at=None,
        )
        raise AgentContainerError(last_error or "Container startup failed.")


async def resume_provisioning(user_id: str) -> dict:
    user_id = validate_user_id(user_id)
    info = load_agent_info(user_id)
    if not info:
        raise RuntimeError("No agent found. Run /start to create one.")

    info = refresh_agent_runtime_status(info)
    if info.get("container_running") and info.get("provisioning_status") == "ready":
        return info
    if not info.get("bot_token"):
        raise AgentSetupError("Agent creation has not started yet (no bot token). Run /start.")
    if not info.get("litellm_key"):
        info = await ensure_litellm_key(user_id, info)
    if not info.get("container_running"):
        info = await do_provision_phase2(user_id)
    return info


async def delete_agent_runtime(info: dict) -> None:
    if info.get("container_name"):
        stop_and_remove_container(info["container_name"])
    try:
        await delete_litellm_key(info.get("litellm_key"))
    except Exception:
        logger.exception("Failed to revoke LiteLLM key for user %s", info.get("telegram_user_id"))
    delete_agent_info(info["telegram_user_id"])


__all__ = [
    "AgentContainerError",
    "AgentSetupError",
    "BotFatherError",
    "DuplicateAgentError",
    "delete_agent_runtime",
    "do_provision_phase1",
    "do_provision_phase2",
    "ensure_litellm_key",
    "refresh_agent_runtime_status",
    "resume_provisioning",
]
