import useActiveEnergyDisplayed from "@/src/hooks/useHealthKit/activeEnergyDisplayed";
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
import { BarChart, LineChart } from "react-native-gifted-charts";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

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
function WeekTodayVsAverageCard({
  message,
  todayCalories,
  averageCalories,
  todayCurve,
  averageCurve,
}: {
  message: string;
  todayCalories: number;
  averageCalories: number;
  todayCurve: { hour: number; calories: number }[];
  averageCurve: { hour: number; calories: number }[];
}) {
  const hasGraphData = todayCurve.length > 0 && averageCurve.length > 0;
  const todayLineData = todayCurve.map((point) => ({
    value: point.calories,
    label:
      point.hour === 0
        ? "12 AM"
        : point.hour === 7
        ? "7 AM"
        : point.hour === 12
        ? "12 PM"
        : point.hour === 19
        ? "7 PM"
        : point.hour === 23
        ? "12 AM"
        : "",
  }));

  const averageLineData = averageCurve.map((point) => ({
    value: point.calories,
  }));

  const maxLineValue = Math.max(
    10,
    ...todayCurve.map((p) => p.calories),
    ...averageCurve.map((p) => p.calories)
  );

  return (
    <View style={styles.highlightCardLarge}>
      <Text style={styles.highlightHeaderOrange}>🔥 Active Energy</Text>

      <Text style={styles.highlightHeadline}>{message}</Text>

      <View style={styles.highlightDivider} />

      <View style={styles.weekTopMetricsRow}>
        <View>
          <Text style={styles.highlightMetricLabelOrange}>● Today</Text>
          <View style={styles.metricValueRow}>
            <Text style={styles.highlightMetricValueOrange}>
              {todayCalories % 1 === 0 ? Math.round(todayCalories) : todayCalories.toFixed(1)}
            </Text>
            <Text style={styles.highlightMetricUnitOrange}> cal</Text>
          </View>
        </View>

        <View>
          <Text style={styles.highlightMetricLabelGray}>● Average</Text>
          <View style={styles.metricValueRow}>
            <Text style={styles.highlightMetricValueGray}>
              {averageCalories % 1 === 0 ? Math.round(averageCalories) : averageCalories.toFixed(1)}
            </Text>
            <Text style={styles.highlightMetricUnitGray}> cal</Text>
          </View>
        </View>
      </View>

      <View style={styles.weekLineChartPlaceholder}>
        {hasGraphData ? (
          <LineChart
            areaChart={false}
            data={averageLineData}
            data2={todayLineData}
            height={180}
            spacing={12}
            initialSpacing={10}
            endSpacing={10}
            maxValue={maxLineValue}
            noOfSections={4}
            curved
            color1="#C7C7CC"
            color2="#FF5A1F"
            thickness1={4}
            thickness2={4}
            hideDataPoints={false}
            dataPointsColor2="#FF5A1F"
            dataPointsColor1="#C7C7CC"
            yAxisColor="#E5E5EA"
            xAxisColor="#E5E5EA"
            rulesColor="#E5E5EA"
            yAxisTextStyle={{
              color: "#8E8E93",
              fontSize: 11,
              fontWeight: "600",
            }}
            xAxisLabelTextStyle={{
              color: "#8E8E93",
              fontSize: 11,
              fontWeight: "600",
            }}
            hideOrigin
          />
        ) : (
          <Text style={styles.placeholderText}>No intraday data yet</Text>
        )}
      </View>
    </View>
  );
}

function WeekAverageCard({
  averageCalories,
  activeEnergyRange,
}: {
  averageCalories: number;
  activeEnergyRange: { date: string; calories: number | string }[];
}) {
  const maxValue = Math.max(
    1,
    ...activeEnergyRange.map((item) => Number(item.calories) || 0)
  );

  return (
    <View style={styles.highlightCardLarge}>
      <Text style={styles.highlightHeaderOrange}>🔥 Active Energy</Text>

      <Text style={styles.highlightHeadline}>
        You burned an average of{" "}
        {averageCalories % 1 === 0 ? Math.round(averageCalories) : averageCalories.toFixed(1)}{" "}
        calories a day over the last 7 days.
      </Text>

      <View style={styles.highlightDivider} />

      <Text style={styles.averageCaloriesLabel}>Average Calories</Text>

      <View style={styles.metricValueRowBottom}>
        <Text style={styles.averageCaloriesValue}>
          {averageCalories % 1 === 0 ? Math.round(averageCalories) : averageCalories.toFixed(1)}
        </Text>
        <Text style={styles.averageCaloriesUnit}> cal</Text>
      </View>

      <View style={styles.weekBarChartArea}>
        <View
          style={[
            styles.averageLine,
            {
              bottom: `${(averageCalories / maxValue) * 68 + 18}%`,
            },
          ]}
        />

        <View style={styles.weekMiniBarsRow}>
          {activeEnergyRange.map((item, idx) => {
            const heightPercent = Math.max(
              12,
              ((Number(item.calories) || 0) / maxValue) * 100
            );

            return (
              <View key={`${item.date}-${idx}`} style={styles.weekMiniBarItem}>
                <View
                  style={[
                    styles.weekMiniBar,
                    { height: `${heightPercent}%` },
                  ]}
                />
                <Text style={styles.weekMiniBarLabel}>
                  {weekdayShort(item.date).charAt(0)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function MonthComparisonCard({
  currentMonthLabel,
  previousMonthLabel,
  currentMonthAverage,
  previousMonthAverage,
}: {
  currentMonthLabel: string;
  previousMonthLabel: string;
  currentMonthAverage: number;
  previousMonthAverage: number;
}) {
  const maxValue = Math.max(currentMonthAverage, previousMonthAverage, 1);

  return (
    <View style={styles.highlightCardLarge}>
      <Text style={styles.highlightHeaderOrange}>🔥 Active Energy</Text>

      <Text style={styles.highlightHeadline}>
        This month, your average calorie burn is{" "}
        {currentMonthAverage >= previousMonthAverage ? "higher" : "lower"} than it was last month.
      </Text>

      <View style={styles.highlightDivider} />

      <View style={styles.monthMetricBlock}>
        <View style={styles.metricValueRow}>
          <Text style={styles.monthMetricValue}>
            {currentMonthAverage % 1 === 0
              ? Math.round(currentMonthAverage)
              : currentMonthAverage.toFixed(1)}
          </Text>
          <Text style={styles.monthMetricUnit}> cal/day</Text>
        </View>

        <View style={styles.monthBarTrack}>
          <View
            style={[
              styles.monthBarFillOrange,
              { width: `${(currentMonthAverage / maxValue) * 100}%` },
            ]}
          />
        </View>

        <Text style={styles.monthBarLabel}>{currentMonthLabel}</Text>
      </View>

      <View style={styles.monthMetricBlock}>
        <View style={styles.metricValueRow}>
          <Text style={styles.monthMetricValue}>
            {previousMonthAverage % 1 === 0
              ? Math.round(previousMonthAverage)
              : previousMonthAverage.toFixed(1)}
          </Text>
          <Text style={styles.monthMetricUnit}> cal/day</Text>
        </View>

        <View style={styles.monthBarTrack}>
          <View
            style={[
              styles.monthBarFillGray,
              { width: `${(previousMonthAverage / maxValue) * 100}%` },
            ]}
          />
        </View>

        <Text style={styles.monthBarLabel}>{previousMonthLabel}</Text>
      </View>
    </View>
  );
}
export default function ActiveEnergyScreen() {
  const insets = useSafeAreaInsets();
  const {
    isAuthorized,
    rangeDays,
    loading,
    error,
    activeEnergyRange,
    loadRange,
    loadIntradayHighlight,
    weekHighlightSummary,
    monthAverageSummary,
    todayVsAverageHourly,
  } = useActiveEnergyDisplayed(true);

  const [mode, setMode] = useState<Mode>("W");
  const [selectedIndex, setSelectedIndex] = useState<number>(6);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const neededDays = mode === "W" ? 7 : 30;
  
        await loadRange(neededDays);
  
        if (mode === "W") {
          await loadIntradayHighlight(7);
        }
  
        setSelectedIndex(neededDays - 1);
      }
  
      load();
    }, [mode])
  );

  const displaySummary = useMemo(() => {
    if (activeEnergyRange.length === 0) {
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
  
    const safeIndex = Math.max(0, Math.min(selectedIndex, activeEnergyRange.length - 1));
    const item = activeEnergyRange[safeIndex];
  
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
  }, [selectedIndex, activeEnergyRange]);

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

  const maxCalories = Math.max(
    0,
    ...activeEnergyRange.map((d) => Number(d.calories) || 0)
  );
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

          {!!loading && <Text style={{ paddingHorizontal: 14 }}>Loading...</Text>}
          {!!error && (
            <Text style={{ paddingHorizontal: 14, color: "red" }}>{error}</Text>
          )}

          <View style={styles.chartCard}>
            <Text style={styles.cardTitle}>Calories</Text>

            {activeEnergyRange.length === 0 && !loading ? (
              <Text style={{ color: "#8E8E93", paddingTop: 10 }}>
                No active energy data.
              </Text>
            ) : (
              <View style={{ alignItems: "center", paddingTop: 10 }}>
                <BarChart
                  key={`${mode}-${activeEnergyRange
                    .map((h) => `${h.date}:${h.calories}`)
                    .join("|")}`}
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

          <View style={styles.highlightsSection}>
            <Text style={styles.highlightsTitle}>Highlights</Text>

            {mode === "W" ? (
              <>
                <WeekTodayVsAverageCard
                  message={weekHighlightSummary?.message || "No highlight available yet."}
                  todayCalories={weekHighlightSummary?.todayCalories || 0}
                  averageCalories={weekHighlightSummary?.averageCalories || 0}
                  todayCurve={todayVsAverageHourly?.todayCurve || []}
                  averageCurve={todayVsAverageHourly?.averageCurve || []}
                />

                <WeekAverageCard
                  averageCalories={weekHighlightSummary?.averageCalories || 0}
                  activeEnergyRange={activeEnergyRange}
                />
              </>
            ) : (
              <MonthComparisonCard
                currentMonthLabel={monthAverageSummary?.currentMonthLabel || "Current Month"}
                previousMonthLabel={monthAverageSummary?.previousMonthLabel || "Previous Month"}
                currentMonthAverage={monthAverageSummary?.currentMonthAverage || 0}
                previousMonthAverage={monthAverageSummary?.previousMonthAverage || 0}
              />
            )}
          </View>
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

  highlightsSection: {
    marginTop: 20,
    paddingHorizontal: 14,
  },
  
  highlightsTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 12,
  },
  highlightCardLarge: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    marginBottom: 14,
  },

  highlightHeaderOrange: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF5A1F",
    marginBottom: 10,
  },

  highlightHeadline: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "700",
    color: "#000",
    marginBottom: 6,
  },

  highlightDivider: {
    height: 1,
    backgroundColor: "#E5E5EA",
    marginVertical: 12,
  },

  weekTopMetricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  highlightMetricLabelOrange: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF5A1F",
    marginBottom: 2,
  },

  highlightMetricLabelGray: {
    fontSize: 16,
    fontWeight: "700",
    color: "#8E8E93",
    marginBottom: 2,
  },

  metricValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },

  metricValueRowBottom: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 10,
  },

  highlightMetricValueOrange: {
    fontSize: 32,
    fontWeight: "300",
    color: "#FF5A1F",
  },

  highlightMetricUnitOrange: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF5A1F",
    marginLeft: 4,
  },

  highlightMetricValueGray: {
    fontSize: 32,
    fontWeight: "300",
    color: "#8E8E93",
  },

  highlightMetricUnitGray: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8E8E93",
    marginLeft: 4,
  },

  weekLineChartPlaceholder: {
    minHeight: 220,
    borderRadius: 16,
    backgroundColor: "#F7F7F8",
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  placeholderText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8E8E93",
  },

  averageCaloriesLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#8E8E93",
    marginBottom: 2,
  },

  averageCaloriesValue: {
    fontSize: 34,
    fontWeight: "300",
    color: "#000",
  },

  averageCaloriesUnit: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8E8E93",
    marginLeft: 4,
  },

  weekBarChartArea: {
    height: 150,
    position: "relative",
    justifyContent: "flex-end",
  },

  averageLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#FF5A1F",
    zIndex: 2,
  },

  weekMiniBarsRow: {
    height: 120,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },

  weekMiniBarItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },

  weekMiniBar: {
    width: 22,
    borderRadius: 7,
    backgroundColor: "#D1D1D6",
    marginBottom: 8,
  },

  weekMiniBarLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8E8E93",
  },

  monthMetricBlock: {
    marginBottom: 16,
  },

  monthMetricValue: {
    fontSize: 34,
    fontWeight: "300",
    color: "#000",
  },

  monthMetricUnit: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8E8E93",
    marginLeft: 4,
  },

  monthBarTrack: {
    height: 22,
    backgroundColor: "#F2F2F7",
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 6,
    marginBottom: 6,
  },

  monthBarFillOrange: {
    height: "100%",
    backgroundColor: "#FF5A1F",
    borderRadius: 8,
  },

  monthBarFillGray: {
    height: "100%",
    backgroundColor: "#D1D1D6",
    borderRadius: 8,
  },

  monthBarLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
 
});