import random
import string
from typing import Optional

from src.auth.jwt import TokenLifespanType, validate_token


def generate_alias(agent_name: str):
    rand_alnum_str = "".join(random.choice(string.ascii_lowercase) for _ in range(6))

    return f"{agent_name}_{rand_alnum_str}"


def get_user_id_from_jwt(token: str) -> Optional[str]:
    token_data = validate_token(token=token, lifespan_type=TokenLifespanType.api)
    return token_data.sub
