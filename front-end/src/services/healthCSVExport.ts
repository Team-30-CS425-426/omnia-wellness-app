import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { HealthValue } from 'react-native-health';

const fs = FileSystem as any;

type DayRow = {
  date: string;
  steps?: number;
  sleepHours?: number;
  mood?: string;
  stress?: string;
  workouts?: string;
};

const buildHealthCsv = (steps: HealthValue[], sleep: HealthValue[]) => {
const byDate: Record<string, DayRow> = {};

const ensureRow = (dateKey: string): DayRow => {
    if (!byDate[dateKey]) {
      byDate[dateKey] = { date: dateKey };
    }
    return byDate[dateKey];
  };

  (steps || []).forEach((s: any) => {
    const dateKey = s.startDate.slice(0, 10);
    const row = ensureRow(dateKey);
    const value =
      typeof s.value === 'number' ? s.value : Number(s.value) || 0;
    row.steps = (row.steps || 0) + value;
  });

  (sleep || []).forEach((s: any) => {
    const dateKey = s.startDate.slice(0, 10);
    const row = ensureRow(dateKey);
    const value =
      typeof s.value === 'number' ? s.value : Number(s.value) || 0;
    row.sleepHours = (row.sleepHours || 0) + value;
  });

  const rows = Object.values(byDate).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const header = 'date,steps,sleep_hours,mood,stress,workouts\n';

  const body = rows
    .map((r) => {
      const stepsStr = r.steps != null ? r.steps.toString() : '';
      const sleepStr =
        r.sleepHours != null ? r.sleepHours.toFixed(2) : '';
      const moodStr = r.mood ?? '';
      const stressStr = r.stress ?? '';
      const workoutsStr = r.workouts ?? '';
      return `${r.date},${stepsStr},${sleepStr},${moodStr},${stressStr},${workoutsStr}`;
    })
    .join('\n');

  return header + body;
};

export const exportHealthCsv = async (
  steps: HealthValue[],
  sleep: HealthValue[]
): Promise<string> => {
  if ((steps?.length ?? 0) === 0 && (sleep?.length ?? 0) === 0) {
    throw new Error('No health data to export');
  }

  const csv = buildHealthCsv(steps, sleep);

  const baseDir =
    fs.documentDirectory ?? fs.cacheDirectory ?? '';
  const fileUri = `${baseDir}omnia_health_${Date.now()}.csv`;

  await FileSystem.writeAsStringAsync(fileUri, csv);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export Omnia health data (last 30 days)',
    UTI: 'public.comma-separated-values-text',
  });

  return fileUri;
};
