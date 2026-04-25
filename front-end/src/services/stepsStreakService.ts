// Code written by Alexis Mae Asuncion

import { supabase } from "../../config/supabaseConfig";
import { getLocalDateString } from "./dateUtils";
import { getCategoryStreak } from "./categoryStreakService";

// Checks whether the user met their steps goal for a specific date
async function didMeetStepsGoal(userId: string, date: string) {
  console.log("✅ Checking steps goal:", { userId, date });

  const { data: stepRow, error: stepError } = await supabase
    .from("StepCache")
    .select("steps")
    .eq("userID", userId)
    .eq("date", date)
    .maybeSingle();

  console.log("✅ Step row:", stepRow);

  if (stepError || !stepRow) {
    console.log("✅ No StepCache row found or step error:", stepError);
    return false;
  }

  const { data: goal, error: goalError } = await supabase
    .from("stepsgoals")
    .select("steps_goal")
    .eq("userid", userId)
    .maybeSingle();

  console.log("✅ Steps goal row:", goal);

  if (goalError || !goal) {
    console.log("✅ Steps goal missing or error:", goalError);
    return false;
  }

  const steps = Number(stepRow.steps ?? 0);
  const stepGoal = Number(goal.steps_goal ?? 0);

  const metGoal = steps >= stepGoal;

  console.log("✅ Steps comparison:", {
    date,
    steps,
    stepGoal,
    metGoal,
  });

  return metGoal;
}

// Helper: get YYYY-MM-DD using local date, not UTC
function getPastDate(offset: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - offset);

  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Calculate current steps streak based on consecutive goal-met days
export async function calculateStepsStreak(userId: string) {
  let streak = 0;

  for (let i = 0; i < 30; i++) {
    const date = getPastDate(i);
    const metGoal = await didMeetStepsGoal(userId, date);

    console.log("✅ Steps streak check:", { date, metGoal });

    if (!metGoal) break;
    streak++;
  }

  console.log("✅ Calculated steps streak:", streak);
  return streak;
}

// Calculate longest steps streak in recent window
export async function calculateLongestStepsStreak(userId: string) {
  let longest = 0;
  let current = 0;

  for (let i = 29; i >= 0; i--) {
    const date = getPastDate(i);
    const metGoal = await didMeetStepsGoal(userId, date);

    if (metGoal) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }

  console.log("✅ Calculated longest steps streak:", longest);
  return longest;
}

// Rebuilds and stores the steps streak in category_streaks
export async function refreshStepsStreak(userId: string) {
  const currentStreak = await calculateStepsStreak(userId);
  const longestStreak = await calculateLongestStepsStreak(userId);

  const existing = await getCategoryStreak(userId, "steps");

  console.log("✅ Refreshing steps streak:", {
    userId,
    currentStreak,
    longestStreak,
    existing,
  });

  if (existing) {
    const { data, error } = await supabase
      .from("category_streaks")
      .update({
        current_streak: currentStreak,
        longest_streak: Math.max(existing.longest_streak, longestStreak),
        last_completed_date:
          currentStreak > 0 ? getLocalDateString() : existing.last_completed_date,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("category_streaks")
    .insert({
      user_id: userId,
      category: "steps",
      reference_id: null,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_completed_date: currentStreak > 0 ? getLocalDateString() : null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}