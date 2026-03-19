import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")
load_dotenv()

class Config:
    MONGO_URI    = os.getenv("MONGO_URI")
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    JWT_SECRET   = os.getenv("JWT_SECRET", "change_this_secret")

    @staticmethod
    def validate():
        missing = []
        if not Config.MONGO_URI:    missing.append("MONGO_URI")
        if not Config.GROQ_API_KEY: missing.append("GROQ_API_KEY")
        if missing:
            raise EnvironmentError(f"Missing env variables: {', '.join(missing)}")