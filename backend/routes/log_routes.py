from flask import Blueprint, request, jsonify
from database import db
from services.groq_service import analyze_study

log_routes = Blueprint("log_routes", __name__)


@log_routes.route("/api/logs", methods=["POST"])
def save_logs():
    data = request.json

    if not data:
        return jsonify({"error": "No data provided"}), 400

    notes = data.get("notes", "")

    # Fix: Wrap AI call in try/except so a Gemini failure doesn't crash the route
    try:
        ai_feedback = analyze_study(notes)
    except Exception as e:
        ai_feedback = f"AI analysis failed: {str(e)}"

    log = {
        "topicsStudied": data.get("topicsStudied"),
        "studyTime": data.get("studyTime"),
        "wasteTime": data.get("wasteTime"),
        "notes": notes,
        "aiFeedback": ai_feedback
    }

    try:
        db.logs.insert_one(log)
        # Fix: Remove MongoDB's _id field before returning — ObjectId is not JSON serializable
        log.pop("_id", None)
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

    return jsonify({
        "message": "Study log saved successfully",
        "ai_analysis": ai_feedback
    }), 201


@log_routes.route("/api/logs", methods=["GET"])
def get_logs():
    """Fetch all study logs from the database."""
    try:
        logs = list(db.logs.find())
        # Fix: Convert ObjectId to string for each log
        for log in logs:
            log["_id"] = str(log["_id"])
        return jsonify(logs), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch logs: {str(e)}"}), 500