import React, { useCallback, useMemo, useState } from "react";
import { router } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BarChart } from "react-native-gifted-charts";
import { useFocusEffect } from "@react-navigation/native";
import useSleepDisplayed from "@/src/hooks/useHealthKit/sleepDisplayed";

type Mode = "W" | "M";

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

const weekdayShort = (dateStr: string) => {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { weekday: "short" });
};

const monthDayNumber = (dateStr: string) => {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return String(d.getDate());
};

function SegmentedWM({
  value,
  onChange,
}: {
  value: Mode;
  onChange: (v: Mode) => void;
}) {
  const options: { key: Mode; label: string }[] = [
    { key: "W", label: "Week" },
    { key: "M", label: "Month" },
  ];

  return (
    <View style={styles.segmentWrap}>
      {options.map((opt) => {
        const selected = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[styles.segmentItem, selected && styles.segmentItemSelected]}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SleepDetailsScreen() {
  const insets = useSafeAreaInsets();
  const health = useSleepDisplayed();

  const [mode, setMode] = useState<Mode>("W");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const neededDays = mode === "W" ? 7 : 30;

        if (!health.isAuthorized) {
          await health.connectAndImport();
          return;
        }

        if (health.rangeDays !== neededDays || health.sleepRange.length === 0) {
          await health.loadRange(neededDays);
        }

        setSelectedIndex(null);
      }

      load();
    }, [health.isAuthorized, mode, health.rangeDays, health.sleepRange.length])
  );

  const sleepWeekSeries = useMemo(() => {
    const end = startOfDay(new Date());
    const start = addDays(end, -6);

    const map = new Map<string, number>();
    (health.sleepRange || []).forEach((p: any) => {
      const key = toLocalDayKeyFromAny(p.startDate);
      if (key) map.set(key, clampNonNeg(p.value) * 60);
    });

    const values: number[] = [];
    const dates: Date[] = [];

    for (let i = 0; i < 7; i++) {
      const d = addDays(start, i);
      dates.push(d);
      values.push(map.get(localDayKey(d)) ?? 0);
    }

    return { values, dates };
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

  const displayedRange = useMemo(() => {
    if (mode === "W") {
      return sleepWeekSeries.dates.map((d, i) => ({
        date: localDayKey(d),
        value: sleepWeekSeries.values[i] ?? 0, // minutes
      }));
    }

    return sleepMonthSeries.dates.map((d, i) => ({
      date: localDayKey(d),
      value: sleepMonthSeries.values[i] ?? 0, // minutes
    }));
  }, [mode, sleepWeekSeries, sleepMonthSeries]);

  const averageValue = useMemo(() => {
    if (displayedRange.length === 0) return 0;
    const total = displayedRange.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
    return total / displayedRange.length;
  }, [displayedRange]);

  const averageRangeText = useMemo(() => {
    if (displayedRange.length === 0) {
      const today = new Date();
      return today.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    const first = new Date(`${displayedRange[0].date}T00:00:00`);
    const last = new Date(`${displayedRange[displayedRange.length - 1].date}T00:00:00`);

    if (Number.isNaN(first.getTime()) || Number.isNaN(last.getTime())) return "";

    const sameYear = first.getFullYear() === last.getFullYear();
    const sameMonth = first.getMonth() === last.getMonth();

    if (sameYear && sameMonth) {
      return `${first.toLocaleDateString(undefined, {
        month: "short",
      })} ${first.getDate()}–${last.getDate()}, ${last.getFullYear()}`;
    }

    return `${first.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })}–${last.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  }, [displayedRange]);

  const displaySummary = useMemo(() => {
    if (selectedIndex === null || displayedRange.length === 0) {
      return {
        label: "AVERAGE",
        value: averageValue,
        dateText: averageRangeText,
      };
    }

    const item = displayedRange[selectedIndex];
    if (!item) {
      return {
        label: "AVERAGE",
        value: averageValue,
        dateText: averageRangeText,
      };
    }

    const d = new Date(`${item.date}T00:00:00`);
    const dateText = Number.isNaN(d.getTime())
      ? item.date
      : d.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        });

    return {
      label: "TOTAL",
      value: Number(item.value) || 0,
      dateText,
    };
  }, [selectedIndex, displayedRange, averageValue, averageRangeText]);

  const screenWidth = Dimensions.get("window").width;
  const cardMarginH = 14;
  const cardPadding = 16;
  const yAxisLabelWidth = 40;

  const cardInnerWidth = screenWidth - cardMarginH * 2 - cardPadding * 2;
  const availableWidth = cardInnerWidth - yAxisLabelWidth;

  const numBars = displayedRange.length || 1;
  const spacing = mode === "W" ? 12 : 6;

  const barWidth = Math.max(
    6,
    Math.floor((availableWidth - spacing * (numBars + 1)) / numBars)
  );

  const maxValue = Math.max(0, ...displayedRange.map((d) => Number(d.value) || 0));
  const chartMax = Math.max(60, Math.ceil((maxValue + 60) / 60) * 60);

  const monthMarkerIdx = useMemo(() => [0, 7, 14, 21, 28], []);
  const monthMarkerLabels = useMemo(() => {
    return monthMarkerIdx.map((i) =>
      displayedRange[i]?.date ? monthDayNumber(displayedRange[i].date) : ""
    );
  }, [displayedRange, monthMarkerIdx]);

  const weekLabels = useMemo(() => {
    return displayedRange.map((item) => weekdayShort(item.date));
  }, [displayedRange]);

  const barData = useMemo(() => {
    return displayedRange.map((d, i) => {
      const isSelected = selectedIndex === i;

      return {
        value: Number(d.value) || 0,
        label: `\u200B${i}`,
        frontColor: isSelected ? "#187498" : "rgba(24,116,152,0.35)",
        onPress: () => setSelectedIndex(i),
        topLabelComponent: () =>
          mode === "W" && isSelected ? (
            <Text style={styles.topLabel}>{minutesToHrMin(Number(d.value) || 0)}</Text>
          ) : null,
      };
    });
  }, [displayedRange, selectedIndex, mode]);

  const xAxisLabelTextStyle = useMemo(() => {
    return {
      color: "transparent",
      fontSize: 11,
      fontWeight: "700" as const,
    };
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ paddingTop: Math.max(8, insets.top * 0.2) }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerLeft}>
            <Text style={styles.backChevron}>‹</Text>
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <Text style={styles.headerTitle}>Sleep</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={{ paddingHorizontal: 14, marginTop: 6 }}>
            <SegmentedWM value={mode} onChange={setMode} />
          </View>

          <View style={styles.totalBlock}>
            <Text style={styles.totalLabel}>{displaySummary.label}</Text>

            <View style={styles.totalRow}>
              <Text style={styles.totalNumber}>{minutesToHrMin(displaySummary.value)}</Text>
            </View>

            <Text style={styles.totalDate}>{displaySummary.dateText}</Text>
          </View>

          {!!health.loading && <Text style={{ paddingHorizontal: 14 }}>Loading...</Text>}
          {!!health.error && (
            <Text style={{ paddingHorizontal: 14, color: "red" }}>{health.error}</Text>
          )}

          <View style={styles.chartCard}>
            <Text style={styles.cardTitle}>Time In Bed</Text>

            {displayedRange.length === 0 && !health.loading ? (
              <Text style={{ color: "#8E8E93", paddingTop: 10 }}>No sleep data.</Text>
            ) : (
              <View style={{ alignItems: "center", paddingTop: 10 }}>
                <BarChart
                  key={`${mode}-${displayedRange.map((h) => `${h.date}:${h.value}`).join("|")}`}
                  data={barData}
                  width={availableWidth}
                  height={240}
                  barWidth={barWidth}
                  spacing={spacing}
                  barBorderRadius={10}
                  noOfSections={4}
                  maxValue={chartMax}
                  yAxisThickness={1}
                  xAxisThickness={1}
                  yAxisColor="#E5E5EA"
                  xAxisColor="#E5E5EA"
                  rulesColor="#E5E5EA"
                  rulesType="dashed"
                  yAxisTextStyle={{
                    color: "#8E8E93",
                    fontSize: 11,
                    fontWeight: "700",
                  }}
                  xAxisLabelTextStyle={xAxisLabelTextStyle}
                  hideRules={false}
                  isAnimated
                  animationDuration={250}
                  topLabelContainerStyle={{ marginBottom: 6 }}
                  hideOrigin
                  xAxisLabelsHeight={6}
                  labelsDistanceFromXaxis={2}
                />

                {mode === "W" && (
                  <View style={[styles.weekLabelRow, { width: availableWidth }]}>
                    {weekLabels.map((label, idx) => (
                      <Text key={`${label}-${idx}`} style={styles.weekLabelText}>
                        {label}
                      </Text>
                    ))}
                  </View>
                )}

                {mode === "M" && (
                  <View style={[styles.monthLabelRow, { width: availableWidth }]}>
                    {monthMarkerLabels.map((t, idx) => (
                      <Text key={`${t}-${idx}`} style={styles.monthLabelText}>
                        {t || " "}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          <Pressable
            style={styles.showAllCard}
            onPress={() =>
              router.push({
                pathname: "/sleep-all-data",
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  backChevron: { fontSize: 28, lineHeight: 28, fontWeight: "400" },
  backText: { fontSize: 17, fontWeight: "500" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#000" },

  segmentWrap: {
    height: 38,
    borderRadius: 20,
    backgroundColor: "#E5E5EA",
    padding: 3,
    flexDirection: "row",
    gap: 6,
  },
  segmentItem: {
    flex: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentItemSelected: { backgroundColor: "white" },
  segmentText: { fontSize: 15, fontWeight: "600", color: "#111" },
  segmentTextSelected: { color: "#000" },

  totalBlock: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 6 },
  totalLabel: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  totalRow: { flexDirection: "row", alignItems: "baseline" },
  totalNumber: { fontSize: 52, fontWeight: "800", color: "#000" },
  totalDate: {
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "600",
    marginTop: 2,
  },

  chartCard: {
    marginTop: 10,
    marginHorizontal: 14,
    backgroundColor: "white",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    padding: 16,
    overflow: "hidden",
  },
  cardTitle: {
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "600",
    marginBottom: 6,
  },

  topLabel: {
    fontSize: 10,
    color: "#187498",
    fontWeight: "700",
    marginBottom: 2,
  },

  weekLabelRow: {
    marginTop: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  weekLabelText: {
    color: "#C7C7CC",
    fontSize: 11,
    fontWeight: "700",
  },

  monthLabelRow: {
    marginTop: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  monthLabelText: {
    color: "#8E8E93",
    fontSize: 11,
    fontWeight: "700",
  },

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
  showAllText: { fontSize: 20, fontWeight: "400", color: "#000" },
  showAllChevron: { fontSize: 26, color: "#C7C7CC", fontWeight: "400" },
});