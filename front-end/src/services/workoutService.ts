import { supabase } from "../../config/supabaseConfig";

export type Workout = {
  id: string;
  user_id: string;
  workout_type: string;
  duration: number; // minutes
  intensity: "Low" | "Medium" | "High";
  notes: string | null;
  created_at: string;
};

export async function insertWorkout(
  userId: string,
  workoutData: {
    workout_type: string;
    duration: number;
    intensity: "Low" | "Medium" | "High";
    notes?: string;
  }
): Promise<{ success: boolean; data?: Workout; error?: string }> {
  try {
    const intensityMap: { [key: string]: number } = {
      Low: 1,
      Medium: 2,
      High: 3,
    };

    const { data, error } = await supabase
      .from("ActivityLog")
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
      .from("ActivityLog")
      .select("*")
      .eq("userID", userId)
      .order("date", { ascending: false });

    if (error) {
      return { error: error.message };
    }

    return { data };
  } catch (err) {
    return { error: String(err) };
  }
}

export async function getActivityMinutesLastNDays(
  userId: string,
  days: number = 7
): Promise<{ date: string; minutes: number }[]> {
  const pad2 = (n: number) => String(n).padStart(2, "0");

  // Convert JS Date -> local YYYY-MM-DD
  const localDayKey = (d: Date) =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

  // Convert any date/timestamp -> local YYYY-MM-DD
  const toLocalDayKeyFromAny = (v: any) => {
    if (!v) return "";
    const s = String(v);

    // already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "";
    return localDayKey(d);
  };

  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const addDays = (d: Date, n: number) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };

  // Window: last N days inclusive
  const end = startOfDay(new Date());
  const start = addDays(end, -(days - 1));
  const startKey = localDayKey(start); // YYYY-MM-DD

  // Pull logs in range
  const { data, error } = await supabase
    .from("ActivityLog")
    .select("date, duration")
    .eq("userID", userId)
    .gte("date", startKey) // compare date-to-date instead of ISO timestamp
    .order("date", { ascending: true });

  if (error) throw error;

  // Sum duration per day (multiple logs per day -> total minutes)
  const totals = new Map<string, number>();
  (data ?? []).forEach((row: any) => {
    const key = toLocalDayKeyFromAny(row.date);
    if (!key) return;

    const mins = Number(row.duration);
    const safe = Number.isFinite(mins) ? mins : 0;

    totals.set(key, (totals.get(key) ?? 0) + safe);
  });

  // Fill missing days with 0, oldest -> newest
  const out: { date: string; minutes: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = addDays(start, i);
    const key = localDayKey(d);
    out.push({ date: key, minutes: totals.get(key) ?? 0 });
  }

  return out;
}


