// Code written by Alexis Mae Asuncion

// Used for category streaks 
import { supabase } from "@/config/supabaseConfig";
import { getLocalDateString, getYesterdayDateString } from "./dateUtils";

export type CategoryType =
  | "mood"
  | "workout"
  | "nutrition"
  | "sleep"
  | "steps"
  | "habit";

export type CategoryStreakRow = {
  id: string;
  user_id: string;
  category: CategoryType;
  reference_id: string | null;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  created_at: string;
  updated_at: string;
};

async function getOrCreateCategoryStreak(
  userId: string,
  category: CategoryType,
  referenceId: string | null = null
): Promise<CategoryStreakRow> {
  const query = supabase
    .from("category_streaks")
    .select("*")
    .eq("user_id", userId)
    .eq("category", category);

  const { data, error } = referenceId
    ? await query.eq("reference_id", referenceId).maybeSingle()
    : await query.is("reference_id", null).maybeSingle();

  if (error) throw error;

  if (data) return data;

  const { data: inserted, error: insertError } = await supabase
    .from("category_streaks")
    .insert({
      user_id: userId,
      category,
      reference_id: referenceId,
      current_streak: 0,
      longest_streak: 0,
      last_completed_date: null,
    })
    .select("*")
    .single();

  if (insertError) throw insertError;
  return inserted;
}

export async function updateCategoryStreak(
  userId: string,
  category: CategoryType,
  completedToday: boolean,
  date: string = getLocalDateString(),
  referenceId: string | null = null
): Promise<CategoryStreakRow> {
  const streak = await getOrCreateCategoryStreak(userId, category, referenceId);

  if (streak.last_completed_date === date) {
    return streak;
  }

  let nextCurrent = streak.current_streak;
  let nextLongest = streak.longest_streak;
  let nextLastCompletedDate = streak.last_completed_date;

  if (completedToday) {
    const yesterday = getYesterdayDateString(date);

    if (streak.last_completed_date === yesterday) {
      nextCurrent = streak.current_streak + 1;
    } else {
      nextCurrent = 1;
    }

    nextLongest = Math.max(streak.longest_streak, nextCurrent);
    nextLastCompletedDate = date;
  } else {
    nextCurrent = 0;
  }

  const { data, error } = await supabase
    .from("category_streaks")
    .update({
      current_streak: nextCurrent,
      longest_streak: nextLongest,
      last_completed_date: completedToday
        ? nextLastCompletedDate
        : streak.last_completed_date,
    })
    .eq("id", streak.id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function getCategoryStreak(
  userId: string,
  category: CategoryType,
  referenceId: string | null = null
): Promise<CategoryStreakRow | null> {
  const query = supabase
    .from("category_streaks")
    .select("*")
    .eq("user_id", userId)
    .eq("category", category);

  const { data, error } = referenceId
    ? await query.eq("reference_id", referenceId).maybeSingle()
    : await query.is("reference_id", null).maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function getAllCategoryStreaks(
  userId: string
): Promise<CategoryStreakRow[]> {
  const { data, error } = await supabase
    .from("category_streaks")
    .select("*")
    .eq("user_id", userId)
    .order("category", { ascending: true });

  if (error) throw error;
  return data ?? [];
}