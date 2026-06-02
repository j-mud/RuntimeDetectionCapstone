"""Explanation endpoints. Reads from Explanation table + falls back to mock."""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app import limiter
from app.database.models import Explanation, URLSubmission, db
from app.interfaces.contracts import to_json
from app.interfaces.mocks import generate_explanation

explanations_bp = Blueprint("explanations", __name__)


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
    result = generate_explanation(scan_id, submission.url, confidence=submission.confidence or 0.0)
    payload = to_json(result)
    payload["confidence"] = submission.confidence
    if stored:
        payload["summary_text"] = stored.rationale
        payload["method"] = stored.method or payload.get("method", "SHAP")
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
