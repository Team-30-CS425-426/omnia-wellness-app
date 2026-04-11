import { supabase } from "@/config/supabaseConfig";
import {
  findMissingDates,
  getActiveEnergyCacheLastNDays,
  getLastNDayKeys,
  upsertActiveEnergyCache,
} from "@/src/services/activeEnergyCacheService";
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

export default function useActiveEnergyDisplayed(syncFromHealthKit: boolean = false) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rangeDays, setRangeDays] = useState<DaysRange>(7);
  const [activeEnergyRange, setActiveEnergyRange] = useState<ActiveEnergyPoint[]>([]);

  const importLastDays = async (days: DaysRange) => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
  
      if (userError) throw userError;
      if (!user) throw new Error("No authenticated user found.");
  
      // 1. Read cache first
      const cachedRows = await getActiveEnergyCacheLastNDays(user.id, days);
      setActiveEnergyRange(cachedRows);
  
      // 2. Figure out which dates are missing
      const expectedDates = getLastNDayKeys(days);
      const cachedDatesWithData = cachedRows
        .filter((r) => Number(r.calories) > 0)
        .map((r) => r.date);
  
      const missingDates = findMissingDates(expectedDates, cachedDatesWithData);
  
      // Always refresh today too
      const todayKey = localDay(new Date());
      const datesToRefresh = Array.from(new Set([...missingDates, todayKey]));
  
      // 3. Fetch HealthKit
      const mappedActiveEnergy = await loadActiveEnergySamples(days);
      const aggregatedActiveEnergy = aggregateActiveEnergyByDate(mappedActiveEnergy);
      const fullRange = buildFullActiveEnergyRange(aggregatedActiveEnergy, days);
  
      // 4. Save only missing dates + today
      const refreshRows = fullRange
        .filter((p) => datesToRefresh.includes(p.date))
        .map((p) => ({
          date: p.date,
          calories: Number(p.calories) || 0,
        }));
  
      if (refreshRows.length > 0) {
        await upsertActiveEnergyCache(user.id, refreshRows);
      }
  
      // 5. Reload from Supabase so UI matches cache
      const refreshedRows = await getActiveEnergyCacheLastNDays(user.id, days);
      setActiveEnergyRange(refreshedRows);
  
      setLoading(false);
    } catch (e: any) {
      setLoading(false);
      setError(e?.message || "Error loading active energy data");
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

  const loadCacheOnly = async (days: DaysRange) => {
    try {
      setRangeDays(days);
  
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
  
      if (userError) throw userError;
      if (!user) throw new Error("No authenticated user found.");
  
      const cachedRows = await getActiveEnergyCacheLastNDays(user.id, days);
      setActiveEnergyRange(cachedRows);
  
      setLoading(false);
    } catch (e: any) {
      setLoading(false);
      setError(e?.message || "Error loading cached active energy data");
    }
  };

  const loadRange = async (days: DaysRange) => {
    setRangeDays(days);
    setError(null);
    setLoading(true);
  
    if (syncFromHealthKit) {
      if (!isAuthorized) {
        setError("Please connect Apple Health first.");
        setLoading(false);
        return;
      }
  
      await importLastDays(days);
    } else {
      await loadCacheOnly(days);
    }
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