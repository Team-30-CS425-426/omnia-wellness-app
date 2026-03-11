import os
from supabase import create_client, Client
from pathlib import Path
from dotenv import load_dotenv

dotenv_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

response = (
    supabase.table("NutritionLog")
    .select("*")
    .execute()
)