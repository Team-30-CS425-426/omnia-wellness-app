from src.services.supabase_client import get_30_days_data
from src.services.correlation import run_correlation_pipeline

def generate_weekly_summary(user_id: str):
    data = get_30_days_data(user_id)
    return run_correlation_pipeline(data)   
