import hashlib, os, secrets
def hash_password(p): s=os.urandom(16).hex(); return f"{s}:{hashlib.sha256((s+p).encode()).hexdigest()}"
def verify_password(p,h):
    try: s,hh=h.split(':'); return hashlib.sha256((s+p).encode()).hexdigest()==hh
    except: return False

def hash_api_key(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()

def generate_api_key() -> tuple[str, str]:
    plaintext = "rdc_" + secrets.token_urlsafe(32)
    return plaintext, hash_api_key(plaintext)

from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request

def role_required(*roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get('role') not in roles:
                return jsonify({'error': 'Insufficient permissions'}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator
