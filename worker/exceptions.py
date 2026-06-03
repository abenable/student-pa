class DuplicateAgentError(Exception):
    """Raised when an agent already exists for a user."""


class BotFatherError(Exception):
    """Raised when BotFather automation fails."""


class AgentContainerError(Exception):
    """Raised when the per-student agent container cannot be started."""


class AgentSetupError(Exception):
    """Raised when an agent exists but is not fully ready yet."""
