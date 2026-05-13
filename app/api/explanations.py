"""Explanation endpoints. Reads from Explanation table + falls back to mock."""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app import limiter
from app.database.models import Explanation, URLSubmission, db
from app.interfaces.contracts import to_json
from app.interfaces.mocks import generate_explanation

explanations_bp = Blueprint("explanations", __name__)

# Default SHAP feature contributions returned when we don't have a per-URL
# breakdown stored. Frontend uses these to draw the indicator bars.
_DEFAULT_TOP_FEATURES = [
    ("url_length", 0.34),
    ("has_ip", 0.22),
    ("suspicious_tld", 0.18),
    ("redirect_count", 0.14),
    ("domain_age", 0.12),
]


def _stored_payload(scan_id: int, stored: Explanation, submission: URLSubmission):
    top = list(_DEFAULT_TOP_FEATURES)
    return {
        "scan_id": scan_id,
        "method": (stored.method or "SHAP") if stored else "SHAP",
        "summary_text": stored.rationale if stored else "",
        "top_features": top,
        "shap_values": {name: score for name, score in top},
        "confidence": submission.confidence,
        "created_at": stored.creationTime.isoformat() if stored and stored.creationTime else None,
    }


@explanations_bp.get("/<int:scan_id>")
@jwt_required()
@limiter.limit("120/minute")
def get_explanation(scan_id: int):
    submission = db.session.get(URLSubmission, scan_id)
    if not submission:
        return jsonify({"error": "scan not found"}), 404
    stored = (
        Explanation.query.filter_by(submission_id=scan_id)
        .order_by(Explanation.creationTime.desc())
        .first()
    )
    if stored:
        return jsonify(_stored_payload(scan_id, stored, submission)), 200
    # Fallback: synthesize via the mock (also fills top_features with real
    # feature names when sklearn is available).
    mock = generate_explanation(scan_id, submission.url)
    payload = to_json(mock)
    payload["confidence"] = submission.confidence
    return jsonify(payload), 200


@explanations_bp.post("/generate")
@jwt_required()
@limiter.limit("30/minute")
def generate():
    data = request.get_json(silent=True) or {}
    scan_id = data.get("scan_id")
    if not isinstance(scan_id, int):
        return jsonify({"error": "scan_id (int) is required"}), 400
    submission = db.session.get(URLSubmission, scan_id)
    if not submission:
        return jsonify({"error": "scan not found"}), 404
    result = generate_explanation(scan_id, submission.url)
    payload = to_json(result)
    payload["confidence"] = submission.confidence
    return jsonify(payload), 201
