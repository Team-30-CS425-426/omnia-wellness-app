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

type MonthAverageSummary = {
  currentMonthLabel: string;
  previousMonthLabel: string;
  currentMonthAverage: number;
  previousMonthAverage: number;
};

type WeekHighlightSummary = {
  todayCalories: number;
  averageCalories: number;
  isBelowAverage: boolean;
  message: string;
};
 
type HourlyCumulativePoint = {
  hour: number;
  calories: number;
};

type TodayVsAverageHourlySummary = {
  todayCurve: HourlyCumulativePoint[];
  averageCurve: HourlyCumulativePoint[];
  currentHour: number;
};

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

const formatMonthLabel = (year: number, monthIndex: number) => {
  return new Date(year, monthIndex, 1).toLocaleDateString(undefined, {
    month: "long",
  });
};

const buildWeekHighlightSummary = (
  points: ActiveEnergyPoint[],
  todayKey: string
): WeekHighlightSummary => {
  const todayEntry = points.find((p) => p.date === todayKey);
  const todayCalories = Number(todayEntry?.calories) || 0;

  const averageCalories =
    points.length > 0
      ? points.reduce((sum, p) => sum + (Number(p.calories) || 0), 0) / points.length
      : 0;

  const isBelowAverage = todayCalories < averageCalories;

  return {
    todayCalories,
    averageCalories,
    isBelowAverage,
    message: isBelowAverage
      ? "You’re burning fewer calories today than you typically do."
      : "You’re burning more calories today than you typically do.",
  };
};

const buildMonthAverageSummary = (
  points: ActiveEnergyPoint[]
): MonthAverageSummary => {
  const monthMap: Record<string, number[]> = {};

  points.forEach((item) => {
    const d = new Date(`${item.date}T00:00:00`);
    if (Number.isNaN(d.getTime())) return;

    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!monthMap[key]) monthMap[key] = [];
    monthMap[key].push(Number(item.calories) || 0);
  });

  const monthEntries = Object.entries(monthMap)
    .map(([key, values]) => {
      const [yearStr, monthStr] = key.split("-");
      const year = Number(yearStr);
      const monthIndex = Number(monthStr);

      const avg =
        values.length > 0
          ? values.reduce((sum, v) => sum + v, 0) / values.length
          : 0;

      return {
        key,
        year,
        monthIndex,
        monthLabel: formatMonthLabel(year, monthIndex),
        avg,
      };
    })
    .sort((a, b) =>
      a.year === b.year ? a.monthIndex - b.monthIndex : a.year - b.year
    );

  const current = monthEntries[monthEntries.length - 1];
  const previous = monthEntries[monthEntries.length - 2];

  return {
    currentMonthLabel: current?.monthLabel || "Current Month",
    previousMonthLabel: previous?.monthLabel || "Previous Month",
    currentMonthAverage: current?.avg || 0,
    previousMonthAverage: previous?.avg || 0,
  };
};

const getHourOfDate = (dateInput: string | Date) => {
  const d = new Date(dateInput);
  return d.getHours();
};

const buildHourlyCumulative = (samples: RawSample[]): HourlyCumulativePoint[] => {
  const hourlyTotals = Array.from({ length: 24 }, () => 0);

  (samples || []).forEach((s) => {
    const hour = getHourOfDate(s.startDate);
    if (hour >= 0 && hour < 24) {
      hourlyTotals[hour] += Number(s.value) || 0;
    }
  });

  let running = 0;
  return hourlyTotals.map((value, hour) => {
    running += value;
    return {
      hour,
      calories: Number(running.toFixed(1)),
    };
  });
};

const buildAverageHourlyCumulative = (
  samples: RawSample[],
  todayKey: string
): HourlyCumulativePoint[] => {
  const byDayHour: Record<string, number[]> = {};

  (samples || []).forEach((s) => {
    const dateKey = localDay(s.startDate);
    if (dateKey === todayKey) return;

    const hour = getHourOfDate(s.startDate);
    const key = `${dateKey}-${hour}`;

    if (!byDayHour[key]) byDayHour[key] = [];
    byDayHour[key].push(Number(s.value) || 0);
  });

  const uniquePastDays = Array.from(
    new Set(
      (samples || [])
        .map((s) => localDay(s.startDate))
        .filter((dateKey) => dateKey !== todayKey)
    )
  );

  const hourlyAverages = Array.from({ length: 24 }, (_, hour) => {
    let totalForHour = 0;

    uniquePastDays.forEach((dateKey) => {
      const key = `${dateKey}-${hour}`;
      const values = byDayHour[key] || [];
      totalForHour += values.reduce((sum, v) => sum + v, 0);
    });

    return uniquePastDays.length > 0 ? totalForHour / uniquePastDays.length : 0;
  });

  let running = 0;
  return hourlyAverages.map((value, hour) => {
    running += value;
    return {
      hour,
      calories: Number(running.toFixed(1)),
    };
  });
};

export default function useActiveEnergyDisplayed(syncFromHealthKit: boolean = false) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [intradayLoading, setIntradayLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rangeDays, setRangeDays] = useState<DaysRange>(7);
  const [activeEnergyRange, setActiveEnergyRange] = useState<ActiveEnergyPoint[]>([]);

  const todayKey = localDay(new Date());

  const [todayVsAverageHourly, setTodayVsAverageHourly] =
    useState<TodayVsAverageHourlySummary>({
      todayCurve: [],
      averageCurve: [],
      currentHour: new Date().getHours(),
    });

  const importLastDays = async (days: DaysRange) => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("No authenticated user found.");

      const cachedRows = await getActiveEnergyCacheLastNDays(user.id, days);
      setActiveEnergyRange(cachedRows);

      const expectedDates = getLastNDayKeys(days);
      const cachedDatesWithData = cachedRows
        .filter((r) => Number(r.calories) > 0)
        .map((r) => r.date);

      const missingDates = findMissingDates(expectedDates, cachedDatesWithData);

      const datesToRefresh = Array.from(new Set([...missingDates, todayKey]));

      const mappedActiveEnergy = await loadActiveEnergySamples(days);
      const aggregatedActiveEnergy = aggregateActiveEnergyByDate(mappedActiveEnergy);
      const fullRange = buildFullActiveEnergyRange(aggregatedActiveEnergy, days);

      const refreshRows = fullRange
        .filter((p) => datesToRefresh.includes(p.date))
        .map((p) => ({
          date: p.date,
          calories: Number(p.calories) || 0,
        }));

      if (refreshRows.length > 0) {
        await upsertActiveEnergyCache(user.id, refreshRows);
      }

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

  const loadIntradayHighlight = async (days: DaysRange = 7) => {
    try {
      setIntradayLoading(true);
      setError(null);

      await authorizeHealthKit();
      setIsAuthorized(true);

      const mappedActiveEnergy = await loadActiveEnergySamples(days);

      const todayCurve = buildHourlyCumulative(
        mappedActiveEnergy.filter((s) => localDay(s.startDate) === todayKey)
      );

      const averageCurve = buildAverageHourlyCumulative(
        mappedActiveEnergy,
        todayKey
      );

      setTodayVsAverageHourly({
        todayCurve,
        averageCurve,
        currentHour: new Date().getHours(),
      });
    } catch (e: any) {
      setError(e?.message || "Error loading intraday active energy highlight");
    } finally {
      setIntradayLoading(false);
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

  const activeEnergyToday = useMemo(() => {
    const found = activeEnergyRange.find((x) => x.date === todayKey);
    return Number(found?.calories) || 0;
  }, [activeEnergyRange, todayKey]);

  const weekHighlightSummary = useMemo(() => {
    return buildWeekHighlightSummary(activeEnergyRange, todayKey);
  }, [activeEnergyRange, todayKey]);

  const monthAverageSummary = useMemo(() => {
    return buildMonthAverageSummary(activeEnergyRange);
  }, [activeEnergyRange]);

  return {
    isAuthorized,
    loading,
    intradayLoading,
    error,

    connectAndImport,
    loadRange,
    loadIntradayHighlight,

    rangeDays,
    activeEnergyRange,
    activeEnergyToday,

    weekHighlightSummary,
    monthAverageSummary,
    todayVsAverageHourly,
  };
}