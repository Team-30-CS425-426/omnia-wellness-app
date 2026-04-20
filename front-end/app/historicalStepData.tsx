import useStepsDisplayed from "@/src/hooks/useHealthKit/stepsDisplayed";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

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

const parseLocalYYYYMMDD = (s: string) => {
  const [yy, mm, dd] = s.split("-").map(Number);
  return new Date(yy, mm - 1, dd);
};

const weekdayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const stepsCardLabel = (value: number) => {
  const total = Math.max(0, Math.round(Number(value) || 0));
  if (total === 0) return "—";
  if (total >= 1000) return `${(total / 1000).toFixed(1)}k`;
  return `${total}`;
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

export default function StepDetailsScreen() {
  const insets = useSafeAreaInsets();
  const health = useStepsDisplayed(true);

  const [mode, setMode] = useState<Mode>("W");
  const [selectedIndex, setSelectedIndex] = useState<number>(6);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const neededDays = mode === "W" ? 7 : 30;
  
        await health.loadRange(neededDays);
        setSelectedIndex(neededDays - 1);
      }
  
      load();
    }, [mode])
  );

  const weekSeries = useMemo(() => {
    const end = startOfDay(new Date());
    const start = addDays(end, -6);

    const map = new Map<string, number>();
    (health.stepsRange || []).forEach((p: any) => {
      const key = toLocalDayKeyFromAny(p.startDate);
      if (key) map.set(key, clampNonNeg(p.value));
    });

    const values: number[] = [];
    const dates: Date[] = [];

    for (let i = 0; i < 7; i++) {
      const d = addDays(start, i);
      dates.push(d);
      values.push(map.get(localDayKey(d)) ?? 0);
    }

    return { values, dates };
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

  const displayedRange = useMemo(() => {
    if (mode === "W") {
      return weekSeries.dates.map((d, i) => ({
        date: localDayKey(d),
        value: weekSeries.values[i] ?? 0,
      }));
    }

    return monthSeries.dates.map((d, i) => ({
      date: localDayKey(d),
      value: monthSeries.values[i] ?? 0,
    }));
  }, [mode, weekSeries, monthSeries]);

  const displaySummary = useMemo(() => {
    if (displayedRange.length === 0) {
      const today = new Date();
      return {
        label: "TOTAL",
        value: 0,
        dateText: today.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      };
    }
  
    const safeIndex = Math.max(0, Math.min(selectedIndex, displayedRange.length - 1));
    const item = displayedRange[safeIndex];
  
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
  }, [selectedIndex, displayedRange]);

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
  const chartMax = Math.max(100, Math.ceil((maxValue + 500) / 500) * 500);

  const monthMarkerIdx = useMemo(() => [0, 7, 14, 21, 28], []);
  const monthMarkerLabels = useMemo(() => {
    return monthMarkerIdx.map((i) =>
      displayedRange[i]?.date ? monthDayNumber(displayedRange[i].date) : ""
    );
  }, [displayedRange, monthMarkerIdx]);

  const weekLabels = useMemo(() => {
    return displayedRange.map((item) => weekdayShort(item.date));
  }, [displayedRange]);

  const calendarMonthTitle = useMemo(() => {
    if (mode !== "M" || displayedRange.length === 0) return "Past 30 Days";

    const first = parseLocalYYYYMMDD(displayedRange[0].date);
    const last = parseLocalYYYYMMDD(displayedRange[displayedRange.length - 1].date);

    const firstLabel = first.toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    });
    const lastLabel = last.toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    });

    return firstLabel === lastLabel ? firstLabel : `${firstLabel} - ${lastLabel}`;
  }, [mode, displayedRange]);

  const monthCalendarCells = useMemo(() => {
    if (mode !== "M" || displayedRange.length === 0) return [];

    const firstDate = parseLocalYYYYMMDD(displayedRange[0].date);
    const leadingBlanks = firstDate.getDay();

    const cells: Array<
      | { type: "blank" }
      | { type: "day"; item: { date: string; value: number }; originalIndex: number }
    > = [];

    for (let i = 0; i < leadingBlanks; i++) {
      cells.push({ type: "blank" });
    }

    displayedRange.forEach((item, index) => {
      cells.push({
        type: "day",
        item,
        originalIndex: index,
      });
    });

    while (cells.length % 7 !== 0) {
      cells.push({ type: "blank" });
    }

    return cells;
  }, [displayedRange, mode]);

  const barData = useMemo(() => {
    return displayedRange.map((d, i) => {
      const isSelected = selectedIndex === i;

      return {
        value: Number(d.value) || 0,
        label: `\u200B${i}`,
        frontColor: isSelected ? "#F9D923" : "rgba(249,217,35,0.35)",
        onPress: () => setSelectedIndex(i),
        topLabelComponent: () =>
          mode === "W" && isSelected ? (
            <Text style={styles.topLabel}>{Math.round(Number(d.value) || 0)}</Text>
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

          <Text style={styles.headerTitle}>Steps</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingBottom: Math.max(24, insets.bottom + 28),
          }}
        >
          <View style={{ paddingHorizontal: 14, marginTop: 6 }}>
            <SegmentedWM value={mode} onChange={setMode} />
          </View>

          <View style={styles.totalBlock}>
            <Text style={styles.totalLabel}>{displaySummary.label}</Text>

            <View style={styles.totalRow}>
              <Text style={styles.totalNumber}>
                {displaySummary.value % 1 === 0
                  ? Math.round(displaySummary.value)
                  : displaySummary.value.toFixed(1)}
              </Text>
              <Text style={styles.totalUnit}> steps</Text>
            </View>

            <Text style={styles.totalDate}>{displaySummary.dateText}</Text>
          </View>

          {!!health.loading && <Text style={{ paddingHorizontal: 14 }}>Loading...</Text>}
          {!!health.error && (
            <Text style={{ paddingHorizontal: 14, color: "red" }}>{health.error}</Text>
          )}

          {mode === "W" && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Steps</Text>

              <View style={styles.weekRow}>
                {displayedRange.map((item, index) => {
                  const d = parseLocalYYYYMMDD(item.date);
                  const weekday = d.toLocaleDateString(undefined, { weekday: "short" });
                  const isSelected = selectedIndex === index;

                  return (
                    <Pressable
                      key={item.date}
                      onPress={() => setSelectedIndex(index)}
                      style={[styles.dayItem, isSelected && styles.dayItemSelected]}
                    >
                      <Text
                        style={[
                          styles.weekdayText,
                          isSelected && styles.weekdayTextSelected,
                        ]}
                      >
                        {weekday}
                      </Text>

                      <Text
                        style={[
                          styles.dayNumber,
                          isSelected && styles.dayNumberSelected,
                        ]}
                      >
                        {d.getDate()}
                      </Text>

                      <Text style={styles.dayStepsText}>
                        {stepsCardLabel(item.value)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {mode === "M" && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Steps</Text>
              <Text style={styles.monthTitle}>{calendarMonthTitle}</Text>

              <View style={styles.calendarHeaderRow}>
                {weekdayHeaders.map((day) => (
                  <Text key={day} style={styles.calendarHeaderText}>
                    {day}
                  </Text>
                ))}
              </View>

              <View style={styles.calendarGrid}>
                {monthCalendarCells.map((cell, index) => {
                  if (cell.type === "blank") {
                    return <View key={`blank-${index}`} style={styles.calendarCell} />;
                  }

                  const d = parseLocalYYYYMMDD(cell.item.date);
                  const isSelected = cell.originalIndex === selectedIndex;

                  return (
                    <Pressable
                      key={cell.item.date}
                      onPress={() => setSelectedIndex(cell.originalIndex)}
                      style={[
                        styles.calendarCell,
                        styles.calendarDayCell,
                        isSelected && styles.calendarDayCellSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.calendarDateText,
                          isSelected && styles.calendarDateTextSelected,
                        ]}
                      >
                        {d.getDate()}
                      </Text>

                      <Text style={styles.calendarStepsText}>
                        {stepsCardLabel(cell.item.value)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.chartCard}>

            <Text style={styles.cardTitle}>Steps</Text>

            {displayedRange.length === 0 && !health.loading ? (
              <Text style={{ color: "#8E8E93", paddingTop: 10 }}>No steps data.</Text>
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
  totalUnit: {
    fontSize: 20,
    color: "#8E8E93",
    fontWeight: "600",
    marginLeft: 6,
  },
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
  card: {
    marginTop: 10,
    marginHorizontal: 14,
    backgroundColor: "white",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    padding: 16,
  },
  
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  
  dayItem: {
    width: 42,
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: 8,
  },
  
  dayItemSelected: {
    backgroundColor: "#F9D923",
  },
  
  weekdayText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  
  weekdayTextSelected: {
    color: "#000",
    fontWeight: "700",
  },
  
  dayNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    marginTop: 2,
  },
  
  dayNumberSelected: {
    color: "#000",
  },
  
  dayStepsText: {
    fontSize: 11,
    marginTop: 4,
    color: "#C79A00",
    fontWeight: "700",
  },
  
  monthTitle: {
    fontSize: 15,
    color: "#8E8E93",
    fontWeight: "700",
    marginBottom: 12,
  },
  
  calendarHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  
  calendarHeaderText: {
    width: "14.28%",
    textAlign: "center",
    fontSize: 11,
    color: "#8E8E93",
    fontWeight: "700",
  },
  
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  
  calendarCell: {
    width: "14.28%",
    aspectRatio: 0.9,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  
  calendarDayCell: {
    borderRadius: 14,
  },
  
  calendarDayCellSelected: {
    backgroundColor: "#F9D923",
  },
  
  calendarDateText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  
  calendarDateTextSelected: {
    color: "#000",
  },
  
  calendarStepsText: {
    fontSize: 10,
    color: "#C79A00",
    fontWeight: "700",
  },
  cardTitle: {
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "600",
    marginBottom: 6,
  },

  topLabel: {
    fontSize: 10,
    color: "#F9D923",
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