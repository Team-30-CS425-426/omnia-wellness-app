// Code written by Alexis Mae Asuncion

import { getLocalDateString } from "./dateUtils";
import { awardBadge } from "./badgeService";
import { getCategoryStreak } from "./categoryStreakService";
import { calculateNutritionStreak } from "./nutritionStreakService";
import {
  calculateWorkoutStreak,
  calculateLongestWorkoutStreak, // ADDED
} from "./workoutStreakService";
import { supabase } from "../../config/supabaseConfig";

// Nutrition goal met today?
async function didMeetNutritionGoalToday(userId: string, date: string) {
  const { data: logs, error: logError } = await supabase
    .from("NutritionLog")
    .select("*")
    .eq("userID", userId)
    .eq("date", date);

  if (logError || !logs || logs.length === 0) return false;

  const totals = logs.reduce(
    (acc, log) => ({
      calories: acc.calories + Number(log.calories ?? 0),
      protein: acc.protein + Number(log.protein ?? 0),
      carbs: acc.carbs + Number(log.carbs ?? 0),
      fat: acc.fat + Number(log.fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const { data: goal, error: goalError } = await supabase
    .from("nutritiongoals")
    .select("*")
    .eq("userid", userId)
    .maybeSingle();

  if (goalError || !goal) return false;

  return (
    totals.calories <= goal.calorie_goal &&
    totals.protein >= goal.protein_goal &&
    totals.carbs >= goal.carb_goal &&
    totals.fat >= goal.fat_goal
  );
}

export async function checkAndAwardMoodBadges(userId: string) {
  const streak = await getCategoryStreak(userId, "mood");
  const current = streak?.current_streak ?? 0;

  if (current >= 3) {
    await awardBadge(userId, "mood_streak_3", getLocalDateString(), current);
  }

  // optional future badge
  if (current >= 7) {
    await awardBadge(userId, "mood_streak_7", getLocalDateString(), current);
  }
}

export async function checkAndAwardNutritionBadges(userId: string) {
  const today = getLocalDateString();
  const metGoalToday = await didMeetNutritionGoalToday(userId, today);

  if (metGoalToday) {
    await awardBadge(userId, "nutrition_goal_first", today, 1);
  }

  const currentStreak = await calculateNutritionStreak(userId);
  console.log("✅ Nutrition streak for badge check:", currentStreak);

  if (currentStreak >= 3) {
    await awardBadge(userId, "nutrition_streak_3", today, currentStreak);
  }
}

export async function checkAndAwardWorkoutBadges(userId: string) {
  const currentStreak = await calculateWorkoutStreak(userId);

  // ADDED: longest streak tells us whether user has EVER met a weekly workout goal
  const longestStreak = await calculateLongestWorkoutStreak(userId);

  console.log("✅ Workout current streak for badge check:", currentStreak);
  console.log("✅ Workout longest streak for badge check:", longestStreak);

  // CHANGED: use longest streak, not current streak
  if (longestStreak >= 1) {
    const result = await awardBadge(
      userId,
      "workout_goal_first",
      getLocalDateString(),
      1
    );
    console.log("✅ workout_goal_first award result:", result);
  }

  
  // Keep this as current OR longest depending on your meaning.
  // Here, 2-week workout streak means user has achieved a 2-week streak at some point.
  if (longestStreak >= 2) {
    const result = await awardBadge(
      userId,
      "workout_streak_2",
      getLocalDateString(),
      longestStreak
    );
    console.log("✅ workout_streak_2 award result:", result);
  }
  
}