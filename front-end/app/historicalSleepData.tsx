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
import { supabase } from "@/config/supabaseConfig";
import { Goal } from "lucide-react-native";
import Svg, { Circle } from "react-native-svg";
import { getSleepGoal } from "@/src/services/sleepGoalService";

type Mode = "W" | "M";

const weekdayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

const minutesToParts = (mins: number) => {
  const m = Math.max(0, Math.round(mins));
  const hr = Math.floor(m / 60);
  const rem = m % 60;

  return {
    hoursText: String(hr),
    hourUnit: "hr",
    minutesText: String(rem),
    minuteUnit: "min",
  };
};

const weekdayShort = (dateStr: string) => {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { weekday: "short" });
};

const parseLocalYYYYMMDD = (s: string) => {
  const [yy, mm, dd] = s.split("-").map(Number);
  return new Date(yy, mm - 1, dd);
};

const monthDayNumber = (dateStr: string) => {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return String(d.getDate());
};

const sleepQualityToLabel = (value: number | null) => {
  switch (value) {
    case 5:
      return "Excellent";
    case 4:
      return "Good";
    case 3:
      return "Fair";
    case 2:
      return "Poor";
    case 1:
      return "Very Poor";
    default:
      return "No Sleep Quality Logged";
  }
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
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E5EA"
          strokeWidth={strokeWidth}
          fill="none"
        />

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

export default function SleepDetailsScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sleepRange, setSleepRange] = useState<
    { date: string; hours: number; sleepQuality: number | null; notes: string | null }[]
  >([]);
  const [sleepGoalData, setSleepGoalData] = useState<{
    sleep_goal_hours: number;
    success_rate: number;
  } | null>(null);
  
  const [checkingGoal, setCheckingGoal] = useState(true);

  const [mode, setMode] = useState<Mode>("W");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      async function checkGoal() {
        try {
          setCheckingGoal(true);
  
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();
  
          if (userError) throw userError;
  
          if (!user) {
            setSleepGoalData(null);
            return;
          }
  
          const goal = await getSleepGoal(user.id);
          setSleepGoalData(goal);
        } catch (error) {
          console.log("Failed to check sleep goal:", error);
          setSleepGoalData(null);
        } finally {
          setCheckingGoal(false);
        }
      }
  
      checkGoal();
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      async function load() {
        try {
          setLoading(true);
          setError(null);
  
          const neededDays = mode === "W" ? 7 : 30;
  
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();
  
          if (userError) throw userError;
          if (!user) throw new Error("No authenticated user found.");
  
          const end = addDays(startOfDay(new Date()), -1);
          const start = addDays(end, -(neededDays - 1));
          const startKey = localDayKey(start);
          const endKey = localDayKey(end);
  
          const { data, error } = await supabase
            .from("SleepLog")
            .select("date, hoursSlept, sleepQuality, notes")
            .eq("userID", user.id)
            .gte("date", startKey)
            .lte("date", endKey)
            .order("date", { ascending: true });
  
          if (error) throw error;
  
          const byDate = new Map<
            string,
            { hours: number; sleepQuality: number | null; notes: string | null }
          >();
  
          (data || []).forEach((row: any) => {
            const key = String(row.date).slice(0, 10);
            byDate.set(key, {
              hours: Number(row.hoursSlept) || 0,
              sleepQuality:
                row.sleepQuality == null ? null : Number(row.sleepQuality),
              notes: row.notes ?? null,
            });
          });
  
          const rows: {
            date: string;
            hours: number;
            sleepQuality: number | null;
            notes: string | null;
          }[] = [];
  
          for (let i = 0; i < neededDays; i++) {
            const d = addDays(start, i);
            const key = localDayKey(d);
            const found = byDate.get(key);
  
            rows.push({
              date: key,
              hours: found?.hours ?? 0,
              sleepQuality: found?.sleepQuality ?? null,
              notes: found?.notes ?? null,
            });
          }
  
          setSleepRange(rows);
          setSelectedIndex(neededDays - 1);
        } catch (e: any) {
          setError(e?.message || "Failed to load sleep logs.");
          setSleepRange([]);
        } finally {
          setLoading(false);
        }
      }
  
      load();
    }, [mode])
  );

  const sleepWeekSeries = useMemo(() => {
    const end = addDays(startOfDay(new Date()), -1);
    const start = addDays(end, -6);

    const map = new Map<string, number>();
    (sleepRange || []).forEach((p) => {
      const key = toLocalDayKeyFromAny(p.date);
      if (key) map.set(key, clampNonNeg(p.hours) * 60);
    });

    const values: number[] = [];
    const dates: Date[] = [];

    for (let i = 0; i < 7; i++) {
      const d = addDays(start, i);
      dates.push(d);
      values.push(map.get(localDayKey(d)) ?? 0);
    }

    return { values, dates };
  }, [sleepRange]);

  const sleepMonthSeries = useMemo(() => {
    const end = addDays(startOfDay(new Date()), -1);
    const start = addDays(end, -29);

    const map = new Map<string, number>();
    (sleepRange || []).forEach((p) => {
      const key = toLocalDayKeyFromAny(p.date);
      if (key) map.set(key, clampNonNeg(p.hours) * 60);
    });

    const values: number[] = [];
    const dates: Date[] = [];

    for (let i = 0; i < 30; i++) {
      const d = addDays(start, i);
      dates.push(d);
      values.push(map.get(localDayKey(d)) ?? 0);
    }

    return { values, dates };
  }, [sleepRange]);

  const displayedRange = useMemo(() => {
    if (mode === "W") {
      return sleepWeekSeries.dates.map((d, i) => ({
        date: localDayKey(d),
        value: sleepWeekSeries.values[i] ?? 0,
      }));
    }

    return sleepMonthSeries.dates.map((d, i) => ({
      date: localDayKey(d),
      value: sleepMonthSeries.values[i] ?? 0,
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

  const displaySummaryParts = useMemo(() => {
    return minutesToParts(displaySummary.value);
  }, [displaySummary.value]);

  const selectedSleepEntry = useMemo(() => {
    if (selectedIndex === null || sleepRange.length === 0) return null;
    const safeIndex = Math.max(0, Math.min(selectedIndex, sleepRange.length - 1));
    return sleepRange[safeIndex] ?? null;
  }, [selectedIndex, sleepRange]);
  
  const selectedSleepQualityLabel = useMemo(() => {
    return sleepQualityToLabel(selectedSleepEntry?.sleepQuality ?? null);
  }, [selectedSleepEntry]);
  
  const selectedSleepNote = useMemo(() => {
    const note = selectedSleepEntry?.notes ?? "";
    return note.trim();
  }, [selectedSleepEntry]);

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

  const sleepCardLabel = (minutes: number) => {
    const total = Math.max(0, Math.round(minutes || 0));
    if (total === 0) return "—";
    const hours = total / 60;
    return `${hours.toFixed(1)}h`;
  };

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

  const sleepGoalMinutes = (sleepGoalData?.sleep_goal_hours ?? 0) * 60;
  const successRate = sleepGoalData?.success_rate ?? 70;

  const goalPercent =
    sleepGoalMinutes > 0
      ? Math.round((displaySummary.value / sleepGoalMinutes) * 100)
      : 0;

  const goalMet = goalPercent >= successRate;
  const getDaySleepGoalPercent = (minutes: number) => {
    if (!sleepGoalData?.sleep_goal_hours) return 0;
  
    const goalMinutes = sleepGoalData.sleep_goal_hours * 60;
    return Math.round((minutes / goalMinutes) * 100);
  };
  
  const isDaySleepGoalMet = (minutes: number) => {
    return getDaySleepGoalPercent(minutes) >= successRate;
  };

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
              <Text style={styles.totalNumber}>{displaySummaryParts.hoursText}</Text>
              <Text style={styles.totalUnit}> {displaySummaryParts.hourUnit}</Text>
              <Text style={styles.totalNumber}> {displaySummaryParts.minutesText}</Text>
              <Text style={styles.totalUnit}> {displaySummaryParts.minuteUnit}</Text>
            </View>

            <Text style={styles.totalDate}>{displaySummary.dateText}</Text>
          </View>

          {!!loading && <Text style={{ paddingHorizontal: 14 }}>Loading...</Text>}
          {!!error && (
            <Text style={{ paddingHorizontal: 14, color: "red" }}>{error}</Text>
          )}

          {mode === "W" && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Sleep</Text>

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

                      {sleepGoalData ? (
                        <View style={styles.smallRingWrap}>
                          <GoalProgressRing
                            percent={getDaySleepGoalPercent(item.value)}
                            met={isDaySleepGoalMet(item.value)}
                            size={34}
                            strokeWidth={4}
                            showText={false}
                          />
                        </View>
                      ) : (
                        <Text style={styles.daySleepText}>
                          {sleepCardLabel(item.value)}
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
              <Text style={styles.cardTitle}>Sleep</Text>
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

                      {sleepGoalData ? (
                        <View style={styles.smallRingWrap}>
                          <GoalProgressRing
                            percent={getDaySleepGoalPercent(cell.item.value)}
                            met={isDaySleepGoalMet(cell.item.value)}
                            size={30}
                            strokeWidth={4}
                            showText={false}
                          />
                        </View>
                      ) : (
                        <Text style={styles.calendarSleepText}>
                          {sleepCardLabel(cell.item.value)}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.chartCard}>
            <Text style={styles.cardTitle}>Time In Bed</Text>

            {displayedRange.length === 0 && !loading ? (
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

          <View style={styles.sleepQualityCard}>
            <Text style={styles.sleepQualityTitle}>🛏️ Sleep Quality</Text>
            <Text style={styles.sleepQualityValue}>{selectedSleepQualityLabel}</Text>
          </View>

          {!checkingGoal && !sleepGoalData && (
            <Pressable
              style={styles.goalCard}
              onPress={() => router.push("/screens/sleepGoals" as any)}
            >
              <View style={styles.goalLeft}>
                <Goal size={36} color="#187498" strokeWidth={2.5} />

                <View>
                  <Text style={styles.goalTitle}>Goals Not Set</Text>
                  <Text style={styles.goalSubtitle}>
                    Get started by setting a sleep goal
                  </Text>
                </View>
              </View>

              <View style={styles.goalRight}>
                <Text style={styles.goalSetText}>Set Goal</Text>
                <Text style={styles.goalChevron}>›</Text>
              </View>
            </Pressable>
          )}

            {!checkingGoal && sleepGoalData && (
              <View style={styles.goalResultCard}>
                <View style={styles.goalResultContent}>
                  <GoalProgressRing percent={goalPercent} met={goalMet} />

                  <View style={styles.goalResultTextBlock}>
                    <Text style={styles.goalResultTitle}>Daily Goal</Text>
                    <Text style={styles.goalResultSubtitle}>
                      {minutesToHrMin(displaySummary.value)} /{" "}
                      {sleepGoalData.sleep_goal_hours} hr
                    </Text>
                    <Text style={styles.goalResultSmallText}>
                      Goal: {sleepGoalData.sleep_goal_hours} hr
                    </Text>
                  </View>
                </View>

                <Pressable
                  style={styles.editGoalButton}
                  onPress={() => router.push("/screens/sleepGoals" as any)}
                >
                  <Text style={styles.editGoalText}>Edit Goal</Text>
                  <Text style={styles.editGoalChevron}>›</Text>
                </Pressable>
              </View>
            )}

          {selectedSleepNote ? (
            <View style={styles.sleepNotesCard}>
              <Text style={styles.sleepNotesTitle}>Notes</Text>
              <Text style={styles.sleepNotesText}>{selectedSleepNote}</Text>
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
    marginLeft: 2,
  },
  totalDate: {
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "600",
    marginTop: 2,
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
  daySleepText: {
    fontSize: 11,
    marginTop: 4,
    color: "#187498",
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
  calendarSleepText: {
    fontSize: 10,
    color: "#187498",
    fontWeight: "700",
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
  sleepQualityCard: {
    marginTop: 14,
    marginHorizontal: 14,
    backgroundColor: "white",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  
  sleepQualityTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#187498",
    marginBottom: 14,
  },
  
  sleepQualityValue: {
    fontSize: 20,
    fontWeight: "500",
    color: "#000",
    lineHeight: 34,
  },
  
  sleepNotesCard: {
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
  
  sleepNotesTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#187498",
    marginBottom: 10,
  },

  sleepNotesText: {
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
    color: "#187498",
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
    color: "#187498",
  },
  
  goalChevron: {
    fontSize: 25,
    color: "#187498",
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
    color: "#555",
  },
  
  goalResultSubtitle: {
    fontSize: 13,
    color: "#555",
    fontWeight: "600",
    marginTop: 8,
  },
  
  goalResultSmallText: {
    fontSize: 11,
    color: "#8E8E93",
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
    color: "#555",
  },
  
  editGoalChevron: {
    fontSize: 30,
    fontWeight: "700",
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
    color: "#555",
  },
  smallRingWrap: {
    marginTop: 5,
    alignItems: "center",
    justifyContent: "center",
  },
});