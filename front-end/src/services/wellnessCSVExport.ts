import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { supabase } from '@/config/supabaseConfig';

const fs = FileSystem as any;
export const EXPORT_DAYS_WINDOW = 30;

type DayRow = {
  date: string;
  sleepHours?: number;
  steps?: number;
  activeEnergyCalories?: number;
  mood?: number;
  stressLevel?: number;
  activityType?: number;
  activityDuration?: number;
  activityIntensity?: number;
  nutritionCalories?: number;
  nutritionProtein?: number;
  nutritionCarbs?: number;
  nutritionFat?: number;
};

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getLastNDates(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(formatDateKey(d));
  }

  return dates;
}

function csvEscape(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '';
  const str = String(value);

  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

function buildWellnessCsv(rows: DayRow[]) {
  const header = [
    'Date',
    'Sleep Hours',
    'Steps',
    'Calories Burned',
    'Mood',
    'Stress Level',
    'Activity Type',
    'Activity Duration',
    'Activity Intensity',
    'Calories',
    'Protein',
    'Carbs',
    'Fat',
  ].join(',');

  const body = rows
    .map((row) =>
      [
        csvEscape(row.date),
        csvEscape(row.sleepHours != null ? row.sleepHours.toFixed(2) : ''),
        csvEscape(row.steps ?? ''),
        csvEscape(
          row.activeEnergyCalories != null
            ? Number(row.activeEnergyCalories).toFixed(2)
            : ''
        ),
        csvEscape(row.mood ?? ''),
        csvEscape(row.stressLevel ?? ''),
        csvEscape(row.activityType ?? ''),
        csvEscape(
          row.activityDuration != null
            ? Number(row.activityDuration).toFixed(2)
            : ''
        ),
        csvEscape(row.activityIntensity ?? ''),
        csvEscape(row.nutritionCalories ?? ''),
        csvEscape(row.nutritionProtein ?? ''),
        csvEscape(row.nutritionCarbs ?? ''),
        csvEscape(row.nutritionFat ?? ''),
      ].join(',')
    )
    .join('\n');

  return `${header}\n${body}`;
}

export async function exportWellnessCsv(userId: string): Promise<string> {
  const dates = getLastNDates(EXPORT_DAYS_WINDOW);
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  const byDate: Record<string, DayRow> = {};

  for (const date of dates) {
    byDate[date] = { date };
  }

  // SleepLog
  const { data: sleepData, error: sleepError } = await supabase
    .from('SleepLog')
    .select('date, hoursSlept')
    .eq('userID', userId)
    .gte('date', startDate)
    .lte('date', endDate);

  if (sleepError) throw sleepError;

  (sleepData || []).forEach((row: any) => {
    if (!byDate[row.date]) return;
    byDate[row.date].sleepHours =
      (byDate[row.date].sleepHours || 0) + (Number(row.hoursSlept) || 0);
  });

  // StepCache
  const { data: stepsData, error: stepsError } = await supabase
    .from('StepCache')
    .select('date, steps')
    .eq('userID', userId)
    .gte('date', startDate)
    .lte('date', endDate);

  if (stepsError) throw stepsError;

  (stepsData || []).forEach((row: any) => {
    if (!byDate[row.date]) return;
    byDate[row.date].steps = Number(row.steps) || 0;
  });

  // ActiveEnergyCache
  const { data: activeEnergyData, error: activeEnergyError } = await supabase
    .from('ActiveEnergyCache')
    .select('date, calories')
    .eq('userID', userId)
    .gte('date', startDate)
    .lte('date', endDate);

  if (activeEnergyError) throw activeEnergyError;

  (activeEnergyData || []).forEach((row: any) => {
    if (!byDate[row.date]) return;
    byDate[row.date].activeEnergyCalories =
      Number(row.calories) || 0;
  });

  // StressLog (includes mood and stress)
  const { data: stressData, error: stressError } = await supabase
    .from('StressLog')
    .select('date, mood, stressLevel')
    .eq('userID', userId)
    .gte('date', startDate)
    .lte('date', endDate);

  if (stressError) throw stressError;

  (stressData || []).forEach((row: any) => {
    if (!byDate[row.date]) return;

    byDate[row.date].mood = row.mood ?? byDate[row.date].mood ?? '';
    byDate[row.date].stressLevel =
      row.stressLevel ?? byDate[row.date].stressLevel ?? '';
  });

  // ActivityLog
  const { data: activityData, error: activityError } = await supabase
    .from('ActivityLog')
    .select('date, activityType, duration, intensity')
    .eq('userID', userId)
    .gte('date', startDate)
    .lte('date', endDate);

  if (activityError) throw activityError;

  (activityData || []).forEach((row: any) => {
    if (!byDate[row.date]) return;

    // If there are multiple activities in one day, this keeps the last one seen
    byDate[row.date].activityType = row.activityType ?? byDate[row.date].activityType;
    byDate[row.date].activityDuration =
      (byDate[row.date].activityDuration || 0) + (Number(row.duration) || 0);
    byDate[row.date].activityIntensity =
      row.intensity ?? byDate[row.date].activityIntensity;
  });

  // NutritionLog
  const { data: nutritionData, error: nutritionError } = await supabase
    .from('NutritionLog')
    .select('date, calories, protein, carbs, fat')
    .eq('userID', userId)
    .gte('date', startDate)
    .lte('date', endDate);

  if (nutritionError) throw nutritionError;

  (nutritionData || []).forEach((row: any) => {
    if (!byDate[row.date]) return;

    byDate[row.date].nutritionCalories =
      (byDate[row.date].nutritionCalories || 0) + (Number(row.calories) || 0);

    byDate[row.date].nutritionProtein =
      (byDate[row.date].nutritionProtein || 0) + (Number(row.protein) || 0);

    byDate[row.date].nutritionCarbs =
      (byDate[row.date].nutritionCarbs || 0) + (Number(row.carbs) || 0);

    byDate[row.date].nutritionFat =
      (byDate[row.date].nutritionFat || 0) + (Number(row.fat) || 0);
  });

  const rows = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  const csv = buildWellnessCsv(rows);

  const baseDir = fs.documentDirectory ?? fs.cacheDirectory ?? '';
  const fileUri = `${baseDir}omnia_wellness_${Date.now()}.csv`;

  await FileSystem.writeAsStringAsync(fileUri, csv);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export Omnia wellness data (last 30 days)',
    UTI: 'public.comma-separated-values-text',
  });

  return fileUri;
}