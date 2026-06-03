from contextlib import asynccontextmanager

from fastapi import FastAPI, Header, HTTPException
from telegram import Update

from config import PROVISIONER_SECRET
from exceptions import AgentContainerError, AgentSetupError, DuplicateAgentError
from models import Phase2Request, ProvisionRequest
from provisioning import do_provision_phase1, do_provision_phase2, resume_provisioning
from storage import load_agent_info
from telegram_bot import BOT_COMMANDS, create_telegram_application
from utils import redact_secrets
from containers import refresh_agent_runtime_status

telegram_app = create_telegram_application()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await telegram_app.initialize()
    await telegram_app.start()
    await telegram_app.bot.set_my_commands(BOT_COMMANDS)
    await telegram_app.updater.start_polling(allowed_updates=Update.ALL_TYPES, drop_pending_updates=True)
    yield
    await telegram_app.updater.stop()
    await telegram_app.stop()
    await telegram_app.shutdown()


api = FastAPI(lifespan=lifespan)


def _check_secret(x_secret: str) -> None:
    if x_secret != PROVISIONER_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")


@api.post("/provision")
async def provision(req: ProvisionRequest, x_secret: str = Header(...)):
    _check_secret(x_secret)
    try:
        return await do_provision_phase1(req)
    except DuplicateAgentError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@api.post("/provision/phase2")
async def provision_phase2(req: Phase2Request, x_secret: str = Header(...)):
    _check_secret(x_secret)
    try:
        return await do_provision_phase2(req.telegram_user_id)
    except AgentContainerError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except AgentSetupError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@api.post("/provision/resume")
async def provision_resume(req: Phase2Request, x_secret: str = Header(...)):
    _check_secret(x_secret)
    try:
        return await resume_provisioning(req.telegram_user_id)
    except AgentContainerError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except AgentSetupError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@api.get("/provision/status/{telegram_user_id}")
async def provision_status(telegram_user_id: str, x_secret: str = Header(...)):
    _check_secret(x_secret)
    try:
        info = load_agent_info(telegram_user_id)
        if not info:
            raise HTTPException(status_code=404, detail="No agent found.")
        info = refresh_agent_runtime_status(info)
        return redact_secrets(info)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@api.get("/health")
def health():
    return {"status": "ok"}
