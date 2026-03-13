import pandas as pd
import numpy as np
from src.services import supabase_client
from src.services import llm


def time_to_minutes(t: str) -> float:
    """Convert 'HH:MM:SS' or 'HH:MM' to minutes since midnight."""
    if not t:
        return np.nan
    parts = t.split(":")
    h, m = int(parts[0]), int(parts[1])
    minutes = h * 60 + m
    # normalize late bedtimes — anything before 6am is treated as past midnight
    if minutes < 360:
        minutes += 1440
    return minutes


def build_daily_df(data: dict) -> pd.DataFrame:
    """
    Aggregate raw logs into one row per day with all features needed
    for lag analysis.
    """
    nutrition = pd.DataFrame(data["nutrition"])
    activity = pd.DataFrame(data["activity"])
    sleep = pd.DataFrame(data["sleep"])

    # --- Nutrition: sum macros per day ---
    nut = (
        nutrition
        .groupby("date")[["calories", "protein", "carbs", "fat"]]
        .sum()
    )

    # --- Activity: sum duration, mean intensity, keep workout time ---
    activity["timeMinutes"] = activity["time"].apply(time_to_minutes)
    act = activity.groupby("date").agg(
        duration=("duration", "sum"),
        intensity=("intensity", "mean"),
        workoutTimeMinutes=("timeMinutes", "mean")  # avg if multiple workouts
    )

    # --- Sleep: one row per night already, just clean up times ---
    sleep["bedTimeMinutes"] = sleep["bedTime"].apply(time_to_minutes)
    sleep["wakeTimeMinutes"] = sleep["wakeTime"].apply(time_to_minutes)
    sleep = sleep.set_index("date")
    bed = sleep[["hoursSlept", "sleepQuality", "bedTimeMinutes", "wakeTimeMinutes"]]

    # --- Merge into one daily df ---
    df = nut.join(act, how="outer").join(bed, how="outer")
    df = df.sort_index()

    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add lag features and hypothesis-driven boolean columns.
    """
    # --- Lag features: yesterday's values ---
    df["prev_hoursSlept"] = df["hoursSlept"].shift(1)
    df["prev_sleepQuality"] = df["sleepQuality"].shift(1)
    df["prev_calories"] = df["calories"].shift(1)
    df["prev_intensity"] = df["intensity"].shift(1)

    # --- Hypothesis features ---
    df["late_workout"] = df["workoutTimeMinutes"] > 1080        # workout after 8pm
    df["high_calorie_day"] = df["calories"] > df["calories"].mean()
    df["well_rested"] = df["hoursSlept"] >= 7
    df["late_bedtime"] = df["bedTimeMinutes"] > 1380            # bed after 11pm

    return df


def compute_targeted_correlations(df: pd.DataFrame) -> dict:
    """
    Test specific hypotheses as correlation pairs.
    Returns a dict of question -> correlation value.
    """
    hypotheses = {
        "late workout → sleep quality that night":
            (df["late_workout"].astype(float), df["sleepQuality"]),

        "late workout → hours slept that night":
            (df["late_workout"].astype(float), df["hoursSlept"]),

        "workout intensity → sleep quality that night":
            (df["intensity"], df["sleepQuality"]),

        "workout intensity → hours slept that night":
            (df["intensity"], df["hoursSlept"]),

        "late bedtime → hours slept":
            (df["bedTimeMinutes"], df["hoursSlept"]),

        "calories eaten → next day workout duration":
            (df["calories"], df["duration"].shift(-1)),

        "poor sleep last night → more calories today":
            (df["prev_sleepQuality"], df["calories"]),

        "poor sleep last night → lower workout intensity today":
            (df["prev_sleepQuality"], df["intensity"]),

        "high protein → better sleep quality":
            (df["protein"], df["sleepQuality"]),
    }

    results = {}
    for question, (x, y) in hypotheses.items():
        # need at least 5 overlapping non-null points
        valid = x.notna() & y.notna()
        if valid.sum() >= 5:
            results[question] = round(x[valid].corr(y[valid]), 2)
        else:
            results[question] = None  # not enough data

    return results


def format_for_llm(df: pd.DataFrame, correlations: dict) -> str:
    """
    Build a clean prompt-ready string summarizing findings.
    """
    lines = ["Here are health pattern correlations for this user over the past 30 days:\n"]

    for question, value in correlations.items():
        if value is None:
            lines.append(f"- {question}: not enough data")
        else:
            direction = "positive" if value > 0 else "negative"
            strength = (
                "strong" if abs(value) > 0.6
                else "moderate" if abs(value) > 0.3
                else "weak"
            )
            lines.append(f"- {question}: {value} ({strength} {direction} correlation)")

    lines.append("\nDescriptive stats:")
    lines.append(df[["calories", "protein", "hoursSlept", "sleepQuality", "duration", "intensity"]].describe().round(1).to_string())

    lines.append("\nBased on these patterns, provide 3-5 plain English insights for the user about how their habits are affecting each other. Be specific and actionable.")
    
    lines.append("""
        User context:
        - A late workout is defined as any workout after 7:30pm
        - A late bedtime is defined as after 11pm
        - This user tends to sleep better after late workouts due to physical exhaustion
        - A positive correlation between late workout and sleep quality/hours is expected and healthy for this user
        - sleepQuality is scored 1-3 (1=poor, 3=good)
        - intensity is scored 1-3 (1=low, 3=high)
    """)

    return "\n".join(lines)


def run_correlation_pipeline(data: dict) -> str:
    """
    Main entry point. Pass in raw data dict from get_30_days_data().
    Returns a prompt-ready string for the LLM.
    """
    df = build_daily_df(data)
    df = engineer_features(df)
    correlations = compute_targeted_correlations(df)
    prompt = format_for_llm(df, correlations)
    response = llm.generate_response(prompt)
    return response
