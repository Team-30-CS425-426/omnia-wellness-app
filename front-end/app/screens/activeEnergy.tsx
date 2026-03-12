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
import useActiveEnergyData from "@/src/hooks/useActiveEnergyData";

type Mode = "W" | "M";



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

export default function ActiveEnergyScreen() {
  const insets = useSafeAreaInsets();
  const {
    isAuthorized,
    loading,
    error,
    activeEnergyRange,
    connectAndImport,
    loadRange,
  } = useActiveEnergyData();
  const [mode, setMode] = useState<Mode>("W");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        if (!isAuthorized) {
          await connectAndImport();
        }
  
        await loadRange(mode === "W" ? 7 : 30);
        setSelectedIndex(null);
      }
  
      load();
    }, [isAuthorized, mode])
  );

  const averageCalories = useMemo(() => {
    if (activeEnergyRange.length === 0) return 0;
  
    const total = activeEnergyRange.reduce((sum, item) => {
      return sum + (Number(item.calories) || 0);
    }, 0);
  
    return total / activeEnergyRange.length;
    }, [activeEnergyRange])

  const averageRangeText = useMemo(() => {
    if (activeEnergyRange.length === 0) {
      const today = new Date();
      return today.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  
    const first = new Date(`${activeEnergyRange[0].date}T00:00:00`);
    const last = new Date(`${activeEnergyRange[activeEnergyRange.length - 1].date}T00:00:00`);
  
    if (Number.isNaN(first.getTime()) || Number.isNaN(last.getTime())) {
      return "";
    }
  
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
  }, [activeEnergyRange]);

  const displaySummary = useMemo(() => {
    if (selectedIndex === null || activeEnergyRange.length === 0) {
      return {
        label: "AVERAGE",
        value: averageCalories,
        dateText: averageRangeText,
      };
    }
  
    const item = activeEnergyRange[selectedIndex];
  
    if (!item) {
      return {
        label: "AVERAGE",
        value: averageCalories,
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
      value: Number(item.calories) || 0,
      dateText,
    };
  }, [selectedIndex, activeEnergyRange, averageCalories, averageRangeText]);

  const screenWidth = Dimensions.get("window").width;
  const cardMarginH = 14;
  const cardPadding = 16;
  const yAxisLabelWidth = 40;

  const cardInnerWidth = screenWidth - cardMarginH * 2 - cardPadding * 2;
  const availableWidth = cardInnerWidth - yAxisLabelWidth;

  const numBars = activeEnergyRange.length || 1;
  const spacing = mode === "W" ? 12 : 6;

  const barWidth = Math.max(
    6,
    Math.floor((availableWidth - spacing * (numBars + 1)) / numBars)
  );

  const maxCalories = Math.max(0, ...activeEnergyRange.map((d) => Number(d.calories) || 0));
  const chartMax = Math.max(100, Math.ceil((maxCalories + 50) / 50) * 50);

  const monthMarkerIdx = useMemo(() => [0, 7, 14, 21, 28], []);
  const monthMarkerLabels = useMemo(() => {
    return monthMarkerIdx.map((i) =>
        activeEnergyRange[i]?.date ? monthDayNumber(activeEnergyRange[i].date) : ""
    );
  }, [activeEnergyRange, monthMarkerIdx]);

  const weekLabels = useMemo(() => {
    return activeEnergyRange.map((item) => weekdayShort(item.date));
  }, [activeEnergyRange]);

  const barData = useMemo(() => {
    return activeEnergyRange.map((d, i) => {
      const isSelected = selectedIndex === i;

      const label = `\u200B${i}`;

      return {
        value: Number(d.calories) || 0,
        label,
        frontColor: isSelected ? "#FF6A2A" : "rgba(255,106,42,0.35)",
        onPress: () => setSelectedIndex(i),
        topLabelComponent: () =>
            mode === "W" && isSelected ? (
              <Text style={styles.topLabel}>{Math.round(Number(d.calories) || 0)}</Text>
            ) : null,
      };
    });
  }, [activeEnergyRange, selectedIndex, mode]);

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

          <Text style={styles.headerTitle}>Active Energy</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
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
            <Text style={styles.totalUnit}> cal</Text>
            </View>

            <Text style={styles.totalDate}>{displaySummary.dateText}</Text>
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.cardTitle}>Calories</Text>

            {activeEnergyRange.length === 0 ? (
              <Text style={{ color: "#8E8E93", paddingTop: 10 }}>
                No active energy data.
              </Text>
            ) : (
              <View style={{ alignItems: "center", paddingTop: 10 }}>
                <BarChart
                  key={`${mode}-${activeEnergyRange.map((h) => `${h.date}:${h.calories}`).join("|")}`}
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
                pathname: "/activeEnergy-all-data",
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
  cardTitle: {
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "600",
    marginBottom: 6,
  },

  topLabel: {
    fontSize: 10,
    color: "#FF6A2A",
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