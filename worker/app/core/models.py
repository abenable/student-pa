from pydantic import BaseModel, Field, field_validator


class ProvisionRequest(BaseModel):
    telegram_user_id: str = Field(pattern=r"^\d+$")
    telegram_username: str = ""
    agent_name: str
    student_name: str
    bio: str

    @field_validator("telegram_user_id", mode="before")
    @classmethod
    def coerce_telegram_user_id(cls, value):
        return str(value)


class Phase2Request(BaseModel):
    telegram_user_id: str = Field(pattern=r"^\d+$")

    @field_validator("telegram_user_id", mode="before")
    @classmethod
    def coerce_telegram_user_id(cls, value):
        return str(value)
