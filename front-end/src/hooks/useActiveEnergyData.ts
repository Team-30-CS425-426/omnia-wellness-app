import { useMemo, useState } from "react";
import { Platform } from "react-native";
import {
  queryQuantitySamples,
  requestAuthorization,
} from "@kingstinct/react-native-healthkit";

type DaysRange = 7 | 30;

export type ActiveEnergyPoint = {
  date: string;      // YYYY-MM-DD
  calories: number;  // Apple Health "cal"
};

type RawSample = {
  startDate: Date;
  endDate: Date;
  value: number;
};

const localDay = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const startOfDayLocal = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

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

const aggregateActiveEnergyByDate = (samples: RawSample[]): ActiveEnergyPoint[] => {
  const byDate: Record<string, number> = {};

  (samples || []).forEach((s) => {
    const dateKey = localDay(s.startDate);
    byDate[dateKey] = (byDate[dateKey] || 0) + (Number(s.value) || 0);
  });

  return Object.keys(byDate)
    .sort((a, b) => (a < b ? 1 : -1)) // newest first
    .map((dateKey) => ({
      date: dateKey,
      calories: byDate[dateKey],
    }));
};

const buildFullRange = (
  points: ActiveEnergyPoint[],
  days: DaysRange
): ActiveEnergyPoint[] => {
  const map = new Map<string, number>();
  points.forEach((p) => {
    map.set(p.date, Number(p.calories) || 0);
  });

  const today = new Date();
  const output: ActiveEnergyPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = addDaysLocal(today, -i);
    const key = localDay(d);

    output.push({
      date: key,
      calories: map.get(key) ?? 0,
    });
  }

  return output;
};

const useActiveEnergyData = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rangeDays, setRangeDays] = useState<DaysRange>(7);
  const [activeEnergyRange, setActiveEnergyRange] = useState<ActiveEnergyPoint[]>([]);

  const isHealthKitAvailable = Platform.OS === "ios";

  const connectAndImport = async () => {
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
          "HKQuantityTypeIdentifierActiveEnergyBurned",
        ],
        toWrite: [],
      } as any);

      if (!ok) {
        setIsAuthorized(false);
        setLoading(false);
        setError("Health permissions not granted");
        return;
      }

      setIsAuthorized(true);
      await loadRange(7);
    } catch (e: any) {
      console.error("[ActiveEnergy] Authorization error:", e);
      setIsAuthorized(false);
      setLoading(false);
      setError(e?.message || "Health permissions not granted");
    }
  };

  const importLastDays = async (days: DaysRange) => {
    const now = new Date();
    const start = addDaysLocal(now, -(days - 1));

    const startDate = startOfDayLocal(start);
    const endDate = now;

    try {
      const samples = await queryQuantitySamples(
        "HKQuantityTypeIdentifierActiveEnergyBurned" as any,
        {
          startDate,
          endDate,
          unit: "kcal",
          limit: 5000,
          sortOrder: "desc",
        } as any
      );

      const mapped: RawSample[] = (samples || []).map((s: any) => ({
        startDate: toDate(s.startDate),
        endDate: toDate(s.endDate),
        value: getQuantityValue(s),
      }));

      const aggregatedNewestFirst = aggregateActiveEnergyByDate(mapped);
      const fullRange = buildFullRange(aggregatedNewestFirst, days);

      setActiveEnergyRange(fullRange);
      setLoading(false);
    } catch (e: any) {
      console.error("[ActiveEnergy] importLastDays error:", e);
      setLoading(false);
      setError(e?.message || "Error loading active energy data");
    }
  };

  const loadRange = async (days: DaysRange) => {
    if (!isAuthorized && activeEnergyRange.length === 0) {
      // allow first-time load only after connect
    }

    setRangeDays(days);
    setError(null);
    setLoading(true);
    await importLastDays(days);
  };

  const todayKey = localDay(new Date());

  const activeEnergyToday = useMemo(() => {
    const found = activeEnergyRange.find((x) => x.date === todayKey);
    return Number(found?.calories) || 0;
  }, [activeEnergyRange, todayKey]);

  return {
    isAuthorized,
    loading,
    error,

    rangeDays,
    activeEnergyRange,
    activeEnergyToday,

    connectAndImport,
    loadRange,
  };
};

export default useActiveEnergyData;