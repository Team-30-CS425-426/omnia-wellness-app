// Code written by Alexis Mae Asuncion

import { supabase } from "../../config/supabaseConfig";
import { getLocalDateString } from "./dateUtils";
import { getCategoryStreak } from "./categoryStreakService";

function getPastDate(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function didLogMoodOnDate(userId: string, date: string) {
  const { count, error } = await supabase
    .from("StressLog")
    .select("*", { count: "exact", head: true })
    .eq("userID", userId)
    .eq("date", date);

  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function calculateMoodStreak(userId: string): Promise<number> {
  let streak = 0;

  for (let i = 0; i < 30; i++) {
    const date = getPastDate(i);
    const logged = await didLogMoodOnDate(userId, date);

    if (!logged) break;
    streak++;
  }

  return streak;
}

export async function calculateLongestMoodStreak(userId: string): Promise<number> {
  let longest = 0;
  let current = 0;

  for (let i = 29; i >= 0; i--) {
    const date = getPastDate(i);
    const logged = await didLogMoodOnDate(userId, date);

    if (logged) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }

  return longest;
}

export async function refreshMoodStreak(userId: string) {
  const currentStreak = await calculateMoodStreak(userId);
  const longestStreak = await calculateLongestMoodStreak(userId);

  const existing = await getCategoryStreak(userId, "mood");

  if (existing) {
    const { data, error } = await supabase
      .from("category_streaks")
      .update({
        current_streak: currentStreak,
        longest_streak: Math.max(existing.longest_streak, longestStreak),
        last_completed_date: currentStreak > 0 ? getLocalDateString() : existing.last_completed_date,
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
      category: "mood",
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