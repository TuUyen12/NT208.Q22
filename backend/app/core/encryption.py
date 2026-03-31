"""AES-256-GCM encryption for sensitive fields (dob_solar, birth_hour) — Req 23."""

import base64
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.config import get_settings

settings = get_settings()


def _get_key() -> bytes:
    key_hex = settings.FIELD_ENCRYPTION_KEY
    return bytes.fromhex(key_hex)


def encrypt_field(plaintext: str) -> str:
    key = _get_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ct = aesgcm.encrypt(nonce, plaintext.encode(), None)
    return base64.b64encode(nonce + ct).decode()


def decrypt_field(ciphertext: str) -> str:
    key = _get_key()
    aesgcm = AESGCM(key)
    raw = base64.b64decode(ciphertext.encode())
    nonce, ct = raw[:12], raw[12:]
    return aesgcm.decrypt(nonce, ct, None).decode()
