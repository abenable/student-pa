import logging
import os
import shlex
import time
from pathlib import Path

import docker

from app.core.config import (
    AGENT_DOCKER_NETWORK,
    AGENT_IMAGE,
    AGENTS_BASE_DIR,
    AGENTS_HOST_BASE_DIR,
    LITELLM_MODEL,
    LITELLM_OPENAI_BASE,
    docker_client,
)
from app.core.exceptions import AgentContainerError
from app.runtime.storage import update_agent_info
from app.core.utils import redact_text

logger = logging.getLogger(__name__)


def get_agent_docker_network() -> str:
    """Use the worker's network unless explicitly overridden."""
    if AGENT_DOCKER_NETWORK:
        return AGENT_DOCKER_NETWORK

    hostname = os.environ.get("HOSTNAME")
    if hostname:
        try:
            container = docker_client.containers.get(hostname)
            networks = container.attrs.get("NetworkSettings", {}).get("Networks", {})
            for network_name in networks:
                if network_name.endswith("_student-pa") or network_name == "student-pa":
                    return network_name
            for network_name in networks:
                if network_name not in {"bridge", "host", "none"}:
                    return network_name
        except Exception:
            logger.exception("Failed to inspect worker Docker network")

    return "student-pa"


def _host_student_dir(student_dir: Path) -> Path:
    student_dir = student_dir.resolve()
    base = AGENTS_BASE_DIR.resolve()
    relative = student_dir.relative_to(base)
    return (AGENTS_HOST_BASE_DIR / relative).resolve()


def _gateway_is_running(container) -> bool:
    result = container.exec_run("sh -lc \"ps -o args= | grep '[h]ermes gateway run'\"", user="hermes")
    return result.exit_code == 0


def _prepare_agent_mounts(container) -> None:
    result = container.exec_run(
        "chown -R hermes:hermes /home/hermes/.hermes /home/hermes/student-data",
        user="root",
    )
    if result.exit_code != 0:
        raise AgentContainerError(
            "Could not assign agent data mounts to the hermes user: "
            f"{redact_text(result.output.decode(errors='replace'))[:300]}"
        )


def _write_hermes_model_config(container) -> None:
    config = f"""model: custom:litellm:{LITELLM_MODEL}
providers:
  litellm:
    name: litellm
    base_url: {LITELLM_OPENAI_BASE}
    key_env: OPENAI_API_KEY
    model: {LITELLM_MODEL}
    models:
      - {LITELLM_MODEL}
"""
    command = "cat > /home/hermes/.hermes/config.yaml <<'EOF'\n" + config + "EOF\n"
    result = container.exec_run(f"sh -lc {shlex.quote(command)}", user="hermes")
    if result.exit_code != 0:
        raise AgentContainerError(
            "Could not write Hermes model config: "
            f"{redact_text(result.output.decode(errors='replace'))[:300]}"
        )


def refresh_agent_runtime_status(info: dict) -> dict:
    user_id = info.get("telegram_user_id")
    container_name = info.get("container_name")
    if not user_id or not container_name:
        return info

    try:
        container = docker_client.containers.get(container_name)
        container.reload()
    except docker.errors.NotFound:
        if info.get("container_running"):
            return update_agent_info(
                user_id,
                container_running=False,
                provisioning_status="container_pending",
                last_error="Agent container is missing from Docker.",
            )
        return info
    except Exception:
        logger.exception("Failed to refresh container status for %s", container_name)
        return info

    if container.status == "running" and _gateway_is_running(container):
        if not info.get("container_running"):
            return update_agent_info(
                user_id,
                container_running=True,
                provisioning_status="ready",
                last_error=None,
            )
        return info

    last_error = f"Agent container status is {container.status}."
    if container.status == "running":
        last_error = "Agent container is running, but the Telegram gateway process is not healthy."
    return update_agent_info(
        user_id,
        container_running=False,
        provisioning_status="container_pending",
        last_error=last_error,
    )


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
    for path in (student_dir, student_dir / "hermes-data", student_dir / "student-data"):
        try:
            os.chown(path, 1000, 1000)
        except PermissionError:
            logger.warning("Could not chown %s for hermes user", path)

    try:
        existing = docker_client.containers.get(container_name)
        existing.reload()
        if existing.status == "running":
            logger.info("Reusing running container %s", container_name)
            container = existing
        else:
            logger.info("Removing stale container %s with status=%s", container_name, existing.status)
            existing.remove(force=True)
            container = None
    except docker.errors.NotFound:
        container = None

    if container is None:
        try:
            docker_client.images.get(AGENT_IMAGE)
        except docker.errors.ImageNotFound:
            logger.info("Pulling missing agent image %s", AGENT_IMAGE)
            try:
                docker_client.images.pull(AGENT_IMAGE)
            except docker.errors.APIError as e:
                raise AgentContainerError(
                    f"Docker cannot pull agent image {AGENT_IMAGE!r}: {e.explanation or e}"
                ) from e
        except docker.errors.APIError as e:
            raise AgentContainerError(
                f"Docker cannot inspect agent image {AGENT_IMAGE!r}: {e.explanation or e}"
            ) from e

    env = {
        "LITELLM_API_BASE": LITELLM_OPENAI_BASE,
        "LITELLM_API_KEY": litellm_key,
        "DEFAULT_MODEL": LITELLM_MODEL,
        "HERMES_HOME": "/home/hermes/.hermes",
        "HERMES_INFERENCE_PROVIDER": "custom:litellm",
        "OPENAI_API_KEY": litellm_key,
        "OPENAI_BASE_URL": LITELLM_OPENAI_BASE,
        "HERMES_MODEL": LITELLM_MODEL,
        "TELEGRAM_BOT_TOKEN": bot_token,
        "TELEGRAM_ALLOWED_USERS": student_id,
        "TELEGRAM_HOME_CHANNEL": student_id,
        "STUDENT_NAME": student_name,
        "STUDENT_BIO": bio,
        "AGENT_NAME": agent_name,
    }

    if container is None:
        host_student_dir = _host_student_dir(student_dir)
        network_name = get_agent_docker_network()
        try:
            container = docker_client.containers.run(
                AGENT_IMAGE,
                name=container_name,
                detach=True,
                restart_policy={"Name": "unless-stopped"},
                environment=env,
                network=network_name,
                volumes={
                    str(host_student_dir / "hermes-data"): {
                        "bind": "/home/hermes/.hermes",
                        "mode": "rw",
                    },
                    str(host_student_dir / "student-data"): {
                        "bind": "/home/hermes/student-data",
                        "mode": "rw",
                    },
                },
                extra_hosts={"host.docker.internal": "host-gateway"},
                security_opt=["no-new-privileges:true"],
                cap_drop=["ALL"],
                cap_add=["DAC_OVERRIDE", "CHOWN", "FOWNER"],
            )
        except docker.errors.ImageNotFound as e:
            raise AgentContainerError(f"Docker cannot find agent image {AGENT_IMAGE!r} after pulling it.") from e
        except docker.errors.APIError as e:
            raise AgentContainerError(
                f"Docker cannot start agent image {AGENT_IMAGE!r}: {e.explanation or e}"
            ) from e

    deadline = time.time() + 30
    while time.time() < deadline:
        container.reload()
        if container.status == "running":
            break
        time.sleep(1)
    else:
        raise AgentContainerError(f"Container {container_name} did not reach running state in 30s.")

    _prepare_agent_mounts(container)
    _write_hermes_model_config(container)

    result = container.exec_run("hermes setup --non-interactive", user="hermes")
    setup_output = redact_text(result.output.decode(errors="replace"))
    logger.info("hermes setup exit=%d: %s", result.exit_code, setup_output[:500])
    if result.exit_code != 0:
        raise AgentContainerError(
            f"hermes setup failed with exit code {result.exit_code}: "
            f"{setup_output[:300]}"
        )

    result = container.exec_run("hermes gateway run", detach=True, user="hermes")
    if result.exit_code not in (0, None):
        raise AgentContainerError(
            f"Telegram gateway failed to start with exit code {result.exit_code}: "
            f"{redact_text(result.output.decode(errors='replace'))[:300]}"
        )

    time.sleep(2)
    if not _gateway_is_running(container):
        raise AgentContainerError("Telegram gateway process did not remain running after startup.")
    logger.info("Telegram gateway started for container %s", container_name)


def stop_and_remove_container(container_name: str) -> None:
    try:
        container = docker_client.containers.get(container_name)
        container.stop(timeout=10)
        container.remove(force=True)
        logger.info("Removed container %s", container_name)
    except docker.errors.NotFound:
        pass
    except Exception:
        logger.exception("Failed to remove container %s", container_name)
