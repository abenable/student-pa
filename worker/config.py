import logging
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

import docker

logging.basicConfig(level=logging.INFO)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("telegram.request").setLevel(logging.WARNING)

SIGNUP_BOT_TOKEN = os.environ["SIGNUP_BOT_TOKEN"]
PROVISIONER_SECRET = os.environ["PROVISIONER_SECRET"]

LITELLM_OPENAI_BASE = os.environ.get("LITELLM_OPENAI_BASE", "https://litellm.byte10x.dev/v1")
LITELLM_ADMIN_BASE = os.environ.get("LITELLM_ADMIN_BASE", LITELLM_OPENAI_BASE.removesuffix("/v1"))
LITELLM_ADMIN_KEY = os.environ["LITELLM_ADMIN_KEY"]
LITELLM_MODEL = "Mythos"
LITELLM_KEY_TTL_SECONDS = int(os.environ.get("LITELLM_KEY_TTL_SECONDS", str(7 * 24 * 60 * 60)))

AGENT_IMAGE = os.environ.get("AGENT_IMAGE", "student-pa-agent:latest")
AGENTS_BASE_DIR = Path(os.environ.get("AGENTS_BASE_DIR", "/agents"))
if not AGENTS_BASE_DIR.is_absolute() and Path("/agents").exists():
    AGENTS_BASE_DIR = Path("/agents")
AGENTS_HOST_BASE_DIR = Path(os.environ.get("AGENTS_HOST_BASE_DIR", str(AGENTS_BASE_DIR)))
if not AGENTS_HOST_BASE_DIR.is_absolute():
    raise RuntimeError("AGENTS_HOST_BASE_DIR must be an absolute host path for Docker bind mounts.")
DEFAULT_MODEL = os.environ.get("DEFAULT_MODEL", "Mythos")
PROVISION_RETRIES = int(os.environ.get("PROVISION_RETRIES", "3"))
PROVISION_RETRY_DELAY_SECONDS = int(os.environ.get("PROVISION_RETRY_DELAY_SECONDS", "10"))
AGENT_DOCKER_NETWORK = os.environ.get("AGENT_DOCKER_NETWORK")

TG_API_ID = int(os.environ["TELEGRAM_API_ID"])
TG_API_HASH = os.environ["TELEGRAM_API_HASH"]
TG_SESSION = os.environ.get("TELEGRAM_SESSION", "./botfather_session")

Path(TG_SESSION).parent.mkdir(parents=True, exist_ok=True)
AGENTS_BASE_DIR.mkdir(parents=True, exist_ok=True)

docker_client = docker.from_env()
