// code written by Daisy Madera (extended to support Today + 7/30 toggle)

import { useMemo, useState } from "react";
import { Platform } from "react-native";

import {
  requestAuthorization,
  queryQuantitySamples,
  queryCategorySamples,
} from "@kingstinct/react-native-healthkit";

import { exportHealthCsv } from "../services/healthCSVExport";

type DaysRange = 7 | 30;

// SAME output shape as before (easy for UI + CSV):
// startDate/endDate are "YYYY-MM-DD"
type DayPoint = {
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

const UI_DAYS_WINDOW: DaysRange = 7;
const EXPORT_DAYS_WINDOW: DaysRange = 30;

// --- helpers ---
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

const aggregateStepsByDate = (samples: RawSample[]): DayPoint[] => {
  const byDate: Record<string, number> = {};
  (samples || []).forEach((s) => {
    const dateKey = isoDay(s.startDate);
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
    const dateKey = isoDay(s.startDate);
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

// safest conversion (library may return Date or string depending on platform/version)
const toDate = (x: any): Date => {
  if (x instanceof Date) return x;
  const d = new Date(x);
  return isNaN(d.getTime()) ? new Date() : d;
};

const getQuantityValue = (s: any): number => {
  // different versions may name this differently
  const v =
    s?.quantity ??
    s?.value ??
    s?.quantityValue ??
    s?.count ??
    s?.sum ??
    0;

  return typeof v === "number" ? v : Number(v) || 0;
};

const useHealthData = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [steps7d, setSteps7d] = useState<DayPoint[]>([]);
  const [sleep7d, setSleep7d] = useState<DayPoint[]>([]);

  const [rangeDays, setRangeDays] = useState<DaysRange>(7);
  const [stepsRange, setStepsRange] = useState<DayPoint[]>([]);
  const [sleepRange, setSleepRange] = useState<DayPoint[]>([]);

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
      //  New library expects an object { toRead, toWrite }
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
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    console.log("[Health] importLastDays() range:", days, start, end);

    try {
      // queryQuantitySamples(identifier, options)
      const stepSamples = await queryQuantitySamples(
        "HKQuantityTypeIdentifierStepCount" as any,
        {
          startDate: start,
          endDate: end,
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

      const aggregatedSteps = aggregateStepsByDate(mappedSteps);

      if (days === 7) setSteps7d(aggregatedSteps);
      setStepsRange(aggregatedSteps);

      // queryCategorySamples(identifier, options)
      const sleepSamples = await queryCategorySamples(
        "HKCategoryTypeIdentifierSleepAnalysis" as any,
        {
          startDate: start,
          endDate: end,
          limit: 5000,
          sortOrder: "desc",
        } as any
      );

      const mappedSleep: RawSample[] = (sleepSamples || []).map((s: any) => ({
        startDate: toDate(s.startDate),
        endDate: toDate(s.endDate),
        value: 1, // duration computed from start/end
      }));

      const aggregatedSleep = aggregateSleepByDate(mappedSleep);

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

  const todayKey = new Date().toISOString().slice(0, 10);

  const stepsToday = useMemo(() => {
    const found = steps7d.find((x) => String(x.startDate).slice(0, 10) === todayKey);
    const v = found?.value;
    return typeof v === "number" ? v : Number(v) || 0;
  }, [steps7d, todayKey]);

  const sleepToday = useMemo(() => {
    const found = sleep7d.find((x) => String(x.startDate).slice(0, 10) === todayKey);
    const v = found?.value;
    return typeof v === "number" ? v : Number(v) || 0;
  }, [sleep7d, todayKey]);

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
  };
};

export default useHealthData;
