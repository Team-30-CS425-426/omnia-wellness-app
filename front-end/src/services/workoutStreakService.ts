// Code written by Alexis Mae Asuncion

// For Workout/Activity category streak
import { supabase } from "../../config/supabaseConfig";
import { getCategoryStreak } from "./categoryStreakService";

type ActivityGoalRow = {
  id: number;
  userid: string;
  weekly_goal_minutes: number | null;
  days_per_week: number | null;
};

type ActivityLogRow = {
  id: number;
  userID: string;
  date: string; // YYYY-MM-DD
  duration: number;
};

// Returns Monday-Sunday week range for a given date
function getWeekBounds(dateInput: Date | string) {
  const date =
    typeof dateInput === "string"
      ? new Date(`${dateInput}T12:00:00`)
      : new Date(dateInput);

  const day = date.getDay(); // Sunday = 0, Monday = 1, ...
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(date);
  start.setDate(date.getDate() + diffToMonday);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start: formatDateLocal(start),
    end: formatDateLocal(end),
  };
}

function formatDateLocal(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Gets the Monday date for N weeks ago
function getWeekStartWeeksAgo(weeksAgo: number) {
  const today = new Date();
  const { start } = getWeekBounds(today);
  const monday = new Date(`${start}T12:00:00`);
  monday.setDate(monday.getDate() - weeksAgo * 7);
  return formatDateLocal(monday);
}

// Check if the user met their workout goal for a specific week
async function didMeetWorkoutGoalForWeek(
  userId: string,
  weekStart: string
): Promise<boolean> {
  const weekStartDate = new Date(`${weekStart}T12:00:00`);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 6);

  const weekEnd = formatDateLocal(weekEndDate);

  // Get workout goal
  const { data: goal, error: goalError } = await supabase
    .from("activitygoals")
    .select("weekly_minutes, days_per_week")
    .eq("userid", userId)
    .maybeSingle();

  if (goalError) throw goalError;
  if (!goal) return false;

  const weeklyGoalMinutes = Number(goal.weekly_minutes ?? 0);
  const daysPerWeekGoal = Number(goal.days_per_week ?? 0);

  if (weeklyGoalMinutes <= 0 || daysPerWeekGoal <= 0) {
    return false;
  }

  // Get workout logs for that week
  const { data: logs, error: logsError } = await supabase
    .from("ActivityLog")
    .select("date, duration")
    .eq("userID", userId)
    .gte("date", weekStart)
    .lte("date", weekEnd);

  if (logsError) throw logsError;

  const workoutLogs = (logs ?? []) as ActivityLogRow[];

  if (workoutLogs.length === 0) return false;

  const totalMinutes = workoutLogs.reduce(
    (sum, log) => sum + Number(log.duration ?? 0),
    0
  );

  const distinctDays = new Set(workoutLogs.map((log) => log.date)).size;

  return totalMinutes >= weeklyGoalMinutes && distinctDays >= daysPerWeekGoal;
}

// Current streak = consecutive successful weeks ending this week
export async function calculateWorkoutStreak(userId: string): Promise<number> {
  let streak = 0;

  for (let i = 0; i < 12; i++) { // for (let i = 0; i < 52; i++)
    const weekStart = getWeekStartWeeksAgo(i);
    const metGoal = await didMeetWorkoutGoalForWeek(userId, weekStart);

    if (!metGoal) break;
    streak++;
  }

  return streak;
}

// Longest streak in the past year
export async function calculateLongestWorkoutStreak(
  userId: string
): Promise<number> {
  let longest = 0;
  let current = 0;

  for (let i = 51; i >= 0; i--) {
    const weekStart = getWeekStartWeeksAgo(i);
    const metGoal = await didMeetWorkoutGoalForWeek(userId, weekStart);

    if (metGoal) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }

  return longest;
}

// Refresh and persist the workout streak in category_streaks
export async function refreshWorkoutStreak(userId: string) {
  const currentStreak = await calculateWorkoutStreak(userId);
  const longestStreak = await calculateLongestWorkoutStreak(userId);

  const existing = await getCategoryStreak(userId, "workout");

  const currentWeekStart = getWeekStartWeeksAgo(0);

  if (existing) {
    const { data, error } = await supabase
      .from("category_streaks")
      .update({
        current_streak: currentStreak,
        longest_streak: Math.max(existing.longest_streak, longestStreak),
        last_completed_date: currentStreak > 0 ? currentWeekStart : existing.last_completed_date,
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
      category: "workout",
      reference_id: null,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_completed_date: currentStreak > 0 ? currentWeekStart : null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}