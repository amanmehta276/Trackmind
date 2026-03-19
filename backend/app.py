from flask import Flask
from flask_cors import CORS
from config import Config

Config.validate()


app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.route("/ping")
def ping():
    return {"status": "ok"}, 200

from routes.auth_routes import auth_routes
from routes.note_routes import note_routes

app.register_blueprint(auth_routes)
app.register_blueprint(note_routes)

@app.route("/")
def home():
    return {"message": "TrackMind API ✅"}

@app.errorhandler(404)
def not_found(e):
    return {"error": "Route not found"}, 404

@app.errorhandler(500)
def server_error(e):
    return {"error": "Server error", "details": str(e)}, 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)