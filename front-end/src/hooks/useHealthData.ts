// code written by Daisy Madera (extended to support Today + 7/30 toggle)

import { useMemo, useState } from "react";
import { Platform } from "react-native";

import {
  queryCategorySamples,
  queryQuantitySamples,
  requestAuthorization,
} from "@kingstinct/react-native-healthkit";

import { exportHealthCsv } from "../services/healthCSVExport";

type DaysRange = 7 | 30;

// SAME output shape as before (easy for UI + CSV):
// startDate/endDate are "YYYY-MM-DD"
export type DayPoint = {
  startDate: string;
  endDate: string;
  value: number;
};

// Raw samples we normalize into dates
type RawSample = {
  startDate: Date;
  endDate: Date;
  value: number;
};

type SleepSpan = { start: Date; end: Date } | null;

const UI_DAYS_WINDOW: DaysRange = 7;
const EXPORT_DAYS_WINDOW: DaysRange = 30;

// --- helpers ---

const localDay = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const setTimeLocal = (d: Date, hour: number, minute = 0) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, minute, 0, 0);

const startOfDayLocal = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

const endOfDayLocal = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

const addDaysLocal = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const toDate = (x: any): Date => {
  if (x instanceof Date) return x;
  const d = new Date(x);
  return isNaN(d.getTime()) ? new Date() : d;
};

const getQuantityValue = (s: any): number => {
  const v =
    s?.quantity ??
    s?.value ??
    s?.quantityValue ??
    s?.count ??
    s?.sum ??
    0;

  return typeof v === "number" ? v : Number(v) || 0;
};

const keepMostRecentDays = (points: DayPoint[], n: DaysRange): DayPoint[] => {
  return (points || []).slice(0, n);
};

const filterPointsToWindow = (
  points: DayPoint[],
  startDate: Date,
  endDate: Date
): DayPoint[] => {
  const startKey = localDay(startDate);
  const endkey = localDay(endDate);
  return (points || []).filter(
    (p) => p.startDate >= startKey && p.startDate <= endkey
  );
};

const aggregateStepsByDate = (samples: RawSample[]): DayPoint[] => {
  const byDate: Record<string, number> = {};
  (samples || []).forEach((s) => {
    const dateKey = localDay(s.startDate);
    byDate[dateKey] = (byDate[dateKey] || 0) + (Number(s.value) || 0);
  });

  return Object.keys(byDate)
    .sort((a, b) => (a < b ? 1 : -1)) // newest first
    .map((dateKey) => ({
      startDate: dateKey,
      endDate: dateKey,
      value: byDate[dateKey],
    }));
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
    .sort((a, b) => (a < b ? 1 : -1)) // newest first
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

const aggregateSleepByHourForDay = (samples: RawSample[], day: Date): number[] => {
  const bins = new Array(24).fill(0);
  const dayStart = startOfDayLocal(day);
  const dayEnd = endOfDayLocal(day);

  (samples || []).forEach((s) => {
    // clamp sample to the day window
    const st = s.startDate < dayStart ? dayStart : s.startDate;
    const en = s.endDate > dayEnd ? dayEnd : s.endDate;

    if (en <= dayStart || st >= dayEnd) return;
    if (en <= st) return;

    // add minutes into hour buckets
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


const useHealthData = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [steps7d, setSteps7d] = useState<DayPoint[]>([]);
  const [sleep7d, setSleep7d] = useState<DayPoint[]>([]);

  const [rangeDays, setRangeDays] = useState<DaysRange>(7);
  const [stepsRange, setStepsRange] = useState<DayPoint[]>([]);
  const [sleepRange, setSleepRange] = useState<DayPoint[]>([]);

  const [stepsDayBins, setStepsDayBins] = useState<number[]>(
    new Array(24).fill(0)
  );
  const [sleepDayBins, setSleepDayBins] = useState<number[]>(
    new Array(24).fill(0)
  );
  const [sleepDaySpan, setSleepDaySpan] = useState<{ start: Date; end: Date } | null>(null);

  

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isHealthKitAvailable = Platform.OS === "ios";

  const connectAndImport = async () => {
    console.log("[Health] connectAndImport() called");
    setError(null);
    setLoading(true);

    if (!isHealthKitAvailable) {
      setLoading(false);
      setError("HealthKit only works on iOS.");
      return;
    }

    try {
      const ok = await requestAuthorization({
        toRead: [
          "HKQuantityTypeIdentifierStepCount",
          "HKCategoryTypeIdentifierSleepAnalysis",
        ],
        toWrite: [],
      } as any);

      console.log("[Health] requestAuthorization result:", ok);
      if (!ok) {
        setIsAuthorized(false);
        setLoading(false);
        setError("Health permissions not granted");
        return;
      }

      setIsAuthorized(true);
      await importLastDays(UI_DAYS_WINDOW);
    } catch (e: any) {
      console.error("[Health] Authorization error:", e);
      setIsAuthorized(false);
      setLoading(false);
      setError(e?.message || "Health permissions not granted");
    }
  };

  const importLastDays = async (days: DaysRange) => {
    const now = new Date();

    const start = new Date(now);
    start.setDate(now.getDate() - (days - 1));

    const startDate = startOfDayLocal(start);
    const endDate = now; 

    console.log("[Health] importLastDays() range:", days, startDate, endDate);

    try {
      const stepSamples = await queryQuantitySamples(
        "HKQuantityTypeIdentifierStepCount" as any,
        {
          startDate: startDate,
          endDate: endDate,
          unit: "count",
          limit: 5000,
          sortOrder: "desc",
        } as any
      );

      const mappedSteps: RawSample[] = (stepSamples || []).map((s: any) => ({
        startDate: toDate(s.startDate),
        endDate: toDate(s.endDate),
        value: getQuantityValue(s),
      }));

      setStepsDayBins(aggregateStepsByHourForDay(mappedSteps, new Date()));

      const aggregatedStepsAll = aggregateStepsByDate(mappedSteps);

      const aggregatedSteps = keepMostRecentDays(
        filterPointsToWindow(aggregatedStepsAll, startDate, endDate),
        days
      );

      if (days === 7) setSteps7d(aggregatedSteps);
      setStepsRange(aggregatedSteps);

      // queryCategorySamples(identifier, options)
      const sleepSamples = await queryCategorySamples(
        "HKCategoryTypeIdentifierSleepAnalysis" as any,
        {
          startDate: startDate,
          endDate: endDate,
          limit: 5000,
          sortOrder: "desc",
        } as any
      );

      const mappedSleep: RawSample[] = (sleepSamples || []).map((s: any) => ({
        startDate: toDate(s.startDate),
        endDate: toDate(s.endDate),
        value: 1, // duration computed from start/end
      }));

      const sleepDay = addDaysLocal(startOfDayLocal(new Date()), -1); // yesterday (night before)
      setSleepDayBins(aggregateSleepByHourForDay(mappedSleep, sleepDay));

      // Apple-like "sleep day" window: (sleepDay-1) 10 PM -> (sleepDay) 10 AM
      const windowStart = setTimeLocal(addDaysLocal(sleepDay, -1), 22, 0); // day before sleepDay at 10pm
      const windowEnd = setTimeLocal(sleepDay, 10, 0); // sleepDay at 10am

      let minStart: Date | null = null;
      let maxEnd: Date | null = null;

      (mappedSleep || []).forEach((s) => {
        // must overlap the window
        if (s.endDate <= windowStart || s.startDate >= windowEnd) return;

        // clamp sample to window
        const st = s.startDate < windowStart ? windowStart : s.startDate;
        const en = s.endDate > windowEnd ? windowEnd : s.endDate;

        if (en <= st) return;

        if (!minStart || st < minStart) minStart = st;
        if (!maxEnd || en > maxEnd) maxEnd = en;
      });

      setSleepDaySpan(minStart && maxEnd ? { start: minStart, end: maxEnd } : null);
      console.log("[SleepSpan] sleepDay:", sleepDay);
      console.log("[SleepSpan] window:", windowStart, windowEnd);
      console.log("[SleepSpan] min/max:", minStart, maxEnd);
      console.log("[SleepSpan] mappedSleep count:", mappedSleep.length);

      const aggregatedSleepAll = aggregateSleepByDate(mappedSleep);

      const aggregatedSleep = keepMostRecentDays(
        filterPointsToWindow(aggregatedSleepAll, startDate, endDate),
        days
      );

      if (days === 7) setSleep7d(aggregatedSleep);
      setSleepRange(aggregatedSleep);


      setLoading(false);
    } catch (e: any) {
      console.error("[Health] importLastDays error:", e);
      setLoading(false);
      setError(e?.message || "Error loading health data");
    }
  };

  const loadRange = async (days: DaysRange) => {
    console.log(`[Health] loadRange(${days}) called`);

    if (!isAuthorized) {
      setError("Please connect Apple Health first.");
      return;
    }

    setRangeDays(days);
    setError(null);
    setLoading(true);

    await importLastDays(days);
  };

  const exportToCsv = async () => {
    console.log("[Health] exportToCsv() called");

    if (!isAuthorized) {
      setError("Please connect Apple Health first.");
      return;
    }

    setError(null);
    setLoading(true);

    // Ensure we have 30-day values before exporting
    await importLastDays(EXPORT_DAYS_WINDOW);

    try {
      await exportHealthCsv(stepsRange, sleepRange);
      setLoading(false);
    } catch (e: any) {
      console.error("[Health] export error:", e);
      setLoading(false);
      setError(e?.message || "Error exporting CSV");
    }
  };

  const todayKey = localDay(new Date());
  const yesterdayKey = localDay (new Date (Date.now() - 24 * 60 * 60 * 1000));

  console.log("[Health] todayKey:", todayKey, "yesterdayKey:", yesterdayKey);
  console.log("[Health] sleep7d dates:", sleep7d.map((x) => x.startDate));

  const stepsToday = useMemo(() => {
    const found = steps7d.find((x) => String(x.startDate).slice(0, 10) === todayKey);
    const v = found?.value;
    return typeof v === "number" ? v : Number(v) || 0;
  }, [steps7d, todayKey]);

  const sleepToday = useMemo(() => {
    const found = sleep7d.find((x) => String(x.startDate).slice(0, 10) === yesterdayKey);
    const v = found?.value;
    return typeof v === "number" ? v : Number(v) || 0;
  }, [sleep7d, yesterdayKey]);

  return {
    isAuthorized,
    loading,
    error,

    steps7d,
    sleep7d,

    connectAndImport,
    exportToCsv,

    stepsToday,
    sleepToday,

    rangeDays,
    stepsRange,
    sleepRange,
    loadRange,

    stepsDayBins,
    sleepDayBins,
    sleepDaySpan,
  };
};

export default useHealthData;
