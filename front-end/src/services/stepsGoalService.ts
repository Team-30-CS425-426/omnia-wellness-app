import { supabase } from "@/config/supabaseConfig";

export const getStepsGoal = async (userId: string) => {
  const { data, error } = await supabase
    .from("stepsgoals")
    .select("steps_goal")
    .eq("userid", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const insertStepsGoal = async (userId: string, stepsGoal: number) => {
  const { data, error } = await supabase
    .from("stepsgoals")
    .upsert(
      {
        userid: userId,
        steps_goal: stepsGoal,
      },
      { onConflict: "userid" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteStepsGoal = async (userId: string) => {
  const { error } = await supabase
    .from("stepsgoals")
    .delete()
    .eq("userid", userId);

  if (error) throw error;
};