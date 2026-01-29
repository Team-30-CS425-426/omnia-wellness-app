// front-end/src/services/WorkoutService.ts

import { supabase } from '../../config/supabaseConfig';

export type Workout = {
  id: string;
  user_id: string;
  workout_type: string;
  duration: number; // minutes
  intensity: 'Low' | 'Medium' | 'High';
  notes: string | null;
  created_at: string;
};

export async function insertWorkout(
  userId: string,
  workoutData: {
    workout_type: string;
    duration: number;
    intensity: 'Low' | 'Medium' | 'High';
    notes?: string;
  }
): Promise<{ success: boolean; data?: Workout; error?: string }> {
  try {
    const intensityMap: { [key: string]: number } = {
      'Low': 1,
      'Medium': 2,
      'High': 3,
    };

    const { data, error } = await supabase
      .from('ActivityLog')
      .insert({
        userID: userId,
        activityType: workoutData.workout_type,
        duration: workoutData.duration,
        intensity: intensityMap[workoutData.intensity],
        notes: workoutData.notes || null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// Optional: fetch user's workout history
export async function fetchUserWorkouts(
  userId: string
): Promise<{ data?: Workout[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('ActivityLog')
      .select('*')
      .eq('userID', userId)
      .order('date', { ascending: false });

    if (error) {
      return { error: error.message };
    }

    return { data };
  } catch (err) {
    return { error: String(err) };
  }
}