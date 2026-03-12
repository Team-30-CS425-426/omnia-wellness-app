import os
from supabase import create_client, Client
from pathlib import Path
from dotenv import load_dotenv
from datetime import date, timedelta

dotenv_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path)

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE")
supabase: Client = create_client(url, key)


def get_nutrition_30_days(user_id: str):
    start = (date.today() - timedelta(days=30)).isoformat()
    response = (
        supabase.table("NutritionLog")
        .select("*")
        .gte("date", start)
        .order("date", desc = False)
        .eq("userID", user_id)
        .execute()
    )
    return response.data
    
    
def get_activity_30_days(user_id: str):
    start = (date.today() - timedelta(days=30)).isoformat()
    
    response = (
        supabase.table("ActivityLog")
        .select("*")
        .gte("date", start)
        .order("date", desc = False)
        .eq("userID", user_id)
        .execute()
    )
    return response.data
    
def get_sleep_30_days(user_id: str):
    start = (date.today() - timedelta(days=30)).isoformat()
    
    response = (
        supabase.table("SleepLog")
        .select("*")
        .gte("date", start)
        .order("date", desc = False)
        .eq("userID", user_id)
        .execute()
    )
    return response.data
    
def get_30_days_data(user_id: str):
    nutrition = get_nutrition_30_days(user_id)
    activity = get_activity_30_days(user_id)
    sleep = get_sleep_30_days(user_id)
    
    return {
        "nutrition": nutrition,
        "activity": activity,
        "sleep": sleep
    }

def test():
    data = get_30_days_data("088d9af5-2e5d-4f36-a3a3-863bfa8a0c54")
    print("NUTRITION COLUMNS:", data["nutrition"][0].keys() if data["nutrition"] else "empty")
    print("ACTIVITY COLUMNS:", data["activity"][0].keys() if data["activity"] else "empty")
    print("SLEEP COLUMNS:", data["sleep"][0].keys() if data["sleep"] else "empty")

    # also print one row of each so we can see the actual values
    import json
    print("\nNUTRITION ROW:", json.dumps(data["nutrition"][0], indent=2) if data["nutrition"] else "empty")
    print("\nACTIVITY ROW:", json.dumps(data["activity"][0], indent=2) if data["activity"] else "empty")
    print("\nSLEEP ROW:", json.dumps(data["sleep"][0], indent=2) if data["sleep"] else "empty")
    
if __name__ == "__main__":
    test()