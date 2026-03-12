from src.services.supabase_client import get_30_days_data
from src.services.correlation import run_correlation_pipeline

def generate_weekly_summary(user_id: str):
    data = get_30_days_data(user_id)
    return run_correlation_pipeline(data)   
    
if __name__ == "__main__":
    print(generate_weekly_summary("088d9af5-2e5d-4f36-a3a3-863bfa8a0c54"))