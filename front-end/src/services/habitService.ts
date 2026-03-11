// code written by Alexis Mae Asuncion

import { supabase } from "../../config/supabaseConfig";

export type Habit = {
  id: number;
  created_at: string;
  userID: string;
  habitName: string;
  description: string | null;
  frequency: number; // 1 Daily, 2 Weekly, 3 Monthly
  isActive: boolean;
};

export type HabitWithFrequencyLabel = Habit & {
  frequencyLabel: "Daily" | "Weekly" | "Monthly";
};

function frequencyIdFromLabel(label: string): number {
  switch (label) {
    case "Daily":
      return 1;
    case "Weekly":
      return 2;
    case "Monthly":
      return 3;
    default:
      return 1;
  }
}

function frequencyLabelFromId(id: number): "Daily" | "Weekly" | "Monthly" {
  if (id === 2) return "Weekly";
  if (id === 3) return "Monthly";
  return "Daily";
}

export async function insertHabit(
  userId: string,
  habitData: {
    habitName: string;
    description?: string;
    frequencyLabel: "Daily" | "Weekly" | "Monthly";
  }
): Promise<{ success: boolean; data?: Habit; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("Habit")
      .insert({
        userID: userId,
        habitName: habitData.habitName.trim(),
        description: habitData.description?.trim() || null,
        frequency: frequencyIdFromLabel(habitData.frequencyLabel),
        isActive: true,
      })
      .select("*")
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as Habit };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function fetchActiveHabits(
  userId: string
): Promise<{ success: boolean; data?: HabitWithFrequencyLabel[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("Habit")
      .select("*")
      .eq("userID", userId)
      .eq("isActive", true)
      .order("created_at", { ascending: false });

    if (error) return { success: false, error: error.message };

    const formatted =
      (data as Habit[]).map((h) => ({
        ...h,
        frequencyLabel: frequencyLabelFromId(h.frequency),
      })) || [];

    return { success: true, data: formatted };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function pauseHabit(
  habitId: number,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("Habit")
      .update({ isActive: false })
      .eq("id", habitId)
      .eq("userID", userId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function deleteHabitForever(
  habitId: number,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("Habit")
      .delete()
      .eq("id", habitId)
      .eq("userID", userId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
