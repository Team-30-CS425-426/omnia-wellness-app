// code written by Alexis Mae Asuncion

import { supabase } from "../../config/supabaseConfig";
import { getLocalDateString } from "./dateUtils";
import { getCategoryStreak } from "./categoryStreakService";

// ADDED: checks whether the user met their sleep goal for a specific date
async function didMeetSleepGoal(userId: string, date: string) {
  const { data: logs, error: logError } = await supabase
    .from("SleepLog")
    .select("*")
    .eq("userID", userId)
    .eq("date", date);

  console.log("✅ Sleep logs for date:", date, logs);

  if (logError || !logs || logs.length === 0) {
    console.log("✅ No sleep logs found or log error:", logError);
    return false;
  }

  const totalSleep = logs.reduce(
    (sum, log) => sum + Number(log.hoursSlept ?? 0),
    0
  );

  console.log("✅ Total sleep for date:", date, totalSleep);

  const { data: goal, error: goalError } = await supabase
    .from("sleepgoals")
    .select("*")
    .eq("userid", userId)
    .single();

  console.log("✅ Sleep goal row:", goal);

  if (goalError || !goal) {
    console.log("✅ Sleep goal missing or error:", goalError);
    return false;
  }

  const sleepGoalHours = Number(goal.sleep_goal_hours ?? 0);
  const metGoal = totalSleep >= sleepGoalHours;

  console.log("✅ Sleep metGoal result:", {
    date,
    totalSleep,
    sleepGoalHours,
    metGoal,
  });

  return metGoal;
}

// ADDED: local date helper
function getPastDate(offset: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - offset);

  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// ADDED: calculate current sleep streak
export async function calculateSleepStreak(userId: string) {
  let streak = 0;

  for (let i = 0; i < 30; i++) {
    const date = getPastDate(i);
    const metGoal = await didMeetSleepGoal(userId, date);

    console.log("✅ Sleep streak check:", { date, metGoal });

    if (!metGoal) break;
    streak++;
  }

  console.log("✅ Calculated sleep streak:", streak);
  return streak;
}

// ADDED: calculate longest sleep streak
export async function calculateLongestSleepStreak(userId: string) {
  let longest = 0;
  let current = 0;

  for (let i = 29; i >= 0; i--) {
    const date = getPastDate(i);
    const metGoal = await didMeetSleepGoal(userId, date);

    if (metGoal) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }

  console.log("✅ Calculated longest sleep streak:", longest);
  return longest;
}

// ADDED: rebuild and store sleep streak in category_streaks
export async function refreshSleepStreak(userId: string) {
  const currentStreak = await calculateSleepStreak(userId);
  const longestStreak = await calculateLongestSleepStreak(userId);

  const existing = await getCategoryStreak(userId, "sleep");

  console.log("✅ Refreshing sleep streak:", {
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
      category: "sleep",
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