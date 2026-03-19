from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from config import Config

try:
    client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=5000)
    client.admin.command("ping")
    db = client["trackmind"]
    print("✅ MongoDB connected")
except ConnectionFailure as e:
    print(f"❌ MongoDB failed: {e}")
    raise