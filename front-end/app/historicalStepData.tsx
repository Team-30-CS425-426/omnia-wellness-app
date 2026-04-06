import useStepsDisplayed from "@/src/hooks/useHealthKit/stepsDisplayed";
import { router } from "expo-router";
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

export default function StepDetailsScreen() {
  const title = "Steps";
  const activeColor = "#F9D923";
  const inactiveColor = "rgba(249,217,35,0.35)";

  const insets = useSafeAreaInsets();
  const health = useStepsDisplayed();

  const [mode, setMode] = useState<Mode>("D");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  useEffect(() => {
    if (!health.isAuthorized && !health.loading) {
      health.connectAndImport();
    }
  }, [health.isAuthorized, health.loading]);

  useEffect(() => {
    if (!health.isAuthorized) return;
    if (mode === "W") health.loadRange(7);
    if (mode === "M") health.loadRange(30);
  }, [mode, health.isAuthorized]);

  useEffect(() => {
    if (mode === "D") setSelectedIndex(0);
    if (mode === "W") setSelectedIndex(6);
    if (mode === "M") setSelectedIndex(29);
  }, [mode]);

  const dayBaseDate = useMemo(() => {
    return startOfDay(new Date());
  }, []);

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

  const chartValues = useMemo(() => {
    if (mode === "D") return dayBins;
    if (mode === "W") return weekSeries.values;
    return monthSeries.values;
  }, [mode, dayBins, weekSeries.values, monthSeries.values]);

  const safeSelectedIndex = useMemo(() => {
    if (chartValues.length === 0) return 0;
    return Math.max(0, Math.min(selectedIndex, chartValues.length - 1));
  }, [selectedIndex, chartValues.length]);

  const selectedValue = useMemo(() => {
    if (chartValues.length === 0) return 0;
    return clampNonNeg(chartValues[safeSelectedIndex]);
  }, [chartValues, safeSelectedIndex]);

  const displayValue = useMemo(() => {
    return selectedValue;
  }, [selectedValue]);

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
      const d = weekSeries.dates[safeSelectedIndex] ?? new Date();
      return d.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    const d = monthSeries.dates[safeSelectedIndex] ?? new Date();
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [mode, safeSelectedIndex, dayBaseDate, weekSeries.dates, monthSeries.dates]);

  const barData = useMemo(() => {
    if (mode === "D") {
      return chartValues.map((y, i) => ({ x: i, y: clampNonNeg(y) }));
    }

    if (mode === "W") {
      return chartValues.map((y, i) => ({
        x: weekSeries.labels[i] ?? String(i),
        y: clampNonNeg(y),
      }));
    }

    return chartValues.map((y, i) => ({ x: i + 1, y: clampNonNeg(y) }));
  }, [chartValues, mode, weekSeries.labels]);

  const dayTickValues = [0, 6, 12, 18];
  const dayTickFormat = (t: number) => {
    if (t === 0) return "12 AM";
    if (t === 6) return "6";
    if (t === 12) return "12 PM";
    if (t === 18) return "6";
    return "";
  };

  const monthTickValues = [1, 8, 15, 22, 29];
  const monthTickFormat = (t: number) => String(t);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ paddingTop: Math.max(8, insets.top * 0.2) }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerLeft}>
            <Text style={styles.backChevron}>‹</Text>
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <Text style={styles.headerTitle}>{title}</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={{ paddingHorizontal: 14, marginTop: 6 }}>
            <SegmentedDWM value={mode} onChange={setMode} />
          </View>

          <View style={styles.totalBlock}>
            <Text style={styles.totalLabel}>TOTAL</Text>

            <View style={styles.totalRow}>
              <>
                <Text style={styles.totalNumber}>{Math.round(displayValue)}</Text>
                <Text style={styles.totalUnit}> steps</Text>
              </>
            </View>

            <Text style={styles.totalDate}>{selectedDateText}</Text>
          </View>

          {health.loading && <Text style={{ paddingHorizontal: 14 }}>Loading...</Text>}
          {!!health.error && (
            <Text style={{ paddingHorizontal: 14, color: "red" }}>{health.error}</Text>
          )}

          <View style={styles.chartWrap}>
            {barData.length === 0 && !health.loading ? (
              <Text style={{ paddingHorizontal: 6, color: "#8E8E93" }}>No steps data.</Text>
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
                  tickFormat={(t: any) => `${Math.round(Number(t))}`}
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

          <Pressable
            style={styles.showAllCard}
            onPress={() =>
              router.push({
                pathname: "/step-all-data",
                params: { mode },
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