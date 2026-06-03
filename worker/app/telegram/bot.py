import logging
import time

from telegram import BotCommand, InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    ConversationHandler,
    MessageHandler,
    filters,
)

from app.core.config import SIGNUP_BOT_TOKEN
from app.core.exceptions import AgentContainerError, AgentSetupError, BotFatherError, DuplicateAgentError
from app.core.models import ProvisionRequest
from app.runtime.provisioning import delete_agent_runtime, do_provision_phase1, do_provision_phase2, ensure_litellm_key
from app.runtime.storage import (
    delete_onboarding_state,
    load_agent_info,
    load_onboarding_state,
    save_agent_info,
    save_onboarding_state,
)
from app.runtime.containers import refresh_agent_runtime_status

logger = logging.getLogger(__name__)

BOT_COMMANDS = [
    BotCommand("start", "Set up your personal AI agent"),
    BotCommand("status", "Check your agent setup status"),
    BotCommand("retry", "Retry a pending agent setup"),
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


def _agent_status_message(info: dict) -> str:
    status = info.get("provisioning_status") or ("ready" if info.get("container_running") else "container_pending")
    bot_username = info.get("bot_username", "unknown")
    agent_name = info.get("agent_name", "your agent")
    attempts = info.get("phase2_attempts", 0)
    last_error = info.get("last_error")

    bot_created = bool(info.get("bot_username") and info.get("bot_token"))
    key_created = bool(info.get("litellm_key"))
    container_ready = bool(info.get("container_running") and status == "ready")

    if status == "ready" and container_ready:
        return (
            f"✅ *Your agent is ready*\n\n"
            f"*Agent:* {agent_name}\n"
            f"*Bot:* @{bot_username}\n\n"
            f"DM @{bot_username} to chat with your agent."
        )

    checklist = ""
    checklist += f"{'✅' if bot_created else '⏳'} Telegram Bot created"
    if bot_created:
        checklist += f" (@{bot_username})"
    checklist += "\n"
    checklist += f"{'✅' if key_created else '⏳'} API key generated\n"
    checklist += f"{'✅' if container_ready else '❌'} Agent container ready"

    if status in {"bot_created", "creating_key", "key_pending", "starting_container", "container_retrying"}:
        header = f"⏳ *Setup in progress* — *{agent_name}*\n\n"
        footer = f"\nContainer attempts: {attempts}\n\nSend /status to check again or /retry to continue setup."
        return header + checklist + footer

    header = f"⚠️ *Setup needs attention* — *{agent_name}*\n\n"
    footer = f"\nContainer attempts: {attempts}\n\nSend /retry after the server/image issue is fixed."
    if last_error:
        footer += f"\n\n*Last error:* `{last_error[:400]}`"
    return header + checklist + footer


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    user_id = str(update.effective_user.id)
    existing = load_agent_info(user_id)
    if existing:
        existing = refresh_agent_runtime_status(existing)
        await update.message.reply_text(_agent_status_message(existing))
        return ConversationHandler.END

    progress = load_onboarding_state(user_id)
    if progress:
        step = progress.get("step")
        context.user_data["agent_name"] = progress.get("agent_name")
        context.user_data["student_name"] = progress.get("student_name")
        context.user_data["bio"] = progress.get("bio")

        if step == "AGENT_NAME":
            await update.message.reply_text("⏳ You already started creating an agent.\n\nWhat would you like to name your agent?")
            return AGENT_NAME
        if step == "STUDENT_NAME":
            agent_name = progress.get("agent_name", "your agent")
            await update.message.reply_text(f'You named it "{agent_name}".\n\nWhat is your first name?')
            return STUDENT_NAME
        if step in ("BIO", "provisioning"):
            keyboard = [[InlineKeyboardButton(text, callback_data=value)] for text, value in BIO_OPTIONS]
            await update.message.reply_text(
                "Almost done — tell me a bit about yourself:\nTap an option below or type your own.",
                reply_markup=InlineKeyboardMarkup(keyboard),
            )
            return BIO

    save_onboarding_state(
        user_id,
        {
            "step": "AGENT_NAME",
            "agent_name": None,
            "student_name": None,
            "bio": None,
            "created_at": int(time.time()),
        },
    )

    await update.message.reply_text(
        "👋 Welcome to Student-PA!\n\n"
        "I'll set up your personal AI agent in about 30 seconds.\n\n"
        "What would you like to name your agent? (e.g. StudyBuddy, Max, Aria)"
    )
    return AGENT_NAME


async def log_incoming_update(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = update.effective_user.id if update.effective_user else None
    chat_id = update.effective_chat.id if update.effective_chat else None

    if update.effective_message:
        text = update.effective_message.text or update.effective_message.caption or ""
        logger.info("Incoming Telegram message user_id=%s chat_id=%s text=%r", user_id, chat_id, text[:120])
    elif update.callback_query:
        logger.info("Incoming Telegram callback user_id=%s chat_id=%s data=%r", user_id, chat_id, update.callback_query.data)


async def telegram_error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    error = context.error
    logger.error(
        "Telegram handler failed for update=%r",
        update,
        exc_info=(type(error), error, error.__traceback__) if error else None,
    )


async def collect_agent_name(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data["agent_name"] = update.message.text.strip()
    save_onboarding_state(
        str(update.effective_user.id),
        {
            "step": "STUDENT_NAME",
            "agent_name": context.user_data["agent_name"],
            "student_name": None,
            "bio": None,
        },
    )
    await update.message.reply_text("Nice! What's your first name?")
    return STUDENT_NAME


async def collect_student_name(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data["student_name"] = update.message.text.strip()
    save_onboarding_state(
        str(update.effective_user.id),
        {
            "step": "BIO",
            "agent_name": context.user_data["agent_name"],
            "student_name": context.user_data["student_name"],
            "bio": None,
        },
    )

    keyboard = [[InlineKeyboardButton(text, callback_data=value)] for text, value in BIO_OPTIONS]
    await update.message.reply_text(
        "Last question — tell me a bit about yourself:\nTap an option below or type your own.",
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
    user_id = str(update.effective_user.id)
    save_onboarding_state(
        user_id,
        {
            "step": "provisioning",
            "agent_name": context.user_data.get("agent_name"),
            "student_name": context.user_data.get("student_name"),
            "bio": context.user_data.get("bio"),
        },
    )

    await _reply_text(update, context, f'⏳ Creating your personal agent "{agent_name}"...\nThis takes about 30 seconds.')

    req = ProvisionRequest(
        telegram_user_id=user_id,
        telegram_username=update.effective_user.username or "",
        agent_name=agent_name,
        student_name=context.user_data["student_name"],
        bio=context.user_data["bio"],
    )

    try:
        data = await do_provision_phase1(req)
        await _reply_text(update, context, f"✅ Bot created: @{data['bot_username']}\n\nStarting your agent container now. This can take a moment.")
        data = await do_provision_phase2(req.telegram_user_id)
        await _reply_text(update, context, _agent_status_message(data))
        delete_onboarding_state(user_id)
    except DuplicateAgentError as e:
        await _reply_text(update, context, f"❌ {e}")
    except BotFatherError as e:
        logger.error("BotFather error: %s", e)
        save_onboarding_state(
            user_id,
            {
                "step": "provisioning",
                "agent_name": context.user_data.get("agent_name"),
                "student_name": context.user_data.get("student_name"),
                "bio": context.user_data.get("bio"),
                "last_error": str(e),
            },
        )
        await _reply_text(update, context, "❌ Could not create the bot via BotFather. The username might be taken or you're rate-limited. Please try again.")
    except AgentContainerError as e:
        logger.exception("Agent container startup failed")
        save_onboarding_state(user_id, {"step": "provisioning", "agent_name": context.user_data.get("agent_name"), "student_name": context.user_data.get("student_name"), "bio": context.user_data.get("bio"), "last_error": str(e)})
        info = load_agent_info(req.telegram_user_id)
        if info:
            await _reply_text(update, context, "⚠️ Bot was created, but the agent container couldn't start.\n\n" + _agent_status_message(info))
        else:
            await _reply_text(update, context, f"❌ {e}")
    except AgentSetupError as e:
        logger.exception("Agent setup failed")
        save_onboarding_state(user_id, {"step": "provisioning", "agent_name": context.user_data.get("agent_name"), "student_name": context.user_data.get("student_name"), "bio": context.user_data.get("bio"), "last_error": str(e)})
        info = load_agent_info(req.telegram_user_id)
        if info:
            await _reply_text(update, context, "⚠️ Bot was created, but something else went wrong.\n\n" + _agent_status_message(info))
        else:
            await _reply_text(update, context, f"❌ {e}")
    except Exception as e:
        logger.exception("Unexpected error during provisioning")
        save_onboarding_state(user_id, {"step": "provisioning", "agent_name": context.user_data.get("agent_name"), "student_name": context.user_data.get("student_name"), "bio": context.user_data.get("bio"), "last_error": str(e)})
        await _reply_text(update, context, "❌ Something went wrong while creating your agent. Please try again or contact support.")

    return ConversationHandler.END


async def _reply_text(update: Update, context: ContextTypes.DEFAULT_TYPE, text: str, parse_mode=None):
    if update.callback_query:
        return await update.callback_query.edit_message_text(text, parse_mode=parse_mode)
    return await update.message.reply_text(text, parse_mode=parse_mode)


async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text("Setup cancelled. Send /start to try again.")
    return ConversationHandler.END


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


async def status_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = str(update.effective_user.id)
    info = load_agent_info(user_id)
    if info:
        info = refresh_agent_runtime_status(info)
        await update.message.reply_text(_agent_status_message(info))
        return

    progress = load_onboarding_state(user_id)
    if progress:
        step = progress.get("step")
        if step == "AGENT_NAME":
            msg = "⏳ Onboarding in progress — you still need to pick an agent name.\nSend /start to continue."
        elif step == "STUDENT_NAME":
            agent_name = progress.get("agent_name", "your agent")
            msg = f'⏳ Onboarding in progress — you named it "{agent_name}" but still need to give your name.\nSend /start to continue.'
        elif step == "BIO":
            agent_name = progress.get("agent_name", "your agent")
            msg = f'⏳ Onboarding in progress — you named it "{agent_name}" and gave your name, but still need to choose a bio.\nSend /start to continue.'
        elif step == "provisioning":
            agent_name = progress.get("agent_name", "your agent")
            last_error = progress.get("last_error")
            msg = (
                f'⏳ Setup in progress for "{agent_name}".\n'
                "The bot was created but the container may still be spinning up.\n"
                "Send /retry to continue, or /start to check the latest status."
            )
            if last_error:
                msg += f"\n\nLast error: `{last_error[:300]}`"
        else:
            msg = "⏳ Onboarding in progress. Send /start to continue."
        await update.message.reply_text(msg)
        return

    await update.message.reply_text("You do not have an agent yet. Send /start to create one.")


async def retry_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = str(update.effective_user.id)
    info = load_agent_info(user_id)
    if not info:
        await update.message.reply_text("You do not have an agent yet. Send /start to create one.")
        return
    info = refresh_agent_runtime_status(info)
    if info.get("container_running") and info.get("provisioning_status") == "ready":
        await update.message.reply_text(_agent_status_message(info))
        return

    if not info.get("bot_token"):
        await update.message.reply_text("❌ Your agent setup has not started yet. Send /start to begin.")
        return

    needs_key = not info.get("litellm_key")
    needs_container = not info.get("container_running")
    steps = []
    if needs_key:
        steps.append("generate API key")
    if needs_container:
        steps.append("start container")

    await update.message.reply_text(
        f"🔄 Resuming setup for @{info['bot_username']}...\n"
        f"Steps remaining: {', '.join(steps)}.\n"
        "I will update you when done."
    )

    try:
        if needs_key:
            info = await ensure_litellm_key(user_id, info)
        if not info.get("container_running"):
            info = await do_provision_phase2(user_id)
        await update.message.reply_text(_agent_status_message(info))
    except (AgentContainerError, AgentSetupError):
        logger.exception("Manual retry failed for user %s", user_id)
        info = load_agent_info(user_id)
        await update.message.reply_text(_agent_status_message(info))
    except Exception:
        logger.exception("Unexpected manual retry failure for user %s", user_id)
        await update.message.reply_text("Retry failed unexpectedly. Send /status to see the current saved state.")


async def continue_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    user_id = str(update.effective_user.id)
    progress = load_onboarding_state(user_id)
    if not progress:
        await update.message.reply_text("You do not have an ongoing onboarding. Send /start to create an agent.")
        return ConversationHandler.END

    step = progress.get("step")
    context.user_data["agent_name"] = progress.get("agent_name")
    context.user_data["student_name"] = progress.get("student_name")
    context.user_data["bio"] = progress.get("bio")

    if step == "AGENT_NAME":
        await update.message.reply_text("⏳ You already started creating an agent.\n\nWhat would you like to name your agent?")
        return AGENT_NAME
    if step == "STUDENT_NAME":
        agent_name = progress.get("agent_name", "your agent")
        await update.message.reply_text(f'You named it "{agent_name}".\n\nWhat is your first name?')
        return STUDENT_NAME
    if step in ("BIO", "provisioning"):
        keyboard = [[InlineKeyboardButton(text, callback_data=value)] for text, value in BIO_OPTIONS]
        await update.message.reply_text(
            "Almost done — tell me a bit about yourself:\nTap an option below or type your own.",
            reply_markup=InlineKeyboardMarkup(keyboard),
        )
        return BIO
    await update.message.reply_text("⏳ Onboarding in progress. Send /start to continue.")
    return ConversationHandler.END


async def rename_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    info = load_agent_info(str(update.effective_user.id))
    if not info:
        await update.message.reply_text("❌ You don't have an agent yet. Send /start to create one.")
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
        await update.message.reply_text("❌ You don't have an agent yet. Send /start to create one.")
        return ConversationHandler.END

    context.user_data["_delete_agent"] = info
    keyboard = [
        [InlineKeyboardButton("✅ Yes, delete everything", callback_data="delete_confirm")],
        [InlineKeyboardButton("❌ No, keep it", callback_data="delete_cancel")],
    ]
    await update.message.reply_text(
        f'⚠️ Are you sure you want to delete your agent "{info["agent_name"]}"?\n\n'
        f'This will stop @{info["bot_username"]}, revoke the LiteLLM key, and remove local data.',
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

    await delete_agent_runtime(info)
    await query.edit_message_text(
        f'🗑️ Your agent "{info["agent_name"]}" has been deleted.\n'
        "Send /start to create a new one anytime."
    )
    return ConversationHandler.END


def create_telegram_application() -> Application:
    telegram_app = Application.builder().token(SIGNUP_BOT_TOKEN).build()

    onboarding_conv = ConversationHandler(
        entry_points=[CommandHandler("start", start), CommandHandler("continue", continue_command)],
        states={
            AGENT_NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, collect_agent_name)],
            STUDENT_NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, collect_student_name)],
            BIO: [CallbackQueryHandler(collect_bio_callback), MessageHandler(filters.TEXT & ~filters.COMMAND, collect_bio_text)],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
    )

    rename_conv = ConversationHandler(
        entry_points=[CommandHandler("rename", rename_start)],
        states={RENAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, rename_finish)]},
        fallbacks=[CommandHandler("cancel", cancel)],
    )

    delete_conv = ConversationHandler(
        entry_points=[CommandHandler("delete", delete_start)],
        states={DELETE: [CallbackQueryHandler(delete_callback)]},
        fallbacks=[CommandHandler("cancel", cancel)],
    )

    telegram_app.add_handler(MessageHandler(filters.ALL, log_incoming_update), group=-1)
    telegram_app.add_handler(onboarding_conv)
    telegram_app.add_handler(rename_conv)
    telegram_app.add_handler(delete_conv)
    telegram_app.add_handler(CommandHandler("status", status_command))
    telegram_app.add_handler(CommandHandler("retry", retry_command))
    telegram_app.add_handler(CommandHandler("support", support_command))
    telegram_app.add_error_handler(telegram_error_handler)
    return telegram_app
