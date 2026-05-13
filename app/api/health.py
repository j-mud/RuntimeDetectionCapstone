"""Health check endpoint."""
from flask import Blueprint, jsonify

health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health():
    return jsonify({
        "status": "healthy",
        "service": "RUNTIME MALWEB DETECTOR",
    }), 200
