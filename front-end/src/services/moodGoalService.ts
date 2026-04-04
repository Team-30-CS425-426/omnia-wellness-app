// Code written by Alexis Mae Asuncion

import { supabase } from "../../config/supabaseConfig";

export type MoodGoalInput = {
  targetMood: number;
  targetStressLevel: number;
  dailyCheckins: number;
};

export async function deleteMoodGoal(userId: string) {
  const { error } = await supabase
    .from("moodgoals")
    .delete()
    .eq("userid", userId);

  if (error) throw error;
}

export async function checkMoodGoalExists(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("moodgoals")
    .select("id")
    .eq("userid", userId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function insertMoodGoal(
  userId: string,
  moodData: MoodGoalInput
) {
  const { data, error } = await supabase
    .from("moodgoals")
    .upsert(
      {
        userid: userId,
        target_mood: moodData.targetMood,
        target_stress_level: moodData.targetStressLevel,
        daily_checkins: moodData.dailyCheckins,
      },
      {
        onConflict: "userid",
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserMoodGoals(userId: string) {
  const { data, error } = await supabase
    .from("moodgoals")
    .select("*")
    .eq("userid", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}