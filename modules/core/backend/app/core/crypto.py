"""
Field-level encryption helpers.

We use AES-GCM with a single master key (`VAULT_ENCRYPTION_KEY` env var,
32 raw bytes encoded as base64). For each ciphertext we generate a fresh
12-byte nonce so identical plaintexts yield different ciphertexts.

Stored format:
    enc:v1:<base64(nonce || ciphertext_with_tag)>

`enc:v1:` is the marker that tells the read path "this is encrypted".
Anything without the marker is returned as-is — that's the migration
escape hatch so existing plaintext data can still be read.

For production, replace the env-var master key with a KMS-backed key
(AWS KMS, GCP KMS, HashiCorp Vault). The wire format stays the same; only
the key source changes.
"""
from __future__ import annotations

import base64
import functools
import logging
import os
from typing import Any

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

log = logging.getLogger(__name__)

_PREFIX = "enc:v1:"
_DEFAULT_DEV_KEY_B64 = "Vm91blJqYjBhVHhxK0RVRWp1VUxYTHpHcExuTGFLczg="  # 32 bytes, dev-only


@functools.lru_cache(maxsize=1)
def _master_key() -> AESGCM:
    raw = os.environ.get("VAULT_ENCRYPTION_KEY", _DEFAULT_DEV_KEY_B64)
    try:
        key = base64.b64decode(raw)
    except Exception:
        # If it's not base64 (someone pasted raw bytes), try utf-8 → bytes.
        key = raw.encode("utf-8")
    if len(key) != 32:
        # Pad or truncate to 32 bytes; warn — production should set a real key.
        log.warning(
            "VAULT_ENCRYPTION_KEY is %d bytes after b64 decode (want 32). "
            "Falling back to padded key. Set a proper 32-byte base64 key in production.",
            len(key),
        )
        key = (key + b"\0" * 32)[:32]
    return AESGCM(key)


def encrypt(plaintext: Any) -> str:
    """Encrypt a value and return a string with the enc:v1: marker.

    Non-string inputs are coerced to JSON-style strings first. None and
    empty strings pass through unchanged so empty fields don't grow
    needless ciphertext.
    """
    if plaintext is None or plaintext == "":
        return plaintext
    if not isinstance(plaintext, str):
        plaintext = str(plaintext)
    nonce = os.urandom(12)
    ct = _master_key().encrypt(nonce, plaintext.encode("utf-8"), None)
    return _PREFIX + base64.b64encode(nonce + ct).decode("ascii")


def decrypt(value: Any) -> Any:
    """Decrypt a value if it has the marker. Otherwise return as-is.

    Failure to decrypt is treated as plaintext to avoid losing data on
    key changes; the caller logs a warning.
    """
    if not isinstance(value, str) or not value.startswith(_PREFIX):
        return value
    try:
        blob = base64.b64decode(value[len(_PREFIX):])
        nonce, ct = blob[:12], blob[12:]
        return _master_key().decrypt(nonce, ct, None).decode("utf-8")
    except (InvalidTag, ValueError, Exception) as e:  # pragma: no cover
        log.warning("Failed to decrypt field; returning ciphertext as-is. %s", e)
        return value


def is_encrypted(value: Any) -> bool:
    return isinstance(value, str) and value.startswith(_PREFIX)
