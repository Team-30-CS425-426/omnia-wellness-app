import { supabase } from "../../config/supabaseConfig";

export async function upsertStepCache(
  userId: string,
  points: { date: string; steps: number }[]
) {
  if (!userId) throw new Error("Missing user ID.");

  const rows = points.map((p) => ({
    userID: userId,
    date: p.date,
    steps: p.steps,
    source: "healthkit",
  }));

  const { error } = await supabase
    .from("StepCache")
    .upsert(rows, { onConflict: "userID,date" });

  if (error) throw error;
}

export async function getStepCacheLastNDays(
  userId: string,
  days: number = 7
): Promise<{ date: string; steps: number }[]> {
  const pad2 = (n: number) => String(n).padStart(2, "0");

  const toPgDate = (d: Date) =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));

  const startStr = toPgDate(start);
  const endStr = toPgDate(end);

  const { data, error } = await supabase
    .from("StepCache")
    .select("date, steps")
    .eq("userID", userId)
    .gte("date", startStr)
    .lte("date", endStr)
    .order("date", { ascending: true });

  if (error) throw error;

  const totals = new Map<string, number>();

  (data ?? []).forEach((row: any) => {
    const key = String(row.date);
    const val = Number(row.steps);
    totals.set(key, Number.isFinite(val) ? val : 0);
  });

  const out: { date: string; steps: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = toPgDate(d);
    out.push({ date: key, steps: totals.get(key) ?? 0 });
  }

  return out;
}