import json
import re
import time
from pathlib import Path

from config import AGENTS_BASE_DIR
from utils import SECRET_KEYS

_USER_ID_RE = re.compile(r"^\d+$")


def validate_user_id(user_id: str) -> str:
    user_id = str(user_id)
    if not _USER_ID_RE.fullmatch(user_id):
        raise ValueError("telegram_user_id must be a numeric Telegram user ID.")
    return user_id


def _user_dir(user_id: str) -> Path:
    user_id = validate_user_id(user_id)
    path = (AGENTS_BASE_DIR / user_id).resolve()
    base = AGENTS_BASE_DIR.resolve()
    if not path.is_relative_to(base):
        raise ValueError("Invalid user path.")
    return path


def agent_dir(user_id: str) -> Path:
    return _user_dir(user_id)


def _agent_file(user_id: str) -> Path:
    return _user_dir(user_id) / "agent.json"


def _secrets_file(user_id: str) -> Path:
    return _user_dir(user_id) / "secrets.json"


def _onboarding_file(user_id: str) -> Path:
    return _user_dir(user_id) / "onboarding.json"


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
    """Persist agent public data and secrets separately with atomic writes."""
    path = _agent_file(user_id)
    path.parent.mkdir(parents=True, exist_ok=True)

    secrets = {k: v for k, v in data.items() if k in SECRET_KEYS}
    public = {k: v for k, v in data.items() if k not in SECRET_KEYS}

    tmp_path = path.with_suffix(".tmp")
    with open(tmp_path, "w") as f:
        json.dump(public, f, indent=2)
    tmp_path.replace(path)

    if secrets:
        secrets_path = _secrets_file(user_id)
        tmp_secrets = secrets_path.with_suffix(".tmp")
        with open(tmp_secrets, "w") as f:
            json.dump(secrets, f, indent=2)
        tmp_secrets.replace(secrets_path)
        secrets_path.chmod(0o600)


def delete_agent_info(user_id: str) -> None:
    for path in (_agent_file(user_id), _secrets_file(user_id)):
        if path.exists():
            path.unlink()


def update_agent_info(user_id: str, **updates) -> dict:
    info = load_agent_info(user_id) or {}
    info.update(updates)
    info["updated_at"] = int(time.time())
    save_agent_info(user_id, info)
    return info


def load_onboarding_state(user_id: str) -> dict | None:
    path = _onboarding_file(user_id)
    if not path.exists():
        return None
    with open(path) as f:
        return json.load(f)


def save_onboarding_state(user_id: str, data: dict) -> None:
    path = _onboarding_file(user_id)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(".tmp")
    with open(tmp_path, "w") as f:
        json.dump(data, f, indent=2)
    tmp_path.replace(path)


def delete_onboarding_state(user_id: str) -> None:
    path = _onboarding_file(user_id)
    if path.exists():
        path.unlink()
