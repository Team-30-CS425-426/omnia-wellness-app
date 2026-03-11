// code written by Alexis Mae Asuncion 

import { supabase } from "../../config/supabaseConfig";

export type HabitCompletion = {
  id: number;
  created_at: string;
  userID: string;
  habitID: number;
  date: string; 
  completed: boolean;
};

const pad2 = (n: number) => String(n).padStart(2, "0");

function toPgDate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/*"One completion per day" is carried out by UNIQUE(habitID, date).
 Use UPSERT to insert if missing or update if it exists.
*/
export async function setHabitCompletedForToday(
  userId: string,
  habitId: number,
  completed: boolean
): Promise<{ success: boolean; data?: HabitCompletion; error?: string }> {
  try {
    const today = toPgDate(new Date());

    const { data, error } = await supabase
      .from("HabitCompletion")
      .upsert(
        {
          userID: userId,
          habitID: habitId,
          date: today,
          completed,
        },
        { onConflict: "habitID,date" }
      )
      .select("*")
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as HabitCompletion };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/** Check if a habit is completed today */
export async function isHabitCompletedToday(
  userId: string,
  habitId: number
): Promise<{ success: boolean; completed?: boolean; error?: string }> {
  try {
    const today = toPgDate(new Date());

    const { data, error } = await supabase
      .from("HabitCompletion")
      .select("completed")
      .eq("userID", userId)
      .eq("habitID", habitId)
      .eq("date", today)
      .maybeSingle();

    if (error) return { success: false, error: error.message };

    return { success: true, completed: data?.completed ?? false };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
