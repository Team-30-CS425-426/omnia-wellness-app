// Code written by Alexis Mae Asuncion

import { supabase } from "../../config/supabaseConfig";
import { getLocalDateString } from "./dateUtils";
import { getCategoryStreak } from "./categoryStreakService";

// Check if user met nutrition goal for a specific day
async function didMeetNutritionGoal(userId: string, date: string) {
  const { data: logs, error: logError } = await supabase
    .from("NutritionLog")
    .select("*")
    .eq("userID", userId)
    .eq("date", date);

  // ADDED: debug log
  console.log("✅ Nutrition logs for date:", date, logs);

  if (logError || !logs || logs.length === 0) {
    console.log("✅ No nutrition logs found or log error:", logError);
    return false;
  }

  // Sum totals for the day
  const totals = logs.reduce(
    (acc, log) => ({
      // CHANGED: cast values to Number explicitly
      calories: acc.calories + Number(log.calories ?? 0),
      protein: acc.protein + Number(log.protein ?? 0),
      carbs: acc.carbs + Number(log.carbs ?? 0),
      fat: acc.fat + Number(log.fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // ADDED: debug log
  console.log("✅ Nutrition totals:", totals);

  // Get user goals
  const { data: goal, error: goalError } = await supabase
    .from("nutritiongoals")
    .select("*")
    .eq("userid", userId)
    .single();

  // ADDED: debug log
  console.log("✅ Nutrition goal row:", goal);

  if (goalError || !goal) {
    console.log("✅ Nutrition goal missing or error:", goalError);
    return false;
  }

  const metGoal =
    totals.calories <= Number(goal.calorie_goal ?? 0) &&
    totals.protein >= Number(goal.protein_goal ?? 0) &&
    totals.carbs >= Number(goal.carb_goal ?? 0) &&
    totals.fat >= Number(goal.fat_goal ?? 0);

  // ADDED: debug log
  console.log("✅ Nutrition metGoal result:", metGoal);

  return metGoal;
}

// CHANGED: helper now uses LOCAL date, not UTC ISO string
function getPastDate(offset: number) {
  const d = new Date();

  // ADDED: anchor to noon to avoid timezone rollover issues
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - offset);

  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Calculate the current nutrition streak based on consecutive goal-met days
export async function calculateNutritionStreak(userId: string) {
  let streak = 0;

  for (let i = 0; i < 30; i++) {
    const date = getPastDate(i);
    const metGoal = await didMeetNutritionGoal(userId, date);

    // ADDED: debug log
    console.log("✅ Nutrition streak check:", { date, metGoal });

    if (!metGoal) break;
    streak++;
  }

  // ADDED: debug log
  console.log("✅ Calculated nutrition streak:", streak);

  return streak;
}

// Calculate the longest nutrition streak in the recent window
export async function calculateLongestNutritionStreak(userId: string) {
  let longest = 0;
  let current = 0;

  // CHANGED: match your shorter debug window for now
  for (let i = 29; i >= 0; i--) {
    const date = getPastDate(i);
    const metGoal = await didMeetNutritionGoal(userId, date);

    if (metGoal) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }

  // ADDED: debug log
  console.log("✅ Calculated longest nutrition streak:", longest);

  return longest;
}

// MAIN FUNCTION USED BY nutrition.tsx
// Rebuilds and stores the nutrition streak in category_streaks
export async function refreshNutritionStreak(userId: string) {
  const currentStreak = await calculateNutritionStreak(userId);
  const longestStreak = await calculateLongestNutritionStreak(userId);

  const existing = await getCategoryStreak(userId, "nutrition");

  // ADDED: debug log
  console.log("✅ Refreshing nutrition streak:", {
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
      category: "nutrition",
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