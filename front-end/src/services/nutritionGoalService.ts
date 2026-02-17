/**
 * nutritionGoalService.ts
 * 
 * SERVICE LAYER for the Nutrition Goal system.
 * This file handles all Supabase database operations related to nutrition goals.
 * 
 * It is used by:
 *   - nutritionGoal.tsx (the goal-setting screen) to INSERT or UPDATE a user's nutrition goal
 *   - profile.tsx to FETCH existing goals and display them as cards
 *   - keystats.tsx to FETCH goals and calculate progress bar percentages
 * 
 * Database table: 'nutritiongoals' — each user has at most ONE row (enforced by userid uniqueness).
 * Columns: id, userid, calorie_goal, protein_goal, fat_goal, carb_goal
 */

import { supabase } from "../../config/supabaseConfig";

/**
 * NutritionGoalInput
 * The shape of data the UI passes when creating/updating a goal.
 * This intentionally EXCLUDES 'id' and 'userid' — those are handled by the service functions.
 */
export type NutritionGoalInput = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

/**
 * checkNutritionGoalExists
 * 
 * Checks whether a nutrition goal already exists for the given user.
 * Used by nutritionGoal.tsx BEFORE inserting a new goal to prevent duplicates.
 * 
 * Uses .maybeSingle() instead of .single() so that it returns null (rather than
 * throwing an error) when no matching row is found.
 * 
 * @param userId - The authenticated user's ID
 * @returns true if a goal already exists, false otherwise
 */
export async function checkNutritionGoalExists(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('nutritiongoals')
      .select('id')
      .eq('userid', userId)
      .maybeSingle();
    
    return !!data; // Returns true if goal exists
  }

/**
 * insertNutritionGoal
 * 
 * Inserts a new nutrition goal or updates the existing one for the given user.
 * Uses Supabase's .upsert() — if a row with the same userid already exists,
 * it updates that row instead of creating a duplicate.
 * 
 * Called by nutritionGoal.tsx after the user fills out the goal form and passes validation.
 * 
 * @param userId - The authenticated user's ID
 * @param nutritionData - Object containing calories, protein, carbs, fat values
 * @returns The inserted/updated row from the database
 * @throws Supabase error if the operation fails
 */
  export async function insertNutritionGoal(userId: string, nutritionData: NutritionGoalInput) {
    const { data, error } = await supabase
      .from('nutritiongoals')
      .upsert({
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

/**
 * getUserNutritionGoals
 * 
 * Fetches the nutrition goal for a given user.
 * Returns the full goal row (calorie_goal, protein_goal, carb_goal, fat_goal, etc.)
 * or null if no goal has been set yet.
 * 
 * Used by:
 *   - profile.tsx to populate goal cards on the profile page
 *   - keystats.tsx to determine progress bar targets (falls back to defaults if null)
 * 
 * Uses .maybeSingle() so it gracefully returns null when no row exists,
 * instead of throwing a "no rows returned" error.
 * 
 * @param userId - The authenticated user's ID
 * @returns The goal row object, or null if no goal exists
 * @throws Supabase error if the query itself fails (not for "no rows found")
 */
export async function getUserNutritionGoals(userId: string) {
  const { data, error } = await supabase
    .from('nutritiongoals')
    .select('*')
    .eq('userid', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
