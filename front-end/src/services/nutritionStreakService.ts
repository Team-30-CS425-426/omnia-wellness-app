// Code written by Alexis Mae Asuncion

// For Nutrition category streak
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

  if (logError || !logs || logs.length === 0) return false;

  // Sum totals for the day
  const totals = logs.reduce(
    (acc, log) => ({
      calories: acc.calories + (log.calories || 0),
      protein: acc.protein + (log.protein || 0),
      carbs: acc.carbs + (log.carbs || 0),
      fat: acc.fat + (log.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Get user goals
  const { data: goal, error: goalError } = await supabase
    .from("nutritiongoals")
    .select("*")
    .eq("userid", userId)
    .single();

  if (goalError || !goal) return false;

  return (
    totals.calories <= goal.calorie_goal &&
    totals.protein >= goal.protein_goal &&
    totals.carbs >= goal.carb_goal &&
    totals.fat >= goal.fat_goal
  );
}

// Helper: get YYYY-MM-DD for today - offset
function getPastDate(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toISOString().split("T")[0];
}

// Calculate the current nutrition streak based on consecutive goal-met days
export async function calculateNutritionStreak(userId: string) {
  let streak = 0;

  for (let i = 0; i < 30; i++) { // for (let i = 0; i < 365; i++)
    const date = getPastDate(i);
    const metGoal = await didMeetNutritionGoal(userId, date);

    if (!metGoal) break;
    streak++;
  }

  return streak;
}

// Calculate the longest nutrition streak in the past year
export async function calculateLongestNutritionStreak(userId: string) {
  let longest = 0;
  let current = 0;

  for (let i = 364; i >= 0; i--) {
    const date = getPastDate(i);
    const metGoal = await didMeetNutritionGoal(userId, date);

    if (metGoal) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }

  return longest;
}

// MAIN FUNCTION USED BY nutrition.tsx
// Rebuilds and stores the nutrition streak in category_streaks
export async function refreshNutritionStreak(userId: string) {
  const currentStreak = await calculateNutritionStreak(userId);
  const longestStreak = await calculateLongestNutritionStreak(userId);

  const existing = await getCategoryStreak(userId, "nutrition");

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