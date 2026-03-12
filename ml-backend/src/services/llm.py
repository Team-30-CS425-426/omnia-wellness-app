from google import genai
import os
from pathlib import Path
from dotenv import load_dotenv

dotenv_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path)

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key= api_key)

def generate_response(prompt: str) -> str:
    response = client.models.generate_content(
        model = "gemini-2.5-flash", contents = prompt
    )
    return response.text