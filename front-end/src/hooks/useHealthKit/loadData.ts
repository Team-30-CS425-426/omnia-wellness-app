import {
    queryCategorySamples,
    queryQuantitySamples,
  } from "@kingstinct/react-native-healthkit";
  
  export type DaysRange = 7 | 30;
  
  export type DayPoint = {
    startDate: string;
    endDate: string;
    value: number;
  };
  
  export type ActiveEnergyPoint = {
    date: string;
    calories: number;
  };
  
  export type RawSample = {
    startDate: Date;
    endDate: Date;
    value: number;
  };
  
  export type SleepSpan = { start: Date; end: Date } | null;
  
  export const localDay = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  
  export const setTimeLocal = (d: Date, hour: number, minute = 0) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, minute, 0, 0);
  
  export const startOfDayLocal = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  
  export const endOfDayLocal = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  
  export const addDaysLocal = (d: Date, n: number) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };
  
  export const toDate = (x: any): Date => {
    if (x instanceof Date) return x;
    const d = new Date(x);
    return isNaN(d.getTime()) ? new Date() : d;
  };
  
  export const getQuantityValue = (s: any): number => {
    const v =
      s?.quantity ??
      s?.value ??
      s?.quantityValue ??
      s?.count ??
      s?.sum ??
      0;
  
    return typeof v === "number" ? v : Number(v) || 0;
  };
  
  export async function loadStepSamples(days: DaysRange): Promise<RawSample[]> {
    const now = new Date();
    const start = addDaysLocal(now, -(days - 1));
  
    const startDate = startOfDayLocal(start);
    const endDate = now;
  
    const stepSamples = await queryQuantitySamples(
      "HKQuantityTypeIdentifierStepCount" as any,
      {
        startDate,
        endDate,
        unit: "count",
        limit: 5000,
        sortOrder: "desc",
      } as any
    );
  
    return (stepSamples || []).map((s: any) => ({
      startDate: toDate(s.startDate),
      endDate: toDate(s.endDate),
      value: getQuantityValue(s),
    }));
  }
  
  export async function loadSleepSamples(days: DaysRange): Promise<RawSample[]> {
    const now = new Date();
    const start = addDaysLocal(now, -(days - 1));
  
    const startDate = startOfDayLocal(start);
    const endDate = now;
  
    const sleepSamples = await queryCategorySamples(
      "HKCategoryTypeIdentifierSleepAnalysis" as any,
      {
        startDate,
        endDate,
        limit: 5000,
        sortOrder: "desc",
      } as any
    );
  
    return (sleepSamples || []).map((s: any) => ({
      startDate: toDate(s.startDate),
      endDate: toDate(s.endDate),
      value: 1,
    }));
  }
  
  export async function loadActiveEnergySamples(days: DaysRange): Promise<RawSample[]> {
    const now = new Date();
    const start = addDaysLocal(now, -(days - 1));
  
    const startDate = startOfDayLocal(start);
    const endDate = now;
  
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
  
    return (samples || []).map((s: any) => ({
      startDate: toDate(s.startDate),
      endDate: toDate(s.endDate),
      value: getQuantityValue(s),
    }));
  }