"""Hash demo officer passwords without storing them in source."""

import hashlib
import hmac
import secrets
import sys

ITERATIONS = 310000


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), salt.encode(), ITERATIONS
    ).hex()
    return f"pbkdf2_sha256${ITERATIONS}${salt}${digest}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, iterations, salt, expected = encoded.split("$")
        if algorithm != "pbkdf2_sha256" or not 100000 <= int(iterations) <= 2000000:
            return False
        actual = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), salt.encode(), int(iterations)
        ).hex()
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


if __name__ == "__main__":
    import getpass

    print(hash_password(getpass.getpass("Demo officer password: ")))
