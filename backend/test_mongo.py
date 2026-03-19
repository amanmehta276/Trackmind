# save as test_mongo.py inside /backend/ and run it
from database import db

test_doc = {"test": "hello from python", "source": "manual test"}
result = db.logs.insert_one(test_doc)
print("Inserted ID:", result.inserted_id)