// Code written by Alexis Mae Asuncion

import { supabase } from "../../config/supabaseConfig";

export type NutritionLogRow = {
  id: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  nutritionEventType: number; // 1 = Meal, 2 = Snack
  mealName: string;
  notes: string | null;
  userID: string;
};

const pad2 = (n: number) => String(n).padStart(2, "0");

function toPgDate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toPgTime(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

// 1 = Meal, 2 = Snack
// Breakfast/Lunch/Dinner -> Meal (1), Snack -> Snack (2)
export function mapMealTypeToEventId(mealType: string): number {
  return mealType === "Snack" ? 2 : 1;
}

export async function insertNutritionLog(
  userId: string,
  entry: {
    mealName: string;
    mealType: string; // Breakfast/Lunch/Dinner/Snack
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    mealTime: Date;
    notes?: string;
    date?: Date; // Optional, defaults to today
  }
): Promise<{ success: boolean; data?: NutritionLogRow; error?: string }> {
  try {
    if (!userId) return { success: false, error: "Missing user id." };

    const trimmedMealName = entry.mealName.trim();
    if (!trimmedMealName) {
      return { success: false, error: "Meal name is required." };
    }

    const dateStr = toPgDate(entry.date ?? new Date());
    const timeStr = toPgTime(entry.mealTime);
    const nutritionEventType = mapMealTypeToEventId(entry.mealType);

    const { data, error } = await supabase
      .from("NutritionLog")
      .insert({
        userID: userId,
        date: dateStr,
        time: timeStr,
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
        nutritionEventType,
        mealName: trimmedMealName,
        notes: entry.notes?.trim() || null,
      })
      .select("*")
      .single();

    if (error) return { success: false, error: error.message };

    return { success: true, data: data as NutritionLogRow };
  } catch (err) {
    return { success: false, error: String(err) };
  }

}

export async function getNutritionHistory(userId: string, days: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = toPgDate(startDate);

  const { data, error } = await supabase
      .from('NutritionLog')
      .select('date, calories, protein, carbs, fat')
      .eq('userID', userId)
      .gte('date', startDateStr)
      .order('date', { ascending: true });

  if (error) throw error;

  // Group by date and sum totals
  const dailyTotals: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {};
  
  for (const row of data || []) {
      if (!dailyTotals[row.date]) {
          dailyTotals[row.date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
      dailyTotals[row.date].calories += row.calories;
      dailyTotals[row.date].protein += row.protein;
      dailyTotals[row.date].carbs += row.carbs;
      dailyTotals[row.date].fat += row.fat;
  }

  return Object.entries(dailyTotals).map(([date, totals]) => ({
      date,
      ...totals,
  }));
}