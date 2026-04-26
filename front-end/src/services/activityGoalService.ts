// Code written by Alexis Mae Asuncion

import { supabase } from "../../config/supabaseConfig";

export type ActivityGoalInput = {
  weeklyMinutes: number;
  daysPerWeek: number;
  successRate: number;
};

export async function deleteActivityGoal(userId: string) {
  const { error } = await supabase
    .from("activitygoals")
    .delete()
    .eq("userid", userId);

  if (error) throw error;
}

export async function checkActivityGoalExists(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("activitygoals")
    .select("id")
    .eq("userid", userId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function insertActivityGoal(
  userId: string,
  activityData: ActivityGoalInput
) {
  const { data, error } = await supabase
    .from("activitygoals")
    .upsert(
      {
        userid: userId,
        weekly_minutes: activityData.weeklyMinutes,
        days_per_week: activityData.daysPerWeek,
        success_rate: activityData.successRate,
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

export async function getUserActivityGoals(userId: string) {
  const { data, error } = await supabase
    .from("activitygoals")
    .select("*")
    .eq("userid", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/* Added for dashboard metrics compatibility */
export async function getActivityGoal(userId: string) {
  return getUserActivityGoals(userId);
}