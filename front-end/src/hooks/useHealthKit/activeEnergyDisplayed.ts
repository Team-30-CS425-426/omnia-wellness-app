import { useMemo, useState } from "react";
import { authorizeHealthKit } from "./healthAuthorization";
import {
  ActiveEnergyPoint,
  addDaysLocal,
  DaysRange,
  loadActiveEnergySamples,
  localDay,
  RawSample,
} from "./loadData";

const UI_DAYS_WINDOW: DaysRange = 7;

const aggregateActiveEnergyByDate = (samples: RawSample[]): ActiveEnergyPoint[] => {
  const byDate: Record<string, number> = {};

  (samples || []).forEach((s) => {
    const dateKey = localDay(s.startDate);
    byDate[dateKey] = (byDate[dateKey] || 0) + (Number(s.value) || 0);
  });

  return Object.keys(byDate)
    .sort((a, b) => (a < b ? 1 : -1))
    .map((dateKey) => ({
      date: dateKey,
      calories: byDate[dateKey],
    }));
};

const buildFullActiveEnergyRange = (
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

export default function useActiveEnergyDisplayed() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rangeDays, setRangeDays] = useState<DaysRange>(7);
  const [activeEnergyRange, setActiveEnergyRange] = useState<ActiveEnergyPoint[]>([]);

  const importLastDays = async (days: DaysRange) => {
    try {
      const mappedActiveEnergy = await loadActiveEnergySamples(days);
      const aggregatedActiveEnergy = aggregateActiveEnergyByDate(mappedActiveEnergy);
      setActiveEnergyRange(buildFullActiveEnergyRange(aggregatedActiveEnergy, days));

      setLoading(false);
    } catch (e: any) {
      setLoading(false);
      setError(e?.message || "Error loading active energy data");
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

  const activeEnergyToday = useMemo(() => {
    const found = activeEnergyRange.find((x) => x.date === todayKey);
    return Number(found?.calories) || 0;
  }, [activeEnergyRange, todayKey]);

  return {
    isAuthorized,
    loading,
    error,

    connectAndImport,
    loadRange,

    rangeDays,
    activeEnergyRange,
    activeEnergyToday,
  };
}