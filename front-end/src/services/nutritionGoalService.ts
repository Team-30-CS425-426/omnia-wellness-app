
import { supabase } from "../../config/supabaseConfig";

export type NutritionGoalInput = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

// nutritionGoalService.ts - Add this function
export async function checkNutritionGoalExists(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('nutritiongoals')
      .select('id')
      .eq('userid', userId)
      .single();
    
    return !!data; // Returns true if goal exists
  }



  export async function insertNutritionGoal(userId: string, nutritionData: NutritionGoalInput) {
    const { data, error } = await supabase
      .from('nutritiongoals')
      .insert({
        userid: userId,
        calorie_goal: nutritionData.calories,
        protein_goal: nutritionData.protein,
        fat_goal: nutritionData.fat,
        carb_goal: nutritionData.carbs
      })
      .select()
      .single();
  
    if (error) throw error;
    return data;
  }

export async function getUserNutritionGoals(userId: string) {
  const { data, error } = await supabase
    .from('nutritiongoals')
    .select('*')
    .eq('userid', userId)
    .single();

  if (error) throw error;
  return data;
}
