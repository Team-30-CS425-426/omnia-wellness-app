import { useMemo, useState } from "react";
import { authorizeHealthKit } from "./healthAuthorization";
import {
  addDaysLocal,
  DayPoint,
  DaysRange,
  endOfDayLocal,
  loadSleepSamples,
  localDay,
  RawSample,
  setTimeLocal,
  SleepSpan,
  startOfDayLocal,
} from "./loadData";

const UI_DAYS_WINDOW: DaysRange = 7;

const keepMostRecentDays = (points: DayPoint[], n: DaysRange): DayPoint[] => {
  return (points || []).slice(0, n);
};

const filterPointsToWindow = (
  points: DayPoint[],
  startDate: Date,
  endDate: Date
): DayPoint[] => {
  const startKey = localDay(startDate);
  const endKey = localDay(endDate);
  return (points || []).filter(
    (p) => p.startDate >= startKey && p.startDate <= endKey
  );
};

const aggregateSleepByDate = (samples: RawSample[]): DayPoint[] => {
  const byDate: Record<string, number> = {};

  (samples || []).forEach((s) => {
    const dateKey = localDay(s.endDate);
    const durationHours =
      (s.endDate.getTime() - s.startDate.getTime()) / (1000 * 60 * 60);

    byDate[dateKey] = (byDate[dateKey] || 0) + durationHours;
  });

  return Object.keys(byDate)
    .sort((a, b) => (a < b ? 1 : -1))
    .map((dateKey) => ({
      startDate: dateKey,
      endDate: dateKey,
      value: byDate[dateKey],
    }));
};

const aggregateSleepByHourForDay = (samples: RawSample[], day: Date): number[] => {
  const bins = new Array(24).fill(0);
  const dayStart = startOfDayLocal(day);
  const dayEnd = endOfDayLocal(day);

  (samples || []).forEach((s) => {
    const st = s.startDate < dayStart ? dayStart : s.startDate;
    const en = s.endDate > dayEnd ? dayEnd : s.endDate;

    if (en <= dayStart || st >= dayEnd) return;
    if (en <= st) return;

    let cur = new Date(st);
    while (cur < en) {
      const hour = cur.getHours();
      const nextHour = new Date(cur);
      nextHour.setHours(hour + 1, 0, 0, 0);

      const segEnd = nextHour < en ? nextHour : en;
      const minutes = (segEnd.getTime() - cur.getTime()) / (1000 * 60);

      bins[hour] += minutes;
      cur = segEnd;
    }
  });

  return bins.map((x) => (Number.isFinite(x) && x > 0 ? x : 0));
};

const buildSleepDaySpan = (samples: RawSample[], sleepDay: Date): SleepSpan => {
  const windowStart = setTimeLocal(addDaysLocal(sleepDay, -1), 22, 0);
  const windowEnd = setTimeLocal(sleepDay, 10, 0);

  let minStart: Date | null = null;
  let maxEnd: Date | null = null;

  (samples || []).forEach((s) => {
    if (s.endDate <= windowStart || s.startDate >= windowEnd) return;

    const st = s.startDate < windowStart ? windowStart : s.startDate;
    const en = s.endDate > windowEnd ? windowEnd : s.endDate;

    if (en <= st) return;

    if (!minStart || st < minStart) minStart = st;
    if (!maxEnd || en > maxEnd) maxEnd = en;
  });

  return minStart && maxEnd ? { start: minStart, end: maxEnd } : null;
};

export default function useSleepDisplayed() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rangeDays, setRangeDays] = useState<DaysRange>(7);
  const [sleep7d, setSleep7d] = useState<DayPoint[]>([]);
  const [sleepRange, setSleepRange] = useState<DayPoint[]>([]);
  const [sleepDayBins, setSleepDayBins] = useState<number[]>(
    new Array(24).fill(0)
  );
  const [sleepDaySpan, setSleepDaySpan] = useState<SleepSpan>(null);

  const importLastDays = async (days: DaysRange) => {
    const now = new Date();
    const start = addDaysLocal(now, -(days - 1));
    const startDate = startOfDayLocal(start);
    const endDate = now;

    try {
      const mappedSleep = await loadSleepSamples(days);
      const sleepDay = addDaysLocal(startOfDayLocal(new Date()), -1);

      setSleepDayBins(aggregateSleepByHourForDay(mappedSleep, sleepDay));
      setSleepDaySpan(buildSleepDaySpan(mappedSleep, sleepDay));

      const aggregatedSleepAll = aggregateSleepByDate(mappedSleep);
      const aggregatedSleep = keepMostRecentDays(
        filterPointsToWindow(aggregatedSleepAll, startDate, endDate),
        days
      );

      if (days === 7) setSleep7d(aggregatedSleep);
      setSleepRange(aggregatedSleep);

      setLoading(false);
    } catch (e: any) {
      setLoading(false);
      setError(e?.message || "Error loading sleep data");
    }
  };

  const connectAndImport = async () => {
    setError(null);
    setLoading(true);

    try {
      await authorizeHealthKit();
      setIsAuthorized(true);
      await importLastDays(UI_DAYS_WINDOW);
    } catch (e: any) {
      setIsAuthorized(false);
      setLoading(false);
      setError(e?.message || "Health permissions not granted");
    }
  };

  const loadRange = async (days: DaysRange) => {
    if (!isAuthorized) {
      setError("Please connect Apple Health first.");
      return;
    }

    setRangeDays(days);
    setError(null);
    setLoading(true);
    await importLastDays(days);
  };

  const yesterdayKey = localDay(new Date(Date.now() - 24 * 60 * 60 * 1000));

  const sleepToday = useMemo(() => {
    const found = sleep7d.find((x) => String(x.startDate).slice(0, 10) === yesterdayKey);
    const v = found?.value;
    return typeof v === "number" ? v : Number(v) || 0;
  }, [sleep7d, yesterdayKey]);

  return {
    isAuthorized,
    loading,
    error,

    connectAndImport,
    loadRange,

    rangeDays,
    sleep7d,
    sleepRange,
    sleepDayBins,
    sleepDaySpan,
    sleepToday,
  };
}