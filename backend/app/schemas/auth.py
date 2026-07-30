from pydantic import BaseModel, Field

from app.schemas.user import UserRead
from app.schemas.workspace import WorkspaceMembershipRead


class RegisterRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)


class RegisterResponse(BaseModel):
    message: str
    verification_code: str | None = None


class VerifyEmailRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class ResendVerificationCodeRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=128)


class ForgotPasswordRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)


class ForgotPasswordResponse(BaseModel):
    message: str
    reset_token: str | None = None


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)


class MessageResponse(BaseModel):
    message: str


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class CurrentUserResponse(BaseModel):
    user: UserRead
    workspaces: list[WorkspaceMembershipRead]
