from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.jobs.weeklySummary import generate_weekly_summary
from pydantic import BaseModel

app = FastAPI()

# Allow Expo app to call this backend during dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # you can restrict this later
    allow_methods=["*"],
    allow_headers=["*"],
)

class InsightsRequest(BaseModel):
    user_id: str

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/insights")
def insights(req: InsightsRequest):
    """
    Returns weekly insights text for the given user.
    """
    text = generate_weekly_summary(req.user_id)  # this is your LLM text
    return {"insights": text}