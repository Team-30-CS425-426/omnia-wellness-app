import { useMemo, useState } from "react";
import { authorizeHealthKit } from "./healthAuthorization";
import {
  addDaysLocal,
  DayPoint,
  DaysRange,
  endOfDayLocal,
  loadStepSamples,
  localDay,
  RawSample,
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

const aggregateStepsByDate = (samples: RawSample[]): DayPoint[] => {
  const byDate: Record<string, number> = {};

  (samples || []).forEach((s) => {
    const dateKey = localDay(s.startDate);
    byDate[dateKey] = (byDate[dateKey] || 0) + (Number(s.value) || 0);
  });

  return Object.keys(byDate)
    .sort((a, b) => (a < b ? 1 : -1))
    .map((dateKey) => ({
      startDate: dateKey,
      endDate: dateKey,
      value: byDate[dateKey],
    }));
};

const aggregateStepsByHourForDay = (samples: RawSample[], day: Date): number[] => {
  const bins = new Array(24).fill(0);
  const dayStart = startOfDayLocal(day);
  const dayEnd = endOfDayLocal(day);

  (samples || []).forEach((s) => {
    const st = s.startDate;
    const en = s.endDate;

    if (en < dayStart || st > dayEnd) return;

    const hour = st.getHours();
    bins[hour] += Number(s.value) || 0;
  });

  return bins.map((x) => (Number.isFinite(x) && x > 0 ? x : 0));
};

export default function useStepsDisplayed() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rangeDays, setRangeDays] = useState<DaysRange>(7);
  const [steps7d, setSteps7d] = useState<DayPoint[]>([]);
  const [stepsRange, setStepsRange] = useState<DayPoint[]>([]);
  const [stepsDayBins, setStepsDayBins] = useState<number[]>(
    new Array(24).fill(0)
  );

  const importLastDays = async (days: DaysRange) => {
    const now = new Date();
    const start = addDaysLocal(now, -(days - 1));
    const startDate = startOfDayLocal(start);
    const endDate = now;

    try {
      const mappedSteps = await loadStepSamples(days);

      setStepsDayBins(aggregateStepsByHourForDay(mappedSteps, new Date()));

      const aggregatedStepsAll = aggregateStepsByDate(mappedSteps);
      const aggregatedSteps = keepMostRecentDays(
        filterPointsToWindow(aggregatedStepsAll, startDate, endDate),
        days
      );

      if (days === 7) setSteps7d(aggregatedSteps);
      setStepsRange(aggregatedSteps);

      setLoading(false);
    } catch (e: any) {
      setLoading(false);
      setError(e?.message || "Error loading step data");
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

  const todayKey = localDay(new Date());

  const stepsToday = useMemo(() => {
    const found = steps7d.find((x) => String(x.startDate).slice(0, 10) === todayKey);
    const v = found?.value;
    return typeof v === "number" ? v : Number(v) || 0;
  }, [steps7d, todayKey]);

  return {
    isAuthorized,
    loading,
    error,

    connectAndImport,
    loadRange,

    rangeDays,
    steps7d,
    stepsRange,
    stepsDayBins,
    stepsToday,
  };
}