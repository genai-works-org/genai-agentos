from typing import Optional

from pydantic import BaseModel, SecretStr, field_validator
from src.utils.constants import SPECIAL_CHARS


class UserPassword(BaseModel):
    password: SecretStr

    @field_validator("password")
    def validate_password(cls, v: SecretStr):
        if len(v) < 8:
            raise ValueError("Password must be longer than 8 symbols")

        if not any(char in v.get_secret_value() for char in SPECIAL_CHARS):
            raise ValueError("Password must contain a special character")

        if not any(char.isupper() for char in v.get_secret_value()):
            raise ValueError("Password must contain an uppercase character")

        if not any(char.islower() for char in v.get_secret_value()):
            raise ValueError("Password must contain an lowercase character")

        if not any(char.isnumeric() for char in v.get_secret_value()):
            raise ValueError("Password must contain an numeric character")

        return v


class UserCreate(UserPassword):
    username: str


class UserUpdate(UserPassword):
    pass


class TokenValidationInput(BaseModel):
    token: str


class UserProfileCRUDUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
