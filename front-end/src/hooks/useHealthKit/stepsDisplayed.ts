import { supabase } from "@/config/supabaseConfig";
import {
  findMissingDates,
  getLastNDayKeys,
  getStepCacheLastNDays,
  upsertStepCache,
} from "@/src/services/stepCacheService";
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

const aggregateStepsByHourForDay = (
  samples: RawSample[],
  day: Date
): number[] => {
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

export default function useStepsDisplayed(syncFromHealthKit: boolean = false) {
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
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("No authenticated user found.");

      // 1. Read cache first
      const cachedRows = await getStepCacheLastNDays(user.id, days);

      const cachedPoints: DayPoint[] = cachedRows.map((row) => ({
        startDate: row.date,
        endDate: row.date,
        value: row.steps,
      }));

      if (days === 7) setSteps7d(cachedPoints);
      setStepsRange(cachedPoints);
      setStepsDayBins(new Array(24).fill(0));

      // 2. Figure out which dates are missing
      const expectedDates = getLastNDayKeys(days);
      const cachedDatesWithData = cachedRows
        .filter((r) => Number(r.steps) > 0)
        .map((r) => r.date);

      const missingDates = findMissingDates(expectedDates, cachedDatesWithData);

      // Always refresh today too
      const todayKey = localDay(new Date());
      const datesToRefresh = Array.from(new Set([...missingDates, todayKey]));

      // 3. Fetch HealthKit
      const mappedSteps = await loadStepSamples(days);
      setStepsDayBins(aggregateStepsByHourForDay(mappedSteps, new Date()));

      const now = new Date();
      const start = addDaysLocal(now, -(days - 1));
      const startDate = startOfDayLocal(start);
      const endDate = now;

      const aggregatedStepsAll = aggregateStepsByDate(mappedSteps);
      const aggregatedSteps = keepMostRecentDays(
        filterPointsToWindow(aggregatedStepsAll, startDate, endDate),
        days
      );

      // 4. Save only missing dates + today
      const refreshRows = aggregatedSteps
        .filter((p) =>
          datesToRefresh.includes(String(p.startDate).slice(0, 10))
        )
        .map((p) => ({
          date: String(p.startDate).slice(0, 10),
          steps: Number(p.value) || 0,
        }));

      if (refreshRows.length > 0) {
        await upsertStepCache(user.id, refreshRows);
      }

      // 5. Reload from Supabase so UI matches cache
      const refreshedRows = await getStepCacheLastNDays(user.id, days);

      const refreshedPoints: DayPoint[] = refreshedRows.map((row) => ({
        startDate: row.date,
        endDate: row.date,
        value: row.steps,
      }));

      if (days === 7) setSteps7d(refreshedPoints);
      setStepsRange(refreshedPoints);

      setLoading(false);
    } catch (e: any) {
      setLoading(false);
      setError(e?.message || "Error loading step data");
    }
  };

  const loadCacheOnly = async (days: DaysRange) => {
    try {
      setRangeDays(days);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("No authenticated user found.");

      const cachedRows = await getStepCacheLastNDays(user.id, days);

      const cachedPoints: DayPoint[] = cachedRows.map((row) => ({
        startDate: row.date,
        endDate: row.date,
        value: row.steps,
      }));

      if (days === 7) setSteps7d(cachedPoints);
      setStepsRange(cachedPoints);

      setLoading(false);
    } catch (e: any) {
      setLoading(false);
      setError(e?.message || "Error loading cached step data");
    }
  };

  const connectAndImport = async () => {
    if (!syncFromHealthKit) {
      return;
    }

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
    setRangeDays(days);
    setError(null);
    setLoading(true);

    if (syncFromHealthKit) {
      try {
        if (!isAuthorized) {
          await authorizeHealthKit();
          setIsAuthorized(true);
        }

        await importLastDays(days);
      } catch (e: any) {
        setIsAuthorized(false);
        setLoading(false);
        setError(e?.message || "Health permissions not granted");
      }
    } else {
      await loadCacheOnly(days);
    }
  };

  const todayKey = localDay(new Date());

  const stepsToday = useMemo(() => {
    const source = steps7d.length > 0 ? steps7d : stepsRange;
  
    const found = source.find(
      (x) => String(x.startDate).slice(0, 10) === todayKey
    );
  
    const v = found?.value;
    return typeof v === "number" ? v : Number(v) || 0;
  }, [steps7d, stepsRange, todayKey]);

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