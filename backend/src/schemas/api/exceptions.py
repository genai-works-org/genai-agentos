from pydantic import BaseModel


class IntegrityErrorDetails(BaseModel):
    column: str
    value: str
