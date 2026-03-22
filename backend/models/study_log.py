from datetime import datetime, timezone


def create_study_log(topics_studied: str, study_time: float, waste_time: float, notes: str, ai_feedback: str) -> dict:
    """
    Returns a structured study log document for MongoDB.
    Using a factory function instead of a class keeps it simple with PyMongo.
    """
    return {
        "topicsStudied": topics_studied,
        "studyTime": study_time,       # in minutes
        "wasteTime": waste_time,        # in minutes
        "notes": notes,
        "aiFeedback": ai_feedback,
        "createdAt": datetime.now(timezone.utc)  # timezone-aware UTC timestamp
    }