
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
      .from('usergoals')
      .select('id')
      .eq('userid', userId)
      .eq('category', 1) // 1 = nutrition
      .maybeSingle();
    
    return !!data; // Returns true if goal exists
  }



export async function insertNutritionGoal(userId: string, nutritionData: NutritionGoalInput) {
    // Step 1: Create the user goal entry
    const { data: userGoal, error: userGoalError } = await supabase
      .from('usergoals')
      .insert({
        userid: userId,
        category: 1, // 1 = nutrition (from goalcategories)
      })
      .select()
      .single();
  
    if (userGoalError) throw userGoalError;
  
    // Step 2: Create the nutrition goal details using the returned ID
    const { data: nutritionGoal, error: nutritionError } = await supabase
      .from('nutritiongoal')
      .insert({
        user_goal_id: userGoal.id,
        calorie_goal: nutritionData.calories,
        protein_goal: nutritionData.protein,
        fat_goal: nutritionData.fat,
        carb_goal: nutritionData.carbs
      })
      .select()
      .single();
  
    if (nutritionError) throw nutritionError;
  
    return { userGoal, nutritionGoal };
  }
