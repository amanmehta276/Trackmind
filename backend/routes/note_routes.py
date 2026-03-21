from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify
from bson import ObjectId
from database import db
from services.groq_service import analyze_study, analyze_study_with_image
from middleware import token_required

note_routes = Blueprint("note_routes", __name__)

# IST = UTC + 5:30
IST = timezone(timedelta(hours=5, minutes=30))


@note_routes.route("/api/notes", methods=["POST"])
@token_required
def save_note():
    data  = request.json or {}
    notes = data.get("notes", "").strip()
    image = data.get("image", None)

    if not notes and not image:
        return jsonify({"error": "Notes or image required"}), 400

    if image and not isinstance(image, str):
        image = None
    if image and not image.startswith("data:image/"):
        image = None

    try:
        if image:
            ai_feedback = analyze_study_with_image(notes or "", image)
        else:
            ai_feedback = analyze_study(notes)
    except Exception as e:
        ai_feedback = f"AI unavailable: {str(e)}"

    doc = {
        "userId":     request.user_id,
        "notes":      notes,
        "aiFeedback": ai_feedback,
        "image":      image,
        "createdAt":  datetime.now(timezone.utc)
    }

    try:
        result = db.notes.insert_one(doc)
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

    return jsonify({
        "message": "Note saved",
        "note": {
            "_id":        str(result.inserted_id),
            "notes":      notes,
            "aiFeedback": ai_feedback,
            "image":      image,
            "createdAt":  doc["createdAt"].isoformat()
        }
    }), 201


@note_routes.route("/api/notes", methods=["GET"])
@token_required
def get_notes():
    try:
        cursor = db.notes.find({"userId": request.user_id}).sort("createdAt", -1)
        result = []
        for n in cursor:
            result.append({
                "_id":        str(n["_id"]),
                "notes":      n.get("notes", ""),
                "aiFeedback": n.get("aiFeedback", ""),
                "image":      n.get("image", None),
                "createdAt":  n["createdAt"].isoformat()
            })
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@note_routes.route("/api/notes/stats", methods=["GET"])
@token_required
def get_stats():
    try:
        now_utc  = datetime.now(timezone.utc)
        week_ago = now_utc - timedelta(days=7)

        total     = db.notes.count_documents({"userId": request.user_id})
        this_week = db.notes.count_documents({
            "userId":    request.user_id,
            "createdAt": {"$gte": week_ago}
        })

        all_notes = list(db.notes.find(
            {"userId": request.user_id}, {"createdAt": 1}
        ).sort("createdAt", -1))

        # FIX: convert UTC timestamps to IST before extracting .date()
        # Without this, a note at 11 PM IST (= 5:30 PM UTC) counts on
        # the correct IST day but .date() would give the wrong UTC date
        seen_days = {
            n["createdAt"].astimezone(IST).date()
            for n in all_notes
        }

        streak = 0
        check  = datetime.now(IST).date()  # today in IST, not UTC
        while check in seen_days:
            streak += 1
            check  -= timedelta(days=1)

        return jsonify({"totalNotes": total, "thisWeek": this_week, "streak": streak}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@note_routes.route("/api/notes/<note_id>", methods=["DELETE"])
@token_required
def delete_note(note_id):
    try:
        res = db.notes.delete_one({"_id": ObjectId(note_id), "userId": request.user_id})
        if res.deleted_count == 0:
            return jsonify({"error": "Note not found"}), 404
        return jsonify({"message": "Deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500