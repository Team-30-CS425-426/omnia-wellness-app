
import useHealthData from "@/src/hooks/useHealthData";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { VictoryAxis, VictoryBar, VictoryChart, VictoryLabel } from "victory-native";

type Mode = "D" | "W" | "M";

const pad2 = (n: number) => String(n).padStart(2, "0");
const localDayKey = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const toLocalDayKeyFromAny = (v: any) => {
  if (!v) return "";
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return localDayKey(d);
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const clampNonNeg = (n: any) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return v < 0 ? 0 : v;
};

const minutesToHrMin = (mins: number) => {
  const m = Math.max(0, Math.round(mins));
  const hr = Math.floor(m / 60);
  const rem = m % 60;
  if (hr <= 0) return `${rem} min`;
  if (rem === 0) return `${hr} hr`;
  return `${hr} hr ${rem} min`;
};

function SegmentedDWM({
  value,
  onChange,
}: {
  value: Mode;
  onChange: (v: Mode) => void;
}) {
  const options: Mode[] = ["D", "W", "M"];
  return (
    <View style={styles.segmentWrap}>
      {options.map((opt) => {
        const selected = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[styles.segmentItem, selected && styles.segmentItemSelected]}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
function SleepTimeline({ span }: { span: { start: Date; end: Date } | null }) {
  // Build the window based on the span's *end* date (morning of the sleep)
  const base = span?.end ? new Date(span.end) : new Date();

  // Window: previous day 10 PM -> base day 10 AM
  const winStart = new Date(base.getFullYear(), base.getMonth(), base.getDate() - 1, 22, 0, 0, 0);
  const winEnd   = new Date(base.getFullYear(), base.getMonth(), base.getDate(),     10, 0, 0, 0);

  const totalMins = (winEnd.getTime() - winStart.getTime()) / (1000 * 60);
  const clamp = (v: number) => Math.max(0, Math.min(totalMins, v));

  const startMins = span ? clamp((span.start.getTime() - winStart.getTime()) / (1000 * 60)) : 0;
  const endMins   = span ? clamp((span.end.getTime()   - winStart.getTime()) / (1000 * 60)) : 0;

  const leftPct = (startMins / totalMins) * 100;
  const widthPct = Math.max(0, ((endMins - startMins) / totalMins) * 100);

  return (
    <View style={{ marginTop: 8 }}>
      <View
        style={{
          height: 160,
          backgroundColor: "white",
          borderRadius: 18,
          borderWidth: 1,
          borderColor: "#E5E5EA",
          padding: 16,
        }}
      >
        <Text style={{ fontSize: 16, color: "#8E8E93", fontWeight: "600", marginBottom: 12 }}>
          In Bed
        </Text>

        <View
          style={{
            height: 56,
            borderRadius: 14,
            backgroundColor: "rgba(0,0,0,0.04)",
            overflow: "hidden",
            justifyContent: "center",
          }}
        >
          {span && widthPct > 0 ? (
            <View
              style={{
                position: "absolute",
                left: `${leftPct}%`,
                width: `${widthPct}%`,
                height: 40,
                borderRadius: 12,
                backgroundColor: "#187498",
                opacity: 0.85,
              }}
            />
          ) : null}
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 14 }}>
          {["10 PM", "1 AM", "4 AM", "7 AM", "10 AM"].map((t) => (
            <Text key={t} style={{ color: "#C7C7CC", fontWeight: "700" }}>
              {t}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}


export default function HealthDetailsScreen() {
  const { type } = useLocalSearchParams<{ type?: string }>();
  const isSteps = (type ?? "steps") === "steps";
  const title = isSteps ? "Steps" : "Sleep";

  const insets = useSafeAreaInsets();
  const health = useHealthData();
  const { sleepDaySpan } = health;
  console.log("[UI] sleepDaySpan:", sleepDaySpan);


  const [mode, setMode] = useState<Mode>("D");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  // Ensure connected
  useEffect(() => {
    if (!health.isAuthorized && !health.loading) {
      health.connectAndImport();
    }
  }, [health.isAuthorized, health.loading]);

  // Load ranges for W/M
  useEffect(() => {
    if (!health.isAuthorized) return;
    if (mode === "W") health.loadRange(7);
    if (mode === "M") health.loadRange(30);
  }, [mode, health.isAuthorized]);

  // Reset selection when mode changes (Apple Health defaults to latest/rightmost)
  useEffect(() => {
    if (mode === "D") setSelectedIndex(0);
    if (mode === "W") setSelectedIndex(6);
    if (mode === "M") setSelectedIndex(29);
  }, [mode]);

  const dayBaseDate = useMemo(() => {
    const today = startOfDay(new Date());
    return isSteps ? today : addDays(today, -1);
  }, [isSteps]);

  // --- STEPS series ---
  const dayBins = useMemo(() => {
    const arr = (health.stepsDayBins || []).map((x: any) => clampNonNeg(x));
    return arr.length === 24 ? arr : new Array(24).fill(0);
  }, [health.stepsDayBins]);

  const weekSeries = useMemo(() => {
    const end = startOfDay(new Date());
    const start = addDays(end, -6);

    const map = new Map<string, number>();
    (health.stepsRange || []).forEach((p: any) => {
      const key = toLocalDayKeyFromAny(p.startDate);
      if (key) map.set(key, clampNonNeg(p.value));
    });

    const values: number[] = [];
    const labels: string[] = [];
    const dates: Date[] = [];

    for (let i = 0; i < 7; i++) {
      const d = addDays(start, i);
      const key = localDayKey(d);
      dates.push(d);
      values.push(map.get(key) ?? 0);
      labels.push(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()]);
    }

    return { values, labels, dates };
  }, [health.stepsRange]);

  const monthSeries = useMemo(() => {
    const end = startOfDay(new Date());
    const start = addDays(end, -29);

    const map = new Map<string, number>();
    (health.stepsRange || []).forEach((p: any) => {
      const key = toLocalDayKeyFromAny(p.startDate);
      if (key) map.set(key, clampNonNeg(p.value));
    });

    const values: number[] = [];
    const dates: Date[] = [];
    for (let i = 0; i < 30; i++) {
      const d = addDays(start, i);
      dates.push(d);
      values.push(map.get(localDayKey(d)) ?? 0);
    }

    return { values, dates };
  }, [health.stepsRange]);

  // --- SLEEP series ---
  // NOTE: this expects your hook to provide health.sleepDayBins (minutes per hour)
  const sleepDayBins = useMemo(() => {
    const arr = (health.sleepDayBins || []).map((x: any) => clampNonNeg(x));
    return arr.length === 24 ? arr : new Array(24).fill(0);
  }, [health.sleepDayBins]);

  const sleepDayTotalMins = useMemo(() => {
    return (sleepDayBins || []).reduce((sum, v) => sum + clampNonNeg(v), 0);
  }, [sleepDayBins]);

  // sleepRange daily totals are HOURS in your hook, so convert to minutes for charting
  const sleepWeekSeries = useMemo(() => {
    const end = startOfDay(new Date());
    const start = addDays(end, -6);

    const map = new Map<string, number>();
    (health.sleepRange || []).forEach((p: any) => {
      const key = toLocalDayKeyFromAny(p.startDate);
      if (key) map.set(key, clampNonNeg(p.value) * 60);
    });

    const values: number[] = [];
    const labels: string[] = [];
    const dates: Date[] = [];

    for (let i = 0; i < 7; i++) {
      const d = addDays(start, i);
      const key = localDayKey(d);
      dates.push(d);
      values.push(map.get(key) ?? 0);
      labels.push(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()]);
    }

    return { values, labels, dates };
  }, [health.sleepRange]);

  const sleepMonthSeries = useMemo(() => {
    const end = startOfDay(new Date());
    const start = addDays(end, -29);

    const map = new Map<string, number>();
    (health.sleepRange || []).forEach((p: any) => {
      const key = toLocalDayKeyFromAny(p.startDate);
      if (key) map.set(key, clampNonNeg(p.value) * 60);
    });

    const values: number[] = [];
    const dates: Date[] = [];
    for (let i = 0; i < 30; i++) {
      const d = addDays(start, i);
      dates.push(d);
      values.push(map.get(localDayKey(d)) ?? 0);
    }

    return { values, dates };
  }, [health.sleepRange]);

  // Which bars are we showing?
  const chartValues = useMemo(() => {
    if (mode === "D") return isSteps ? dayBins : sleepDayBins;
    if (mode === "W") return isSteps ? weekSeries.values : sleepWeekSeries.values;
    return isSteps ? monthSeries.values : sleepMonthSeries.values;
  }, [
    mode,
    isSteps,
    dayBins,
    weekSeries.values,
    monthSeries.values,
    sleepDayBins,
    sleepWeekSeries.values,
    sleepMonthSeries.values,
  ]);

  const safeSelectedIndex = useMemo(() => {
    if (chartValues.length === 0) return 0;
    return Math.max(0, Math.min(selectedIndex, chartValues.length - 1));
  }, [selectedIndex, chartValues.length]);

  const selectedValue = useMemo(() => {
    if (chartValues.length === 0) return 0;
    return clampNonNeg(chartValues[safeSelectedIndex]);
  }, [chartValues, safeSelectedIndex]);

  const displayValue = useMemo(() => {
    if (!isSteps && mode === "D") return sleepDayTotalMins; // total minutes for the whole night
    return selectedValue;
  }, [isSteps, mode, sleepDayTotalMins, selectedValue]);

  const selectedDateText = useMemo(() => {
    if (mode === "D") {
      return dayBaseDate.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    if (mode === "W") {
      const d =
        (isSteps ? weekSeries.dates : sleepWeekSeries.dates)[safeSelectedIndex] ?? new Date();
      return d.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    const d =
      (isSteps ? monthSeries.dates : sleepMonthSeries.dates)[safeSelectedIndex] ?? new Date();
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [
    mode,
    isSteps,
    safeSelectedIndex,
    dayBaseDate,
    weekSeries.dates,
    monthSeries.dates,
    sleepWeekSeries.dates,
    sleepMonthSeries.dates,
  ]);

  const barData = useMemo(() => {
    if (mode === "D") {
      return chartValues.map((y, i) => ({ x: i, y: clampNonNeg(y) }));
    }
    if (mode === "W") {
      const labels = isSteps ? weekSeries.labels : sleepWeekSeries.labels;
      return chartValues.map((y, i) => ({ x: labels[i] ?? String(i), y: clampNonNeg(y) }));
    }
    return chartValues.map((y, i) => ({ x: i + 1, y: clampNonNeg(y) }));
  }, [chartValues, mode, isSteps, weekSeries.labels, sleepWeekSeries.labels]);

  // D axis ticks(12 AM / 6 / 12 PM / 6)
  const dayTickValues = [0, 6, 12, 18];
  const dayTickFormat = (t: number) => {
    if (t === 0) return "12 AM";
    if (t === 6) return "6";
    if (t === 12) return "12 PM";
    if (t === 18) return "6";
    return "";
  };

  // Month tick labels (weekly markers)
  const monthTickValues = [1, 8, 15, 22, 29];
  const monthTickFormat = (t: number) => String(t);

  const activeColor = isSteps ? "#F9D923" : "#187498";
  const inactiveColor = isSteps ? "rgba(249,217,35,0.35)" : "rgba(24,116,152,0.35)";

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ paddingTop: Math.max(8, insets.top * 0.2) }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerLeft}>
            <Text style={styles.backChevron}>‹</Text>
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <Text style={styles.headerTitle}>{title}</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Same UI for BOTH steps and sleep */}
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {/* D/W/M */}
          <View style={{ paddingHorizontal: 14, marginTop: 6 }}>
            <SegmentedDWM value={mode} onChange={setMode} />
          </View>

          {/* TOTAL block */}
          <View style={styles.totalBlock}>
            <Text style={styles.totalLabel}>
              {isSteps ? "TOTAL" : mode === "D" ? "TIME IN BED" : "AVG. TIME IN BED"}
            </Text>

            <View style={styles.totalRow}>
              {isSteps ? (
                <>
                  <Text style={styles.totalNumber}>{Math.round(displayValue)}</Text>
                  <Text style={styles.totalUnit}> steps</Text>
                </>
              ) : (
                <Text style={styles.totalNumber}>{minutesToHrMin(displayValue)}</Text>
              )}
            </View>

            <Text style={styles.totalDate}>{selectedDateText}</Text>
          </View>

          {/* Status */}
          {health.loading && <Text style={{ paddingHorizontal: 14 }}>Loading...</Text>}
          {!!health.error && (
            <Text style={{ paddingHorizontal: 14, color: "red" }}>{health.error}</Text>
          )}

          {/* Chart */}
          <View style={styles.chartWrap}>
            {!isSteps && mode === "D" ? (
              <SleepTimeline span={sleepDaySpan} />
            ) : barData.length === 0 && !health.loading ? (
              <Text style={{ paddingHorizontal: 6, color: "#8E8E93" }}>
                {isSteps ? "No steps data." : "No sleep data."}
              </Text>
            ) : (
              <VictoryChart
                height={340}
                padding={{ top: 10, left: 34, right: 70, bottom: 50 }}
                domainPadding={{ x: mode === "D" ? 14 : 16, y: 10 }}
              >
                <VictoryAxis
                  dependentAxis
                  orientation="right"
                  tickLabelComponent={<VictoryLabel dx={-16} />}
                  tickFormat={(t: any) => {
                    if (isSteps) return `${Math.round(Number(t))}`;
                    const mins = Number(t);
                    if (!Number.isFinite(mins)) return "";
                    return mins === 0 ? "0" : `${Math.round(mins / 60)}h`;
                  }}
                  style={{
                    axis: { stroke: "transparent" },
                    grid: { stroke: "#E5E5EA" },
                    ticks: { stroke: "transparent" },
                    tickLabels: { fill: "#C7C7CC", fontSize: 12, fontWeight: "700" as any },
                  }}
                />

                {mode === "D" && (
                  <VictoryAxis
                    tickValues={dayTickValues}
                    tickFormat={(t: any) => dayTickFormat(Number(t))}
                    style={{
                      axis: { stroke: "#E5E5EA" },
                      tickLabels: {
                        fill: "#C7C7CC",
                        fontSize: 13,
                        fontWeight: "700" as any,
                        padding: 8,
                      },
                      grid: { stroke: "transparent" },
                    }}
                  />
                )}

                {mode === "W" && (
                  <VictoryAxis
                    style={{
                      axis: { stroke: "#E5E5EA" },
                      tickLabels: {
                        fill: "#C7C7CC",
                        fontSize: 13,
                        fontWeight: "700" as any,
                        padding: 10,
                      },
                      grid: { stroke: "transparent" },
                    }}
                  />
                )}

                {mode === "M" && (
                  <VictoryAxis
                    tickValues={monthTickValues}
                    tickFormat={(t: any) => monthTickFormat(Number(t))}
                    style={{
                      axis: { stroke: "#E5E5EA" },
                      tickLabels: {
                        fill: "#C7C7CC",
                        fontSize: 13,
                        fontWeight: "700" as any,
                        padding: 10,
                      },
                      grid: { stroke: "transparent" },
                    }}
                  />
                )}

                <VictoryBar
                  data={barData}
                  barRatio={mode === "D" ? 0.55 : 0.7}
                  style={{
                    data: {
                      fill: ({ index }: any) =>
                        index === safeSelectedIndex ? activeColor : inactiveColor,
                    },
                  }}
                  events={[
                    {
                      target: "data",
                      eventHandlers: {
                        onPressIn: (_evt: any, props: any) => {
                          const idx = props?.index ?? 0;
                          setSelectedIndex(idx);
                          return [];
                        },
                      },
                    },
                  ]}
                  animate={{ duration: 200 }}
                />
              </VictoryChart>
            )}
          </View>
          {/* Show all */}
          <Pressable
            style={styles.showAllCard}
            onPress={() =>
              router.push({
                pathname: "/health-all-data",
                params: { type: isSteps ? "steps" : "sleep", mode },
              } as any)
            }
          >
            <Text style={styles.showAllText}>Show All Data</Text>
            <Text style={styles.showAllChevron}>›</Text>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F2F2F7" },

  header: {
    height: 56,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8 },
  backChevron: { fontSize: 28, lineHeight: 28, fontWeight: "400" },
  backText: { fontSize: 17, fontWeight: "500" },
  headerTitle: { fontSize: 18, fontWeight: "700" },

  segmentWrap: {
    height: 38,
    borderRadius: 20,
    backgroundColor: "#E5E5EA",
    padding: 3,
    flexDirection: "row",
    gap: 6,
  },
  segmentItem: { flex: 1, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  segmentItemSelected: { backgroundColor: "white" },
  segmentText: { fontSize: 15, fontWeight: "600", color: "#111" },
  segmentTextSelected: { color: "#000" },

  totalBlock: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 6 },
  totalLabel: { fontSize: 13, color: "#8E8E93", fontWeight: "700", letterSpacing: 0.5 },
  totalRow: { flexDirection: "row", alignItems: "baseline" },
  totalNumber: { fontSize: 52, fontWeight: "800", color: "#000" },
  totalUnit: { fontSize: 20, color: "#8E8E93", fontWeight: "600", marginLeft: 6 },
  totalDate: { fontSize: 16, color: "#8E8E93", fontWeight: "600", marginTop: 2 },

  chartWrap: { paddingHorizontal: 14, paddingTop: 10 },

  showAllCard: {
    marginTop: 14,
    marginHorizontal: 14,
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  showAllText: {
    fontSize: 20,
    fontWeight: "400",
    color: "#000",
  },
  showAllChevron: {
    fontSize: 26,
    color: "#C7C7CC",
    fontWeight: "400",
  },
});
