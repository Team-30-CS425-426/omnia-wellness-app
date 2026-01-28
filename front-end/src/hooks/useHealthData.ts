// code written by Daisy Madera (extended to support Today + 7/30 toggle)
import { useMemo, useState } from "react";
import { Platform } from "react-native";

import AppleHealthKit, {
  HealthKitPermissions,
  HealthValue,
} from "react-native-health";

import { exportHealthCsv } from "../services/healthCSVExport";

const UI_DAYS_WINDOW: 7 = 7;
const EXPORT_DAYS_WINDOW: 30 = 30;

const { Permissions } = AppleHealthKit.Constants;

const healthPermissions: HealthKitPermissions = {
  permissions: {
    read: [Permissions.Steps, Permissions.SleepAnalysis],
    write: [],
  },
};

type DaysRange = 7 | 30;

const useHealthData = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Existing 7-day state (kept)
  const [steps7d, setSteps7d] = useState<HealthValue[]>([]);
  const [sleep7d, setSleep7d] = useState<HealthValue[]>([]);

  // New: range state for details page (7 or 30)
  const [rangeDays, setRangeDays] = useState<DaysRange>(7);
  const [stepsRange, setStepsRange] = useState<HealthValue[]>([]);
  const [sleepRange, setSleepRange] = useState<HealthValue[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------- helpers ----------
  const aggregateStepsByDate = (samples: HealthValue[]) => {
    const byDate: Record<string, number> = {};
    (samples || []).forEach((sample: any) => {
      const dateKey = String(sample.startDate).slice(0, 10);
      const rawValue = sample.value;
      const value =
        typeof rawValue === "number" ? rawValue : Number(rawValue) || 0;
      byDate[dateKey] = (byDate[dateKey] || 0) + value;
    });

    return Object.keys(byDate)
      .sort((a, b) => (a < b ? 1 : -1)) // newest first
      .map(
        (dateKey) =>
          ({
            startDate: dateKey,
            endDate: dateKey,
            value: byDate[dateKey],
          } as any)
      );
  };

  const aggregateSleepByDate = (sleepResults: any[]) => {
    const sleepByDate: Record<string, number> = {};
    (sleepResults || []).forEach((sample) => {
      const start = new Date(sample.startDate);
      const end = new Date(sample.endDate);
      const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      const dateKey = String(sample.startDate).slice(0, 10);
      sleepByDate[dateKey] = (sleepByDate[dateKey] || 0) + durationHours;
    });

    return Object.keys(sleepByDate)
      .sort((a, b) => (a < b ? 1 : -1)) // newest first
      .map(
        (dateKey) =>
          ({
            startDate: dateKey,
            endDate: dateKey,
            value: sleepByDate[dateKey],
          } as any)
      );
  };

  const isHealthKitAvailable =
    Platform.OS === "ios" &&
    AppleHealthKit &&
    typeof (AppleHealthKit as any).initHealthKit === "function";

  // ---------- connect ----------
  const connectAndImport = () => {
    console.log("[Health] connectAndImport() called");
    setError(null);
    setLoading(true);

    if (!isHealthKitAvailable) {
      console.warn(
        "[Health] AppleHealthKit.initHealthKit not available - using demo data"
      );
      setLoading(false);
      setError(
        "HealthKit is not available in this dev build. Showing demo data instead."
      );

      // Fake data for simulators / unsupported builds
      const today = new Date();
      const fakeSteps: HealthValue[] = [];
      for (let i = 0; i < UI_DAYS_WINDOW; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);

        fakeSteps.push({
          startDate: d.toISOString(),
          endDate: d.toISOString(),
          value: 5000 + i * 800,
        } as any);
      }

      setIsAuthorized(true);
      setSteps7d(fakeSteps);
      setSleep7d([]);

      // also populate range view defaults
      setRangeDays(7);
      setStepsRange(fakeSteps);
      setSleepRange([]);

      return;
    }

    (AppleHealthKit as any).initHealthKit(healthPermissions, (err: any) => {
      if (err) {
        console.error("[Health] initHealthKit error:", err);
        setLoading(false);
        setError("Health permissions not granted");
        return;
      }

      console.log("[Health] initHealthKit success, importing last 7 days");
      setIsAuthorized(true);
      importLast7Days();
    });
  };

  // ---------- 7-day import (kept) ----------
  const importLast7Days = () => {
    console.log("[Health] importLast7Days() called");

    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - UI_DAYS_WINDOW);

    const options = { startDate: start.toISOString(), endDate: end.toISOString() };

    console.log("[Health] Step options:", options);

    (AppleHealthKit as any).getDailyStepCountSamples(
      options,
      (err: any, results: HealthValue[]) => {
        if (err) {
          console.error("[Health] Error loading steps:", err);
          setError("Error loading steps");
          setLoading(false);
          return;
        }

        const aggregated = aggregateStepsByDate(results || []);
        console.log("[Health] Aggregated steps7d:", aggregated);

        setSteps7d(aggregated);

        // Keep range in sync (default to 7 days)
        setRangeDays(7);
        setStepsRange(aggregated);

        console.log("[Health] Loading sleep samples with options:", options);

        (AppleHealthKit as any).getSleepSamples(
          options,
          (sleepErr: any, sleepResults: any[]) => {
            setLoading(false);

            if (sleepErr) {
              console.error("[Health] Error loading sleep:", sleepErr);
              setError("Error loading sleep");
              return;
            }

            const aggregatedSleep = aggregateSleepByDate(sleepResults || []);
            console.log("[Health] Aggregated sleep7d:", aggregatedSleep);

            setSleep7d(aggregatedSleep);
            setSleepRange(aggregatedSleep);
          }
        );
      }
    );
  };

  // ---------- NEW: load 7 or 30 days for details ----------
  const loadRange = (days: DaysRange) => {
    console.log(`[Health] loadRange(${days}) called`);

    if (!isAuthorized) {
      console.warn("[Health] loadRange: not authorized yet");
      setError("Please connect Apple Health first.");
      return;
    }

    setRangeDays(days);
    setError(null);
    setLoading(true);

    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    const options = { startDate: start.toISOString(), endDate: end.toISOString() };

    (AppleHealthKit as any).getDailyStepCountSamples(
      options,
      (err: any, results: HealthValue[]) => {
        if (err) {
          console.error("[Health] Error loading steps:", err);
          setError("Error loading steps");
          setLoading(false);
          return;
        }

        const aggregatedSteps = aggregateStepsByDate(results || []);
        setStepsRange(aggregatedSteps);

        (AppleHealthKit as any).getSleepSamples(
          options,
          (sleepErr: any, sleepResults: any[]) => {
            setLoading(false);

            if (sleepErr) {
              console.error("[Health] Error loading sleep:", sleepErr);
              setError("Error loading sleep");
              return;
            }

            const aggregatedSleep = aggregateSleepByDate(sleepResults || []);
            setSleepRange(aggregatedSleep);
          }
        );
      }
    );
  };

  // ---------- existing export (kept): always exports 30 days ----------
  const exportToCsv = () => {
    console.log("[Health] exportToCsv() called");

    if (!isAuthorized) {
      console.warn("[Health] exportToCsv: not authorized yet");
      setError("Please connect Apple Health first.");
      return;
    }

    setError(null);

    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - EXPORT_DAYS_WINDOW);

    const options = {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };

    console.log("[Health] Export options:", options);

    (AppleHealthKit as any).getDailyStepCountSamples(
      options,
      (err: any, stepResults: HealthValue[]) => {
        if (err) {
          console.error("[Health] Error loading steps for export:", err);
          setError("Error loading steps for export");
          return;
        }

        const steps30d = aggregateStepsByDate(stepResults || []);
        console.log("[Health] Aggregated steps30d:", steps30d);

        (AppleHealthKit as any).getSleepSamples(
          options,
          async (sleepErr: any, sleepResults: any[]) => {
            if (sleepErr) {
              console.error("[Health] Error loading sleep for export:", sleepErr);
              setError("Error loading sleep for export");
              return;
            }

            const sleep30d = aggregateSleepByDate(sleepResults || []);
            console.log("[Health] Aggregated sleep30d:", sleep30d);

            try {
              await exportHealthCsv(steps30d, sleep30d);
              console.log("[Health] CSV export successful");
            } catch (e: any) {
              console.error("[Health] Error exporting CSV", e);
              setError(e?.message || "Error exporting CSV");
            }
          }
        );
      }
    );
  };

  // ---------- NEW: today values for dashboard ----------
  const todayKey = new Date().toISOString().slice(0, 10);

  const stepsToday = useMemo(() => {
    const found = steps7d.find((x: any) => String(x.startDate).slice(0, 10) === todayKey);
    const v = (found?.value as any);
    const num = typeof v === "number" ? v : Number(v) || 0;
    return num;
  }, [steps7d, todayKey]);

  const sleepToday = useMemo(() => {
    const found = sleep7d.find((x: any) => String(x.startDate).slice(0, 10) === todayKey);
    const v = (found?.value as any);
    const num = typeof v === "number" ? v : Number(v) || 0;
    return num;
  }, [sleep7d, todayKey]);

  return {
    // existing
    isAuthorized,
    loading,
    error,
    steps7d,
    sleep7d,
    connectAndImport,
    exportToCsv,

    // new
    stepsToday,
    sleepToday,
    rangeDays,
    stepsRange,
    sleepRange,
    loadRange,
  };
};

export default useHealthData;
