import jwt
import bcrypt
from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify
from database import db
from config import Config

auth_routes = Blueprint("auth_routes", __name__)


@auth_routes.route("/api/auth/signup", methods=["POST"])
def signup():
    data = request.json or {}
    name     = data.get("name", "").strip()
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({"error": "Name, email and password are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if db.users.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
    result = db.users.insert_one({
        "name":      name,
        "email":     email,
        "password":  hashed,
        "createdAt": datetime.now(timezone.utc)
    })

    token = _make_token(str(result.inserted_id), name, email)
    return jsonify({
        "token": token,
        "user":  {"id": str(result.inserted_id), "name": name, "email": email}
    }), 201


@auth_routes.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json or {}
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = db.users.find_one({"email": email})
    if not user or not bcrypt.checkpw(password.encode(), user["password"]):
        return jsonify({"error": "Invalid email or password"}), 401

    token = _make_token(str(user["_id"]), user["name"], email)
    return jsonify({
        "token": token,
        "user":  {"id": str(user["_id"]), "name": user["name"], "email": email}
    }), 200


def _make_token(user_id, name, email):
    return jwt.encode(
        {
            "user_id": user_id,
            "name":    name,
            "email":   email,
            "exp":     datetime.now(timezone.utc) + timedelta(days=7)
        },
        Config.JWT_SECRET,
        algorithm="HS256"
    )