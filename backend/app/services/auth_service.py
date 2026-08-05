from dataclasses import dataclass

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.core.config import settings


@dataclass
class GoogleProfile:
    sub: str
    email: str
    full_name: str
    email_verified: bool


def verify_google_id_token(token: str) -> GoogleProfile:
    if not settings.google_client_id:
        raise ValueError("Google OAuth is not configured on this server")

    claims = id_token.verify_oauth2_token(token, google_requests.Request(), settings.google_client_id)

    return GoogleProfile(
        sub=claims["sub"],
        email=claims["email"],
        full_name=claims.get("name", claims["email"]),
        email_verified=claims.get("email_verified", False),
    )
