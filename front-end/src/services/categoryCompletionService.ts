// Code written by Alexis Mae Asuncion

// Used for category streaks
import { supabase } from "@/config/supabaseConfig";
import { getLocalDateString } from "./dateUtils";
import { updateCategoryStreak } from "./categoryStreakService";

/**
 * MOOD
 * Completed if the user logged a mood/stress check-in on that date.
 */
export async function refreshMoodStreak(
  userId: string,
  date: string = getLocalDateString()
) {
  const { count, error } = await supabase
    .from("StressLog")
    .select("*", { count: "exact", head: true })
    .eq("userID", userId)
    .eq("date", date);

  if (error) throw error;

  return await updateCategoryStreak(userId, "mood", (count ?? 0) > 0, date);
}

/**
 * WORKOUT
 * Completed if the user logged any workout on that date.
 * IMPORTANT: ActivityLog uses "date", not "created_at".
 ////
export async function refreshWorkoutStreak(
  userId: string,
  date: string = getLocalDateString()
) {
  const { count, error } = await supabase
    .from("ActivityLog")
    .select("*", { count: "exact", head: true })
    .eq("userID", userId)
    .eq("date", date);

  if (error) throw error;

  return await updateCategoryStreak(userId, "workout", (count ?? 0) > 0, date);
}
**/

/**
 * NUTRITION
 * Simple version:
 * completed if the user logged any nutrition entry that day.
 * Later upgrade this to "met nutrition goal".
 * IMPORTANT: NutritionLog uses "date", not "created_at"
 
export async function refreshNutritionStreak(
  userId: string,
  date: string = getLocalDateString()
) {
  const { count, error } = await supabase
    .from("NutritionLog")
    .select("*", { count: "exact", head: true })
    .eq("userID", userId)
    .eq("date", date);

  if (error) throw error;

  return await updateCategoryStreak(userId, "nutrition", (count ?? 0) > 0, date);
}
**/

/**
 * SLEEP
 * Completed if total logged sleep hours for the day >= sleep goal.
 */
export async function refreshSleepStreak(
  userId: string,
  date: string = getLocalDateString()
) {
  const { data: goalData, error: goalError } = await supabase
    .from("sleepgoals")
    .select("sleep_goal_hours")
    .eq("userid", userId)
    .maybeSingle();

  if (goalError) throw goalError;

  const sleepGoal = goalData?.sleep_goal_hours ?? null;

  const { data: sleepRows, error: sleepError } = await supabase
    .from("SleepLog")
    .select("hoursSlept")
    .eq("userID", userId)
    .eq("date", date);

  if (sleepError) throw sleepError;

  const totalSleep = (sleepRows ?? []).reduce(
    (sum, row) => sum + Number(row.hoursSlept ?? 0),
    0
  );

  const completed = sleepGoal != null ? totalSleep >= sleepGoal : false;

  return await updateCategoryStreak(userId, "sleep", completed, date);
}

/**
 * INDIVIDUAL HABIT
 * Completed if this habit is marked completed on that date.
 */
export async function refreshSingleHabitStreak(
  userId: string,
  habitId: string,
  date: string = getLocalDateString()
) {
  const { data, error } = await supabase
    .from("HabitCompletion")
    .select("completed")
    .eq("userID", userId)
    .eq("habitID", habitId)
    .eq("date", date)
    .maybeSingle();

  if (error) throw error;

  const completed = data?.completed === true;

  return await updateCategoryStreak(userId, "habit", completed, date, habitId);
}