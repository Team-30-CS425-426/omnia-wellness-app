import { supabase } from "@/config/supabaseConfig";

// helper: always format month/day as 2 digits
const pad2 = (n: number) => String(n).padStart(2, "0");

// helper: convert JS Date -> YYYY-MM-DD
export const toPgDate = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

// helper: build the last N day keys, oldest -> newest
export function getLastNDayKeys(days: number): string[] {
  const today = new Date();
  const out: string[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(toPgDate(d));
  }

  return out;
}

// helper: compare expected dates vs cached dates
export function findMissingDates(
  expectedDates: string[],
  cachedDates: string[]
): string[] {
  const cached = new Set(cachedDates);
  return expectedDates.filter((d) => !cached.has(d));
}

export async function upsertActiveEnergyCache(
  userId: string,
  points: { date: string; calories: number }[]
) {
  if (!userId) throw new Error("Missing user ID.");

  const rows = points.map((p) => ({
    userID: userId,
    date: p.date,
    calories: p.calories,
    source: "healthkit",
  }));

  const { error } = await supabase
    .from("ActiveEnergyCache")
    .upsert(rows, { onConflict: "userID,date" });

  if (error) throw error;
}

export async function getActiveEnergyCacheLastNDays(
  userId: string,
  days: number = 7
): Promise<{ date: string; calories: number }[]> {
  const expectedDates = getLastNDayKeys(days);
  const startStr = expectedDates[0];
  const endStr = expectedDates[expectedDates.length - 1];

  const { data, error } = await supabase
    .from("ActiveEnergyCache")
    .select("date, calories")
    .eq("userID", userId)
    .gte("date", startStr)
    .lte("date", endStr)
    .order("date", { ascending: true });

  if (error) throw error;

  const totals = new Map<string, number>();

  (data ?? []).forEach((row: any) => {
    const key = String(row.date);
    const val = Number(row.calories);
    totals.set(key, Number.isFinite(val) ? val : 0);
  });

  const out: { date: string; calories: number }[] = [];
  for (const date of expectedDates) {
    out.push({
      date,
      calories: totals.get(date) ?? 0,
    });
  }

  return out;
}