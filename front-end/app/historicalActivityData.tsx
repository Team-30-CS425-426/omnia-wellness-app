// code written by Alexis Mae Asuncion

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

import { useUser } from "@/contexts/UserContext";
import { getActivityMinutesLastNDays } from "@/src/services/workoutService";

type Mode = "W" | "M";

const pad2 = (n: number) => String(n).padStart(2, "0");
const localDayKey = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

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

export default function HistoricalActivityData() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const [mode, setMode] = useState<Mode>("W");
  const [history, setHistory] = useState<{ date: string; minutes: number }[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(6);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        if (!user?.id) return;
        const days = mode === "W" ? 7 : 30;

        try {
          const data = await getActivityMinutesLastNDays(user.id, days);
          setHistory(data);
          setSelectedIndex(days - 1);
        } catch (e) {
          console.error("Error fetching activity minutes history:", e);
          setHistory([]);
        }
      }
      load();
    }, [user?.id, mode])
  );

  const safeSelectedIndex = useMemo(() => {
    if (history.length === 0) return 0;
    return Math.max(0, Math.min(selectedIndex, history.length - 1));
  }, [selectedIndex, history.length]);

  const selected = useMemo(() => {
    if (history.length === 0) return { date: localDayKey(new Date()), minutes: 0 };
    return history[safeSelectedIndex];
  }, [history, safeSelectedIndex]);

  const selectedDateText = useMemo(() => {
    const d = new Date(`${selected.date}T00:00:00`);
    if (Number.isNaN(d.getTime())) return selected.date;

    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [selected.date]);

  // sizing inside chart card 
  const screenWidth = Dimensions.get("window").width;
  const cardMarginH = 14;
  const cardPadding = 16;
  const yAxisLabelWidth = 40;

  const cardInnerWidth = screenWidth - cardMarginH * 2 - cardPadding * 2;
  const availableWidth = cardInnerWidth - yAxisLabelWidth;

  const numBars = history.length || 1;
  const spacing = mode === "W" ? 12 : 6;

  const barWidth = Math.max(
    6,
    Math.floor((availableWidth - spacing * (numBars + 1)) / numBars)
  );

  const maxMinutes = Math.max(0, ...history.map((d) => Number(d.minutes) || 0));
  const chartMax = Math.max(10, Math.ceil((maxMinutes + 10) / 10) * 10);

  // Month markers (only show 5 labels manually)
  const monthMarkerIdx = useMemo(() => [0, 7, 14, 21, 29], []);
  const monthMarkerLabels = useMemo(() => {
    return monthMarkerIdx.map((i) =>
      history[i]?.date ? history[i].date.slice(5) : ""
    );
  }, [history, monthMarkerIdx]);

  // bar data 
  const barData = useMemo(() => {
    return history.map((d, i) => {
      const isSelected = i === safeSelectedIndex;

      const label =
        mode === "W"
          ? d.date.slice(5) // show all labels for week
          : `\u200B${i}`; // unique-but-invisible label for month

      return {
        value: Number(d.minutes) || 0,
        label,
        frontColor: isSelected ? "#36AE7C" : "rgba(54,174,124,0.35)",
        onPress: () => setSelectedIndex(i),

        // top labels only on Week
        topLabelComponent: () =>
          mode === "W" ? (
            <Text style={styles.topLabel}>{Math.round(Number(d.minutes) || 0)}</Text>
          ) : null,
      };
    });
  }, [history, safeSelectedIndex, mode]);

  // Hide the “fake” month labels 
  const xAxisLabelTextStyle = useMemo(() => {
    if (mode === "M") {
      return { color: "transparent", fontSize: 11, fontWeight: "700" as const };
    }
    return { color: "#8E8E93", fontSize: 11, fontWeight: "700" as const };
  }, [mode]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ paddingTop: Math.max(8, insets.top * 0.2) }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerLeft}>
            <Text style={styles.backChevron}>‹</Text>
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <Text style={styles.headerTitle}>Activity Data</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {/* Week/Month */}
          <View style={{ paddingHorizontal: 14, marginTop: 6 }}>
            <SegmentedWM value={mode} onChange={setMode} />
          </View>

          {/* TOTAL */}
          <View style={styles.totalBlock}>
            <Text style={styles.totalLabel}>TOTAL</Text>

            <View style={styles.totalRow}>
              <Text style={styles.totalNumber}>
                {Math.round(Number(selected.minutes) || 0)}
              </Text>
              <Text style={styles.totalUnit}> min</Text>
            </View>

            <Text style={styles.totalDate}>{selectedDateText}</Text>
          </View>

          {/* Chart card */}
          <View style={styles.chartCard}>
            <Text style={styles.cardTitle}>Minutes</Text>

            {history.length === 0 ? (
              <Text style={{ color: "#8E8E93", paddingTop: 10 }}>
                No activity data.
              </Text>
            ) : (
              <View style={{ alignItems: "center", paddingTop: 10 }}>
                <BarChart
                   key={`${mode}-${history.map(h => `${h.date}:${h.minutes}`).join("|")}`}
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
                  yAxisTextStyle={{ color: "#8E8E93", fontSize: 11, fontWeight: "700" }}
                  xAxisLabelTextStyle={xAxisLabelTextStyle}
                  hideRules={false}
                  isAnimated
                  animationDuration={250}
                  topLabelContainerStyle={{ marginBottom: 6 }}
                  hideOrigin
                  xAxisLabelsHeight={18}
                  labelsDistanceFromXaxis={8}

                />

                {/* Manual month labels (only a few) */}
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

          {/* Show All Data */}
          <Pressable
            style={styles.showAllCard}
            onPress={() =>
              router.push({
                pathname: "/activity-all-data",
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
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#000" },

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
  cardTitle: { fontSize: 16, color: "#8E8E93", fontWeight: "600", marginBottom: 6 },

  topLabel: { fontSize: 10, color: "#187498", fontWeight: "700", marginBottom: 2 },

  monthLabelRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  monthLabelText: { color: "#8E8E93", fontSize: 11, fontWeight: "700" },

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
