import asyncio
import json
import logging
import os
import re
import secrets
import string
import time
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

import docker
import httpx
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from telegram import (
    BotCommand,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Update,
)
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    ConversationHandler,
    ContextTypes,
    MessageHandler,
    filters,
)
from telethon import TelegramClient
from telethon.tl.functions.contacts import ResolveUsernameRequest

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("telegram.request").setLevel(logging.WARNING)

# ── Config ────────────────────────────────────────────────────────────────────

SIGNUP_BOT_TOKEN = os.environ["SIGNUP_BOT_TOKEN"]
PROVISIONER_SECRET = os.environ["PROVISIONER_SECRET"]

# Hardcoded LiteLLM gateway (all agents use this)
LITELLM_OPENAI_BASE = "https://litellm.byte10x.dev/v1"
LITELLM_ADMIN_BASE = LITELLM_OPENAI_BASE[:-3]  # strip /v1 for admin API
LITELLM_ADMIN_KEY = os.environ["LITELLM_ADMIN_KEY"]
AGENT_IMAGE = os.environ.get("AGENT_IMAGE", "ghcr.io/abenable/student-pa:latest")
AGENTS_BASE_DIR = Path(os.environ.get("AGENTS_BASE_DIR", "/agents"))
DEFAULT_MODEL = os.environ.get("DEFAULT_MODEL", "Mythos")

TG_API_ID = int(os.environ["TELEGRAM_API_ID"])
TG_API_HASH = os.environ["TELEGRAM_API_HASH"]
TG_SESSION = os.environ.get("TELEGRAM_SESSION", "./botfather_session")

Path(TG_SESSION).parent.mkdir(parents=True, exist_ok=True)
AGENTS_BASE_DIR.mkdir(parents=True, exist_ok=True)

docker_client = docker.from_env()


# ── Custom exceptions ─────────────────────────────────────────────────────────


class DuplicateAgentError(Exception):
    """Raised when an agent already exists for a user."""
    pass


class BotFatherError(Exception):
    """Raised when BotFather automation fails."""
    pass


# ── Request model ─────────────────────────────────────────────────────────────


class ProvisionRequest(BaseModel):
    telegram_user_id: str
    telegram_username: str
    agent_name: str
    student_name: str
    bio: str


# ── Persistence ───────────────────────────────────────────────────────────────


def _agent_file(user_id: str) -> Path:
    return AGENTS_BASE_DIR / user_id / "agent.json"


def _secrets_file(user_id: str) -> Path:
    return AGENTS_BASE_DIR / user_id / "secrets.json"


def load_agent_info(user_id: str) -> dict | None:
    path = _agent_file(user_id)
    if not path.exists():
        return None
    with open(path) as f:
        data = json.load(f)
    secrets_path = _secrets_file(user_id)
    if secrets_path.exists():
        with open(secrets_path) as f:
            data.update(json.load(f))
    return data


def save_agent_info(user_id: str, data: dict) -> None:
    _SECRET_KEYS = {"bot_token", "litellm_key"}
    path = _agent_file(user_id)
    path.parent.mkdir(parents=True, exist_ok=True)

    secrets = {k: v for k, v in data.items() if k in _SECRET_KEYS}
    public = {k: v for k, v in data.items() if k not in _SECRET_KEYS}

    with open(path, "w") as f:
        json.dump(public, f, indent=2)

    if secrets:
        secrets_path = _secrets_file(user_id)
        with open(secrets_path, "w") as f:
            json.dump(secrets, f, indent=2)
        secrets_path.chmod(0o600)


def delete_agent_info(user_id: str) -> None:
    for p in (_agent_file(user_id), _secrets_file(user_id)):
        if p.exists():
            p.unlink()


# ── Helpers ───────────────────────────────────────────────────────────────────


def _safe_slug(text: str, max_len: int = 20) -> str:
    slug = re.sub(r"[^a-z0-9_]", "", text.lower())
    return slug[:max_len] or "agent"


def _random_suffix(n: int = 6) -> str:
    return "".join(
        secrets.choice(string.ascii_lowercase + string.digits) for _ in range(n)
    )


def _redact_bot_tokens(text: str) -> str:
    return re.sub(r"\d+:[A-Za-z0-9_-]{35,}", "<telegram-bot-token>", text)


async def create_litellm_key(student_id: str, agent_name: str, key_name: str) -> str:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{LITELLM_ADMIN_BASE}/key/generate",
            headers={"Authorization": f"Bearer {LITELLM_ADMIN_KEY}"},
            json={
                "key_name": key_name,
                "models": ["Mythos"],
                "metadata": {"student_id": student_id, "agent_name": agent_name},
            },
            timeout=30,
        )
        if resp.status_code != 200:
            logger.error(
                "LiteLLM /key/generate returned %s: %s",
                resp.status_code,
                resp.text,
            )
        resp.raise_for_status()
        return resp.json()["key"]


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
            logger.info(
                "BotFather reply id=%s text=%r",
                msg.id,
                _redact_bot_tokens(text)[:120],
            )

            if expected is None or expected.lower() in text.lower():
                return text, msg.id

            if "sorry" in text.lower() or "invalid" in text.lower() or "taken" in text.lower():
                logger.info(
                    "BotFather reply did not match expected=%r; stopping on error-like response",
                    expected,
                )
                return text, msg.id

        await asyncio.sleep(1)

    raise BotFatherError(
        f"Timed out waiting for BotFather reply"
        f"{f' containing {expected!r}' if expected else ''} after message id {newest_seen_id}"
    )


async def create_telegram_bot(agent_name: str, suffix: str) -> tuple[str, str]:
    """Drive BotFather via Telethon to create a new bot. Returns (token, username)."""
    bot_username = f"{_safe_slug(agent_name)}_{suffix}_bot"

    async with TelegramClient(TG_SESSION, TG_API_ID, TG_API_HASH) as client:
        if not await client.is_user_authorized():
            raise RuntimeError(
                "Telethon session is not authenticated. "
                "Run: uv run python auth_telethon.py"
            )

        bf = await client(ResolveUsernameRequest("BotFather"))
        bf_entity = bf.peer

        # Get current last message ID so we can detect new replies
        seed_msgs = await client.get_messages(bf_entity, limit=1)
        last_id = seed_msgs[0].id if seed_msgs else 0

        sent = await client.send_message(bf_entity, "/newbot")
        last_id = max(last_id, sent.id)
        reply, last_id = await _wait_for_botfather_reply(
            client, bf_entity, last_id, expected="choose a name"
        )

        if "already" in reply.lower() or "error" in reply.lower():
            raise BotFatherError(
                f"BotFather error after /newbot: {_redact_bot_tokens(reply)[:200]}"
            )

        sent = await client.send_message(bf_entity, agent_name)
        last_id = max(last_id, sent.id)
        reply, last_id = await _wait_for_botfather_reply(
            client, bf_entity, last_id, expected="choose a username"
        )
        if "username" not in reply.lower() or "choose" not in reply.lower():
            raise BotFatherError(
                f"Unexpected BotFather reply after bot name: {_redact_bot_tokens(reply)[:200]}"
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
                f"Response: {_redact_bot_tokens(final_reply)[:200]}"
            )

    return token, actual_username


def spin_up_container(
    student_id: str,
    container_name: str,
    student_dir: Path,
    litellm_key: str,
    bot_token: str,
    student_name: str,
    bio: str,
    agent_name: str,
) -> None:
    student_dir.mkdir(parents=True, exist_ok=True)
    (student_dir / "hermes-data").mkdir(exist_ok=True)
    (student_dir / "student-data").mkdir(exist_ok=True)

    env = {
        "LITELLM_API_BASE": LITELLM_OPENAI_BASE,
        "LITELLM_API_KEY": litellm_key,
        "DEFAULT_MODEL": DEFAULT_MODEL,
        "HERMES_HOME": "/home/hermes/.hermes",
        "HERMES_INFERENCE_PROVIDER": "openai",
        "OPENAI_API_KEY": litellm_key,
        "OPENAI_BASE_URL": LITELLM_OPENAI_BASE,
        "HERMES_MODEL": DEFAULT_MODEL,
        "TELEGRAM_BOT_TOKEN": bot_token,
        "TELEGRAM_ALLOWED_USERS": student_id,
        "TELEGRAM_HOME_CHANNEL": student_id,
        "STUDENT_NAME": student_name,
        "STUDENT_BIO": bio,
        "AGENT_NAME": agent_name,
    }

    container = docker_client.containers.run(
        AGENT_IMAGE,
        name=container_name,
        detach=True,
        restart_policy={"Name": "unless-stopped"},
        environment=env,
        volumes={
            str(student_dir / "hermes-data"): {
                "bind": "/home/hermes/.hermes",
                "mode": "rw",
            },
            str(student_dir / "student-data"): {
                "bind": "/home/hermes/student-data",
                "mode": "rw",
            },
        },
        extra_hosts={"host.docker.internal": "host-gateway"},
        security_opt=["no-new-privileges:true"],
        cap_drop=["ALL"],
        cap_add=["DAC_OVERRIDE", "CHOWN", "FOWNER"],
    )

    # Wait until container is running (up to 30s)
    deadline = time.time() + 30
    while time.time() < deadline:
        container.reload()
        if container.status == "running":
            break
        time.sleep(1)
    else:
        raise RuntimeError(f"Container {container_name} did not reach running state in 30s")

    result = container.exec_run("hermes setup --non-interactive", user="hermes")
    logger.info(
        "hermes setup exit=%d: %s", result.exit_code, result.output.decode()[:500]
    )

    container.exec_run("hermes gateway run", detach=True, user="hermes")
    logger.info("Telegram gateway started for container %s", container_name)


# ── Provisioning (Phase 1: Bot + Key only) ────────────────────────────────────


async def do_provision_phase1(req: ProvisionRequest) -> dict:
    """Create the Telegram bot and LiteLLM key. Does NOT spin up Docker."""
    suffix = _random_suffix(4)
    agent_slug = _safe_slug(req.agent_name)
    container_name = f"student-pa-{agent_slug}-{suffix}"

    logger.info(
        "Phase 1 provisioning for user %s → bot_suffix=%s",
        req.telegram_user_id,
        suffix,
    )

    existing = load_agent_info(req.telegram_user_id)
    if existing:
        raise DuplicateAgentError("You already have an agent! Check your DMs.")

    # 1. Create Telegram bot via BotFather
    bot_token, bot_username = await create_telegram_bot(req.agent_name, suffix)

    # 2. Generate LiteLLM key restricted to Mythos
    try:
        litellm_key = await create_litellm_key(req.telegram_user_id, req.agent_name, req.telegram_username)
    except Exception:
        logger.exception("LiteLLM key generation failed")
        raise RuntimeError("Could not generate LiteLLM API key")

    # 3. Persist agent info (Docker not provisioned yet)
    agent_data = {
        "telegram_user_id": req.telegram_user_id,
        "agent_name": req.agent_name,
        "student_name": req.student_name,
        "bio": req.bio,
        "bot_username": bot_username,
        "bot_token": bot_token,
        "litellm_key": litellm_key,
        "container_name": container_name,
        "container_running": False,
    }
    save_agent_info(req.telegram_user_id, agent_data)

    logger.info("Phase 1 complete: @%s for user %s", bot_username, req.telegram_user_id)
    return agent_data


async def do_provision_phase2(user_id: str) -> dict:
    """Spin up the Docker container for an existing agent."""
    info = load_agent_info(user_id)
    if not info:
        raise RuntimeError("No agent found. Run /start to create one.")
    if info.get("container_running"):
        raise DuplicateAgentError("Your agent container is already running.")

    student_dir = AGENTS_BASE_DIR / user_id
    container_name = info["container_name"]

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

    info["container_running"] = True
    save_agent_info(user_id, info)
    return info


# ── FastAPI ───────────────────────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    await telegram_app.initialize()
    await telegram_app.start()
    await telegram_app.bot.set_my_commands(BOT_COMMANDS)
    await telegram_app.updater.start_polling(
        allowed_updates=Update.ALL_TYPES, drop_pending_updates=True
    )
    logger.info("Telegram signup bot started polling")
    yield
    await telegram_app.updater.stop()
    await telegram_app.stop()
    await telegram_app.shutdown()
    logger.info("Telegram signup bot stopped")


api = FastAPI(lifespan=lifespan)


class Phase2Request(BaseModel):
    telegram_user_id: str


@api.post("/provision")
async def provision(req: ProvisionRequest, x_secret: str = Header(...)):
    if x_secret != PROVISIONER_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    try:
        return await do_provision_phase1(req)
    except DuplicateAgentError as e:
        raise HTTPException(status_code=409, detail=str(e))


@api.post("/provision/phase2")
async def provision_phase2(req: Phase2Request, x_secret: str = Header(...)):
    if x_secret != PROVISIONER_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    try:
        return await do_provision_phase2(req.telegram_user_id)
    except DuplicateAgentError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=404, detail=str(e))


@api.get("/health")
def health():
    return {"status": "ok"}


# ── Telegram Bot ──────────────────────────────────────────────────────────────

BOT_COMMANDS = [
    BotCommand("start", "Set up your personal AI agent"),
    BotCommand("cancel", "Cancel the current operation"),
    BotCommand("support", "Contact support"),
    BotCommand("rename", "Rename your agent"),
    BotCommand("delete", "Delete your agent"),
]

AGENT_NAME, STUDENT_NAME, BIO, RENAME, DELETE = range(5)

BIO_OPTIONS = [
    ("🎓 1st year - general help", "1st year student looking for general academic help"),
    ("💻 2nd year CS - coding & labs", "2nd year CS, need help with coding and lab reports"),
    ("🔬 3rd/4th year - research & thesis", "3rd/4th year, need help with research and thesis"),
    ("📊 Business - assignments & presentations", "Business student, need help with assignments and presentations"),
    ("⚕️ Medicine - reports & case studies", "Medical student, need help with reports and case studies"),
    ("⚖️ Law - briefs & research", "Law student, need help with case briefs and legal research"),
    ("📝 Job applications & CVs", "Need help with job applications, CVs and interview prep"),
    ("🎯 All-around student help", "Need all-around help with student life and academics"),
]


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text(
        "👋 Welcome to Student-PA!\n\n"
        "I'll set up your personal AI agent in about 30 seconds.\n\n"
        "What would you like to name your agent? (e.g. StudyBuddy, Max, Aria)"
    )
    return AGENT_NAME


async def log_incoming_update(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Log enough update context to verify Telegram messages reach this process."""
    user_id = update.effective_user.id if update.effective_user else None
    chat_id = update.effective_chat.id if update.effective_chat else None

    if update.effective_message:
        text = update.effective_message.text or update.effective_message.caption or ""
        logger.info(
            "Incoming Telegram message user_id=%s chat_id=%s text=%r",
            user_id,
            chat_id,
            text[:120],
        )
    elif update.callback_query:
        logger.info(
            "Incoming Telegram callback user_id=%s chat_id=%s data=%r",
            user_id,
            chat_id,
            update.callback_query.data,
        )


async def telegram_error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    error = context.error
    logger.error(
        "Telegram handler failed for update=%r",
        update,
        exc_info=(type(error), error, error.__traceback__) if error else None,
    )


async def collect_agent_name(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data["agent_name"] = update.message.text.strip()
    await update.message.reply_text("Nice! What's your first name?")
    return STUDENT_NAME


async def collect_student_name(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data["student_name"] = update.message.text.strip()

    keyboard = [
        [InlineKeyboardButton(text, callback_data=value)]
        for text, value in BIO_OPTIONS
    ]
    await update.message.reply_text(
        "Last question — tell me a bit about yourself:\n"
        "Tap an option below or type your own.",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )
    return BIO


async def collect_bio_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data["bio"] = update.message.text.strip()
    return await _finish_onboarding(update, context)


async def collect_bio_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    context.user_data["bio"] = query.data
    return await _finish_onboarding(update, context)


async def _finish_onboarding(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    agent_name = context.user_data["agent_name"]

    msg = await _reply_text(update, context,
        f'⏳ Creating your personal agent "{agent_name}"...\n'
        "This takes about 30 seconds."
    )

    req = ProvisionRequest(
        telegram_user_id=str(update.effective_user.id),
        telegram_username=update.effective_user.username or "",
        agent_name=agent_name,
        student_name=context.user_data["student_name"],
        bio=context.user_data["bio"],
    )

    try:
        data = await do_provision_phase1(req)
        # Phase 2: spin up the container
        data = await do_provision_phase2(req.telegram_user_id)
        await _reply_text(update, context,
            f"✅ Your agent is ready!\n\n"
            f"🤖 Bot: @{data['bot_username']}\n\n"
            f"👉 DM @{data['bot_username']} to chat with your agent.",
            parse_mode="Markdown",
        )
    except DuplicateAgentError as e:
        await _reply_text(update, context, f"❌ {e}")
    except BotFatherError as e:
        logger.error("BotFather error: %s", e)
        await _reply_text(update, context,
            "❌ Could not create the bot via BotFather. "
            "The username might be taken or you're rate-limited. Please try again."
        )
    except Exception:
        logger.exception("Unexpected error during provisioning")
        await _reply_text(update, context,
            "❌ Something went wrong while creating your agent. "
            "Please try again or contact support."
        )

    return ConversationHandler.END


async def _reply_text(update: Update, context: ContextTypes.DEFAULT_TYPE, text: str, parse_mode=None):
    """Helper to reply either to a message or edit a callback message."""
    if update.callback_query:
        return await update.callback_query.edit_message_text(text, parse_mode=parse_mode)
    return await update.message.reply_text(text, parse_mode=parse_mode)


async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text("Setup cancelled. Send /start to try again.")
    return ConversationHandler.END


# ── Standalone commands ───────────────────────────────────────────────────────


async def support_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        "📞 *Support*\n\n"
        "If you're having trouble, reach out:\n"
        "• Email: support@student-pa.dev\n"
        "• DM the admin directly\n\n"
        "Common issues:\n"
        "• Agent not responding — try restarting the chat with /start\n"
        "• Forgot your API key — use /rename to view your agent details\n"
        "• Want a new agent — use /delete then /start\n",
        parse_mode="Markdown",
    )


async def rename_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    info = load_agent_info(str(update.effective_user.id))
    if not info:
        await update.message.reply_text(
            "❌ You don't have an agent yet. Send /start to create one."
        )
        return ConversationHandler.END

    context.user_data["_rename_agent"] = info
    await update.message.reply_text(
        f'Your current agent is named "{info["agent_name"]}".\n\n'
        f'Its bot is @{info["bot_username"]}.\n\n'
        "What would you like to rename it to?"
    )
    return RENAME


async def rename_finish(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    new_name = update.message.text.strip()
    info = context.user_data.get("_rename_agent")
    if not info:
        await update.message.reply_text("Session expired. Send /rename to try again.")
        return ConversationHandler.END

    info["agent_name"] = new_name
    save_agent_info(info["telegram_user_id"], info)
    await update.message.reply_text(f'✅ Agent renamed to "{new_name}"!')
    return ConversationHandler.END


async def delete_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    info = load_agent_info(str(update.effective_user.id))
    if not info:
        await update.message.reply_text(
            "❌ You don't have an agent yet. Send /start to create one."
        )
        return ConversationHandler.END

    context.user_data["_delete_agent"] = info
    keyboard = [
        [InlineKeyboardButton("✅ Yes, delete everything", callback_data="delete_confirm")],
        [InlineKeyboardButton("❌ No, keep it", callback_data="delete_cancel")],
    ]
    await update.message.reply_text(
        f'⚠️ Are you sure you want to delete your agent "{info["agent_name"]}"?\n\n'
        f'This will remove @{info["bot_username"]} and all associated data.',
        reply_markup=InlineKeyboardMarkup(keyboard),
    )
    return DELETE


async def delete_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()

    if query.data == "delete_cancel":
        await query.edit_message_text("👍 Your agent is safe!")
        return ConversationHandler.END

    info = context.user_data.get("_delete_agent")
    if not info:
        await query.edit_message_text("Session expired. Send /delete to try again.")
        return ConversationHandler.END

    # Stop and remove container if running
    if info.get("container_running"):
        try:
            container = docker_client.containers.get(info["container_name"])
            container.stop(timeout=10)
            container.remove(force=True)
            logger.info("Removed container %s", info["container_name"])
        except docker.errors.NotFound:
            pass
        except Exception:
            logger.exception("Failed to remove container %s", info["container_name"])

    delete_agent_info(info["telegram_user_id"])
    await query.edit_message_text(
        f'🗑️ Your agent "{info["agent_name"]}" has been deleted.\n'
        "Send /start to create a new one anytime."
    )
    return ConversationHandler.END


# ── App setup ─────────────────────────────────────────────────────────────────


telegram_app = Application.builder().token(SIGNUP_BOT_TOKEN).build()

# Main onboarding conversation
onboarding_conv = ConversationHandler(
    entry_points=[CommandHandler("start", start)],
    states={
        AGENT_NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, collect_agent_name)],
        STUDENT_NAME: [
            MessageHandler(filters.TEXT & ~filters.COMMAND, collect_student_name)
        ],
        BIO: [
            CallbackQueryHandler(collect_bio_callback),
            MessageHandler(filters.TEXT & ~filters.COMMAND, collect_bio_text),
        ],
    },
    fallbacks=[CommandHandler("cancel", cancel)],
)

# Rename conversation
rename_conv = ConversationHandler(
    entry_points=[CommandHandler("rename", rename_start)],
    states={
        RENAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, rename_finish)],
    },
    fallbacks=[CommandHandler("cancel", cancel)],
)

# Delete conversation
delete_conv = ConversationHandler(
    entry_points=[CommandHandler("delete", delete_start)],
    states={
        DELETE: [CallbackQueryHandler(delete_callback)],
    },
    fallbacks=[CommandHandler("cancel", cancel)],
)

telegram_app.add_handler(MessageHandler(filters.ALL, log_incoming_update), group=-1)
telegram_app.add_handler(onboarding_conv)
telegram_app.add_handler(rename_conv)
telegram_app.add_handler(delete_conv)
telegram_app.add_handler(CommandHandler("support", support_command))
telegram_app.add_error_handler(telegram_error_handler)
