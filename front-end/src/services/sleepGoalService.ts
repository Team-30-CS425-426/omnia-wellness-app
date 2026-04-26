import { supabase } from "@/config/supabaseConfig";

export const getSleepGoal = async (userId: string) => {
  const { data, error } = await supabase
    .from("sleepgoals")
    .select("sleep_goal_hours, success_rate")
    .eq("userid", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const insertSleepGoal = async (userId: string, sleepGoalHours: number, successRate: number) => {
  const { data, error } = await supabase
    .from("sleepgoals")
    .upsert(
      {
        userid: userId,
        sleep_goal_hours: sleepGoalHours,
        success_rate: successRate,
      },
      { onConflict: "userid" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteSleepGoal = async (userId: string) => {
  const { error } = await supabase
    .from("sleepgoals")
    .delete()
    .eq("userid", userId);

  if (error) throw error;
};