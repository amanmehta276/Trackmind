import base64
from groq import Groq
from config import Config

client = Groq(api_key=Config.GROQ_API_KEY)

SYSTEM_PROMPT = """You are TrackMind, an expert study coach AI.
Analyze the user's study notes and respond in EXACTLY this structure — no extra text:

1. Summary
[2-3 sentences about what was studied]

2. Strengths
- [strength 1]
- [strength 2]

3. Areas to Improve
- [area 1]
- [area 2]

4. Action Plan for Next Session
- [tip 1]
- [tip 2]
- [tip 3]

Be specific to what the user actually wrote. Never be vague or generic."""

VISION_SYSTEM_PROMPT = """You are TrackMind, an expert study coach AI.
The user has shared a photo of their study material (notes, diagrams, textbook, whiteboard, etc.) along with optional text.
First describe what you see in the image briefly, then give your full study coaching analysis.

Respond in EXACTLY this structure:

1. What I See in Your Image
[1-2 sentences describing the study material visible]

2. Summary
[2-3 sentences about the topic being studied]

3. Strengths
- [strength 1]
- [strength 2]

4. Areas to Improve
- [area 1]
- [area 2]

5. Action Plan for Next Session
- [tip 1]
- [tip 2]
- [tip 3]

Be specific and insightful based on the actual content you see."""


def analyze_study(notes: str) -> str:
    """Text-only analysis using llama-3.1-8b-instant."""
    if not notes.strip():
        return "No notes provided."
    try:
        res = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": f"My study notes:\n\n{notes}"}
            ],
            temperature=0.7,
            max_tokens=700
        )
        return res.choices[0].message.content
    except Exception as e:
        print(f"Groq text error: {e}")
        raise


def analyze_study_with_image(notes: str, image_data_url: str) -> str:
    """
    Vision analysis using meta-llama/llama-4-scout-17b-16e-instruct
    (Groq's vision-capable model).
    image_data_url: a base64 data URL like "data:image/jpeg;base64,..."
    """
    try:
        # Extract the base64 part and mime type
        # Format: data:image/jpeg;base64,<data>
        header, b64data = image_data_url.split(",", 1)
        mime_type = header.split(";")[0].replace("data:", "")  # e.g. "image/jpeg"

        user_content = []

        # Add text message first if provided
        if notes and notes.strip():
            user_content.append({
                "type": "text",
                "text": f"My study notes:\n\n{notes}\n\nPlease also analyse the image of my study material below."
            })
        else:
            user_content.append({
                "type": "text",
                "text": "Please analyse this image of my study material and give me coaching feedback."
            })

        # Add the image
        user_content.append({
            "type": "image_url",
            "image_url": {
                "url": image_data_url   # Groq accepts data URLs directly
            }
        })

        res = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {"role": "system", "content": VISION_SYSTEM_PROMPT},
                {"role": "user",   "content": user_content}
            ],
            temperature=0.7,
            max_tokens=900
        )
        return res.choices[0].message.content

    except Exception as e:
        print(f"Groq vision error: {e}")
        # Graceful fallback: try text-only with description
        try:
            fallback_notes = notes or "The user shared a study image but text analysis only is available."
            return analyze_study(fallback_notes + "\n\n[Note: Image analysis was unavailable, text-only feedback provided]")
        except Exception as e2:
            raise e2