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

import { supabase } from "@/config/supabaseConfig";
import { Goal } from "lucide-react-native";
import Svg, { Circle } from "react-native-svg";
import { getActivityGoal } from "@/src/services/activityGoalService";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";

type Mode = "W" | "M";

const pad2 = (n: number) => String(n).padStart(2, "0");
const localDayKey = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const parseLocalYYYYMMDD = (s: string) => {
  const [yy, mm, dd] = s.split("-").map(Number);
  return new Date(yy, mm - 1, dd);
};

const weekdayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const activityCardLabel = (minutes: number) => {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  if (total === 0) return "—";
  return `${total}m`;
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

function GoalProgressRing({
  percent,
  met,
  size = 76,
  strokeWidth = 9,
  fontSize = 18,
  showText = true,
}: {
  percent: number;
  met: boolean;
  size?: number;
  strokeWidth?: number;
  fontSize?: number;
  showText?: boolean;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(percent, 0), 100);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#E5E5EA" strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={met ? "#34C759" : "#FF3B30"}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {showText && (
        <View style={styles.ringTextCenter}>
          <Text style={[styles.ringPercentText, { fontSize }]}>
            {Math.round(percent)}%
          </Text>
        </View>
      )}
    </View>
  );
}

export default function HistoricalActivityData() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const [mode, setMode] = useState<Mode>("W");
  const [history, setHistory] = useState<
    { date: string; minutes: number; notes: string | null }[]
  >([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(6);
  const [activityGoalData, setActivityGoalData] = useState<{
    weekly_minutes: number;
    days_per_week: number;
    success_rate: number;
  } | null>(null);
  
  const [checkingGoal, setCheckingGoal] = useState(true);

  useFocusEffect(
    useCallback(() => {
      async function checkGoal() {
        if (!user?.id) {
          setActivityGoalData(null);
          setCheckingGoal(false);
          return;
        }
  
        try {
          setCheckingGoal(true);
  
          const goal = await getActivityGoal(user.id);
          setActivityGoalData(goal);
        } catch (error) {
          console.log("Failed to check activity goal:", error);
          setActivityGoalData(null);
        } finally {
          setCheckingGoal(false);
        }
      }
  
      checkGoal();
    }, [user?.id])
  );

  useFocusEffect(
    useCallback(() => {
      async function load() {
        if (!user?.id) return;
        const days = mode === "W" ? 7 : 30;
  
        try {
          const end = new Date();
          end.setHours(0, 0, 0, 0);
  
          const start = new Date(end);
          start.setDate(end.getDate() - (days - 1));
  
          const startKey = localDayKey(start);
          const endKey = localDayKey(end);
  
          const { data, error } = await supabase
            .from("ActivityLog")
            .select("date, duration, notes")
            .eq("userID", user.id)
            .gte("date", startKey)
            .lte("date", endKey)
            .order("date", { ascending: true });
  
          if (error) throw error;
  
          const byDate = new Map<string, { minutes: number; notes: string | null }>();
  
          for (let i = 0; i < days; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            byDate.set(localDayKey(d), { minutes: 0, notes: null });
          }
  
          (data || []).forEach((row: any) => {
            const key = String(row.date).slice(0, 10);
            const existing = byDate.get(key) ?? { minutes: 0, notes: null };
  
            byDate.set(key, {
              minutes: existing.minutes + (Number(row.duration) || 0),
              notes: existing.notes || row.notes || null,
            });
          });
  
          const out = Array.from(byDate.entries()).map(([date, value]) => ({
            date,
            minutes: value.minutes,
            notes: value.notes,
          }));
  
          setHistory(out);
          setSelectedIndex(days - 1);
        } catch (e) {
          console.error("Error fetching activity history:", e);
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
    if (history.length === 0) {
      return { date: localDayKey(new Date()), minutes: 0, notes: null };
    }
    return history[safeSelectedIndex];
  }, [history, safeSelectedIndex]);

  const dailyTargetMinutes =
    activityGoalData?.weekly_minutes && activityGoalData?.days_per_week
      ? activityGoalData.weekly_minutes / activityGoalData.days_per_week
      : 0;

  const successRate = activityGoalData?.success_rate ?? 70;

  const goalPercent =
    dailyTargetMinutes > 0
      ? Math.round((selected.minutes / dailyTargetMinutes) * 100)
      : 0;

  const goalMet = goalPercent >= successRate;

  const getDayActivityGoalPercent = (minutes: number) => {
    if (dailyTargetMinutes <= 0) return 0;
    return Math.round((minutes / dailyTargetMinutes) * 100);
  };

  const isDayActivityGoalMet = (minutes: number) => {
    return getDayActivityGoalPercent(minutes) >= successRate;
  };

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

  const selectedActivityNote = useMemo(() => {
    const note = selected?.notes ?? "";
    return note.trim();
  }, [selected]);

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
  
  const calendarMonthTitle = useMemo(() => {
    if (mode !== "M" || history.length === 0) return "Past 30 Days";
  
    const first = parseLocalYYYYMMDD(history[0].date);
    const last = parseLocalYYYYMMDD(history[history.length - 1].date);
  
    const firstLabel = first.toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    });
    const lastLabel = last.toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    });
  
    return firstLabel === lastLabel ? firstLabel : `${firstLabel} - ${lastLabel}`;
  }, [mode, history]);
  
  const monthCalendarCells = useMemo(() => {
    if (mode !== "M" || history.length === 0) return [];
  
    const firstDate = parseLocalYYYYMMDD(history[0].date);
    const leadingBlanks = firstDate.getDay();
  
    const cells: Array<
      | { type: "blank" }
      | { type: "day"; item: { date: string; minutes: number }; originalIndex: number }
    > = [];
  
    for (let i = 0; i < leadingBlanks; i++) {
      cells.push({ type: "blank" });
    }
  
    history.forEach((item, index) => {
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
  }, [history, mode]);

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
        frontColor: isSelected ? Colors.default.ActivityGreen : "rgba(21,154,52,0.35)",
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

        <ScrollView
            contentContainerStyle={{
              paddingBottom: Math.max(24, insets.bottom + 28),
            }}
          >
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

          {mode === "W" && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Activity</Text>

              <View style={styles.weekRow}>
                {history.map((item, index) => {
                  const d = parseLocalYYYYMMDD(item.date);
                  const weekday = d.toLocaleDateString(undefined, { weekday: "short" });
                  const isSelected = index === safeSelectedIndex;

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

                      {activityGoalData ? (
                        <View style={styles.smallRingWrap}>
                          <GoalProgressRing
                            percent={getDayActivityGoalPercent(item.minutes)}
                            met={isDayActivityGoalMet(item.minutes)}
                            size={34}
                            strokeWidth={4}
                            showText={false}
                          />
                        </View>
                      ) : (
                        <Text style={styles.dayActivityText}>
                          {activityCardLabel(item.minutes)}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {mode === "M" && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Activity</Text>
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
                  const isSelected = cell.originalIndex === safeSelectedIndex;

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

                      {activityGoalData ? (
                        <View style={styles.smallRingWrap}>
                          <GoalProgressRing
                            percent={getDayActivityGoalPercent(cell.item.minutes)}
                            met={isDayActivityGoalMet(cell.item.minutes)}
                            size={30}
                            strokeWidth={4}
                            showText={false}
                          />
                        </View>
                      ) : (
                        <Text style={styles.calendarActivityText}>
                          {activityCardLabel(cell.item.minutes)}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

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
                  key={`${mode}-${history.map((h) => `${h.date}:${h.minutes}`).join("|")}`}
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
          </View>

          
          
          {!checkingGoal && !activityGoalData && (
            <Pressable
              style={styles.goalCard}
              onPress={() => router.push("/screens/activityGoal" as any)}
            >
              <View style={styles.goalLeft}>
                <Goal size={36} color= {Colors.default.ActivityGreen} strokeWidth={2.5} />

                <View>
                  <Text style={styles.goalTitle}>Goals Not Set</Text>
                  <Text style={styles.goalSubtitle}>
                    Get started by setting an activity goal
                  </Text>
                </View>
              </View>

              <View style={styles.goalRight}>
                <Text style={styles.goalSetText}>Set Goal</Text>
                <Text style={styles.goalChevron}>›</Text>
              </View>
            </Pressable>
          )}

          {!checkingGoal && activityGoalData && (
            <View style={styles.goalResultCard}>
              <View style={styles.goalResultContent}>
                <GoalProgressRing percent={goalPercent} met={goalMet} />

                <View style={styles.goalResultTextBlock}>
                  <Text style={styles.goalResultTitle}>Daily Goal</Text>
                  <Text style={styles.goalResultSubtitle}>
                    {Math.round(selected.minutes)} / {Math.round(dailyTargetMinutes)} min today
                  </Text>
                  <Text style={styles.goalResultSmallText}>
                    Goal: {activityGoalData.weekly_minutes} min across{" "}
                    {activityGoalData.days_per_week} days
                  </Text>
                </View>
              </View>

              <Pressable
                style={styles.editGoalButton}
                onPress={() =>
                  router.push({
                    pathname: "/screens/activityGoal",
                    params: { mode: "edit" },
                  } as any)
                }
              >
                <Text style={styles.editGoalText}>Edit Goal</Text>
                <Text style={styles.editGoalChevron}>›</Text>
              </Pressable>
            </View>
          )}

          {selectedActivityNote ? (
            <View style={styles.activityNotesCard}>
              <View style={styles.sectionTitleRow}>
                <Ionicons
                  name="document-text"
                  size={24}
                  color={Colors.default.ActivityGreen}
                />
                <Text style={styles.activityNotesTitle}>Notes</Text>
              </View>
              <Text style={styles.activityNotesText}>{selectedActivityNote}</Text>
            </View>
          ) : null}
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
  
  dayActivityText: {
    fontSize: 11,
    marginTop: 4,
    color: Colors.default.ActivityGreen,
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
  
  calendarActivityText: {
    fontSize: 10,
    color: Colors.default.ActivityGreen,
    fontWeight: "700",
  },

  cardTitle: { fontSize: 16, color: "#8E8E93", fontWeight: "600", marginBottom: 6 },

  topLabel: {
    fontSize: 10,
    color: Colors.default.ActivityGreen,
    fontWeight: "700",
    marginBottom: 2,
  },

  monthLabelRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  monthLabelText: { color: "#8E8E93", fontSize: 11, fontWeight: "700" },

  showAllCard: {
    marginTop: 14,
    paddingTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    backgroundColor: "transparent",
  },
  showAllText: { fontSize: 20, fontWeight: "400", color: "#000" },
  showAllChevron: { fontSize: 26, color: "#C7C7CC", fontWeight: "400" },

  activityNotesCard: {
    marginTop: 14,
    marginHorizontal: 14,
    marginBottom: 8,
    backgroundColor: "white",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  
  activityNotesTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.default.ActivityGreen,
  },
  
  activityNotesText: {
    fontSize: 20,
    fontWeight: "500",
    color: "#000",
    lineHeight: 24,
  },
  goalCard: {
    marginTop: 10,
    marginHorizontal: 14,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    paddingVertical: 16,
    paddingLeft: 10,
    paddingRight: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  
  goalLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  
  goalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.default.ActivityGreen,
  },
  
  goalSubtitle: {
    fontSize: 13,
    color: "#000",
    marginTop: 2,
    width: 210,
  },
  
  goalRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
    marginLeft: 12,
  },
  
  goalSetText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.default.ActivityGreen,
  },
  
  goalChevron: {
    fontSize: 25,
    color: Colors.default.ActivityGreen,
  },
  
  goalResultCard: {
    marginTop: 14,
    marginHorizontal: 14,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  
  goalResultContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  
  goalResultTextBlock: {
    marginLeft: 12,
    flexShrink: 1,
  },
  
  goalResultTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },
  
  goalResultSubtitle: {
    fontSize: 13,
    color: "#000",
    fontWeight: "600",
    marginTop: 8,
  },
  
  goalResultSmallText: {
    fontSize: 11,
    color: "#666",
    marginTop: 5,
  },
  
  editGoalButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  
  editGoalText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },
  
  editGoalChevron: {
    fontSize: 30,
    fontWeight: "500",
    color: "#000",
    marginLeft: 8,
  },
  
  ringTextCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  
  ringPercentText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  
  smallRingWrap: {
    marginTop: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
});
