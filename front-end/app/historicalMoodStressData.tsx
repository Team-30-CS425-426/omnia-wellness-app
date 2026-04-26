// code written by Alexis Mae Asuncion

import React, { useCallback, useMemo, useState } from "react";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View, Dimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { BarChart } from "react-native-gifted-charts";

import { supabase } from "@/config/supabaseConfig";
import { useUser } from "@/contexts/UserContext";

import { getUserMoodGoals } from "@/src/services/moodGoalService";

type Mode = "W" | "M";

type MoodStressDay = {
  date: string; // YYYY-MM-DD
  mood: number; // 0 if none, otherwise 1-5
  stressLevel: number; // 0 if none, otherwise 1-10
  notes: string | null;
};

const pad2 = (n: number) => String(n).padStart(2, "0");

const localDayKey = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const parseLocalYYYYMMDD = (s: string) => {
  const [yy, mm, dd] = s.split("-").map(Number);
  return new Date(yy, mm - 1, dd);
};

const moodToEmoji = (mood: number) => {
  switch (mood) {
    case 1:
      return "😞";
    case 2:
      return "🙁";
    case 3:
      return "😐";
    case 4:
      return "😊";
    case 5:
      return "😁";
    default:
      return "";
  }
};

const moodToLabel = (mood: number) => {
  switch (mood) {
    case 1:
      return "Very Low";
    case 2:
      return "Low";
    case 3:
      return "Neutral";
    case 4:
      return "Good";
    case 5:
      return "Excellent";
    default:
      return "No Mood Logged";
  }
};

const weekdayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

type MoodGoalStatus = "met" | "partial" | "notMet" | "none";

function MoodGoalRing({
  emoji,
  status,
  size = 34,
  ringWidth = 4,
  emojiScale = 0.45,
}: {
  emoji: string;
  status: MoodGoalStatus;
  size?: number;
  ringWidth?: number;
  emojiScale?: number;
}) {
  const ringColor =
    status === "met"
      ? "#34C759"
      : status === "partial"
      ? "#FFA726"
      : status === "notMet"
      ? "#FF3B30"
      : "#C7C7CC";

  return (
    <View
      style={[
        styles.moodGoalRing,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: ringColor,
          borderWidth: ringWidth,
        },
      ]}
    >
      <Text style={{ fontSize: size * emojiScale }}>{emoji || "—"}</Text>
    </View>
  );
}

export default function HistoricalMoodStressData() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const [mode, setMode] = useState<Mode>("W");
  const [history, setHistory] = useState<MoodStressDay[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(6);
  const [moodStressGoalData, setMoodStressGoalData] = useState<{
    target_mood: number;
    target_stress_level: number;
    daily_checkins: number;
  } | null>(null);
  
  const [checkingGoal, setCheckingGoal] = useState(true);

  useFocusEffect(
    useCallback(() => {
      async function checkGoal() {
        if (!user?.id) {
          setMoodStressGoalData(null);
          setCheckingGoal(false);
          return;
        }
  
        try {
          setCheckingGoal(true);
  
          const goal = await getUserMoodGoals(user.id);
          setMoodStressGoalData(goal);
        } catch (error) {
          console.log("Failed to check mood/stress goal:", error);
          setMoodStressGoalData(null);
        } finally {
          setCheckingGoal(false);
        }
      }
  
      checkGoal();
    }, [user?.id])
  );

  useFocusEffect(
    useCallback(() => {
      async function loadMoodStressHistory() {
        if (!user?.id) return;

        const days = mode === "W" ? 7 : 30;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const start = addDays(today, -(days - 1));
        const startKey = localDayKey(start);

        const { data, error } = await supabase
          .from("StressLog")
          .select("date, mood, stressLevel, notes")
          .eq("userID", user.id)
          .gte("date", startKey)
          .order("date", { ascending: true });

        if (error) {
          console.error("Error fetching mood/stress history:", error);
          setHistory([]);
          return;
        }

        const dayMap = new Map<
          string,
          { mood: number; stressLevel: number; notes: string | null }
        >();

        (data ?? []).forEach((row: any) => {
          const key = String(row.date).slice(0, 10);
          dayMap.set(key, {
            mood: Number(row.mood) || 0,
            stressLevel: Number(row.stressLevel) || 0,
            notes: row.notes ?? null,
          });
        });

        const out: MoodStressDay[] = [];
        for (let i = 0; i < days; i++) {
          const d = addDays(start, i);
          const key = localDayKey(d);
          const dayData = dayMap.get(key);

          out.push({
            date: key,
            mood: dayData?.mood ?? 0,
            stressLevel: dayData?.stressLevel ?? 0,
            notes: dayData?.notes ?? null,
          });
        }

        setHistory(out);
        setSelectedIndex(days - 1);
      }

      loadMoodStressHistory();
    }, [user?.id, mode])
  );

  const safeSelectedIndex = useMemo(() => {
    if (history.length === 0) return 0;
    return Math.max(0, Math.min(selectedIndex, history.length - 1));
  }, [selectedIndex, history.length]);

  const selected = useMemo(() => {
    if (history.length === 0) {
      return {
        date: localDayKey(new Date()),
        mood: 0,
        stressLevel: 0,
        notes: null,
      };
    }
    return history[safeSelectedIndex];
  }, [history, safeSelectedIndex]);

  const moodGoal = moodStressGoalData?.target_mood ?? 5;
  const stressGoal = moodStressGoalData?.target_stress_level ?? 5;
  const dailyCheckinsGoal = moodStressGoalData?.daily_checkins ?? 1;

  const getMoodRangeStatus = (
    loggedMood: number,
    goalMood: number
  ): MoodGoalStatus => {
    if (!loggedMood) return "none";
  
    if (loggedMood === goalMood) return "met";
  
    if (goalMood <= 2) {
      return [1, 3].includes(loggedMood) ? "partial" : "notMet";
    }
  
    if (goalMood === 3) {
      return [2, 4].includes(loggedMood) ? "partial" : "notMet";
    }
  
    return [3, 4, 5].includes(loggedMood) ? "partial" : "notMet";
  };
  
  const getStressRangeStatus = (
    loggedStress: number,
    goalStress: number
  ): MoodGoalStatus => {
    if (!loggedStress) return "none";
  
    if (loggedStress === goalStress) return "met";
  
    if (goalStress <= 4) {
      return loggedStress >= 1 && loggedStress <= 5 ? "partial" : "notMet";
    }
  
    if (goalStress === 5) {
      return loggedStress === 4 || loggedStress === 6 ? "partial" : "notMet";
    }
  
    return loggedStress >= 5 && loggedStress <= 10 ? "partial" : "notMet";
  };
  
  const getMoodStressGoalStatus = (
    mood: number,
    stressLevel: number
  ): MoodGoalStatus => {
    if (!mood && !stressLevel) return "none";
  
    const moodStatus = getMoodRangeStatus(mood, moodGoal);
    const stressStatus = getStressRangeStatus(stressLevel, stressGoal);
  
    const score =
      (moodStatus === "met" ? 1 : moodStatus === "partial" ? 0.5 : 0) +
      (stressStatus === "met" ? 1 : stressStatus === "partial" ? 0.5 : 0);
  
    if (score === 2) return "met";
    if (score > 0) return "partial";
    return "notMet";
  };

  const selectedGoalStatus = getMoodStressGoalStatus(
    selected.mood,
    selected.stressLevel
  );

  const selectedDateText = useMemo(() => {
    const d = parseLocalYYYYMMDD(selected.date);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [selected.date]);

  const selectedEmoji = useMemo(() => moodToEmoji(selected.mood), [selected.mood]);
  const selectedMoodLabel = useMemo(() => moodToLabel(selected.mood), [selected.mood]);
  const selectedMoodStressNote = useMemo(() => {
    const note = selected?.notes ?? "";
    return note.trim();
  }, [selected]);

  const weekHistory = useMemo(() => history.slice(-7), [history]);

  const screenWidth = Dimensions.get("window").width;
  const cardMarginH = 14;
  const cardPadding = 16;
  const yAxisLabelWidth = 34;
  const cardInnerWidth = screenWidth - cardMarginH * 2 - cardPadding * 2;
  const availableWidth = cardInnerWidth - yAxisLabelWidth;

  // Week stress chart
  const weekBarSpacing = 12;
  const weekBarWidth = Math.max(
    12,
    Math.floor((availableWidth - weekBarSpacing * (weekHistory.length + 1)) / (weekHistory.length || 1))
  );

  const stressBarData = useMemo(() => {
    return weekHistory.map((item, index) => {
      const originalIndex = history.length - 7 + index;
      const isSelected = originalIndex === safeSelectedIndex;

      return {
        value: Number(item.stressLevel) || 0,
        label: item.date.slice(5),
        frontColor: isSelected ? "#EB5353" : "rgba(235,83,83,0.35)",
        onPress: () => setSelectedIndex(originalIndex),
        topLabelComponent: () =>
          item.stressLevel > 0 ? <Text style={styles.topLabel}>{item.stressLevel}</Text> : null,
      };
    });
  }, [weekHistory, history.length, safeSelectedIndex]);

  // Month calendar
  const calendarMonthTitle = useMemo(() => {
    if (history.length === 0) return "Past 30 Days";
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
  }, [history]);

  const monthCalendarCells = useMemo(() => {
    if (mode !== "M" || history.length === 0) return [];

    const firstDate = parseLocalYYYYMMDD(history[0].date);
    const leadingBlanks = firstDate.getDay();

    const cells: Array<
      | { type: "blank" }
      | { type: "day"; item: MoodStressDay; originalIndex: number }
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

  // Month stress chart
  const monthBarSpacing = 6;
  const monthBarWidth = Math.max(
    6,
    Math.floor((availableWidth - monthBarSpacing * (history.length + 1)) / (history.length || 1))
  );

  const monthMarkerIdx = useMemo(() => [0, 7, 14, 21, 29], []);
  const monthMarkerLabels = useMemo(() => {
    return monthMarkerIdx.map((i) => (history[i]?.date ? history[i].date.slice(5) : ""));
  }, [history, monthMarkerIdx]);

  const monthStressBarData = useMemo(() => {
    return history.map((item, index) => {
      const isSelected = index === safeSelectedIndex;

      return {
        value: Number(item.stressLevel) || 0,
        label: `\u200B${index}`, // unique invisible label
        frontColor: isSelected ? "#EB5353" : "rgba(235,83,83,0.35)",
        onPress: () => setSelectedIndex(index),
      };
    });
  }, [history, safeSelectedIndex]);

  const monthXAxisLabelTextStyle = {
    color: "transparent",
    fontSize: 0,
  } as const;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ paddingTop: Math.max(8, insets.top * 0.2) }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerLeft}>
            <Text style={styles.backChevron}>‹</Text>
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <Text style={styles.headerTitle}>Mood & Stress</Text>
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
            <Text style={styles.totalLabel}>MOOD</Text>

            <View style={styles.totalRow}>
              <Text style={styles.emojiLarge}>{selectedEmoji || "—"}</Text>
              <Text style={styles.totalUnit}> {selectedMoodLabel}</Text>
            </View>

            <Text style={styles.stressSummaryLabel}>STRESS LEVEL</Text>
            <Text style={styles.stressSummaryValue}>
              {selected.stressLevel > 0 ? selected.stressLevel : "No Stress Logged"}
            </Text>

            <Text style={styles.totalDate}>{selectedDateText}</Text>
          </View>

          {mode === "W" && (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Mood</Text>

                <View style={styles.weekRow}>
                  {weekHistory.map((item, index) => {
                    const d = parseLocalYYYYMMDD(item.date);
                    const weekday = d.toLocaleDateString(undefined, { weekday: "short" });

                    const originalIndex = history.length - 7 + index;
                    const isSelected = originalIndex === safeSelectedIndex;

                    return (
                      <Pressable
                        key={item.date}
                        onPress={() => setSelectedIndex(originalIndex)}
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

                        <MoodGoalRing
                          emoji={moodToEmoji(item.mood)}
                          status={getMoodStressGoalStatus(item.mood, item.stressLevel)}
                          size={34}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Stress Levels</Text>

                <View style={{ alignItems: "center", paddingTop: 10 }}>
                  <BarChart
                    key={`stress-${weekHistory.map((d) => `${d.date}:${d.stressLevel}`).join("|")}`}
                    data={stressBarData}
                    width={availableWidth}
                    height={220}
                    barWidth={weekBarWidth}
                    spacing={weekBarSpacing}
                    barBorderRadius={10}
                    noOfSections={5}
                    maxValue={10}
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
                    xAxisLabelTextStyle={{
                      color: "#8E8E93",
                      fontSize: 11,
                      fontWeight: "700",
                    }}
                    hideRules={false}
                    isAnimated
                    animationDuration={250}
                    topLabelContainerStyle={{ marginBottom: 6 }}
                    hideOrigin
                    xAxisLabelsHeight={18}
                    labelsDistanceFromXaxis={8}
                  />
                </View>
              </View>
            </>
          )}

          {mode === "M" && (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Mood</Text>
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

                        <MoodGoalRing
                          emoji={moodToEmoji(cell.item.mood)}
                          status={getMoodStressGoalStatus(cell.item.mood, cell.item.stressLevel)}
                          size={30}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Stress Levels</Text>

                <View style={{ alignItems: "center", paddingTop: 10 }}>
                  <BarChart
                    key={`month-stress-${history.map((d) => `${d.date}:${d.stressLevel}`).join("|")}`}
                    data={monthStressBarData}
                    width={availableWidth}
                    height={220}
                    barWidth={monthBarWidth}
                    spacing={monthBarSpacing}
                    barBorderRadius={8}
                    noOfSections={5}
                    maxValue={10}
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
                    xAxisLabelTextStyle={monthXAxisLabelTextStyle}
                    hideRules={false}
                    isAnimated
                    animationDuration={250}
                    hideOrigin
                    xAxisLabelsHeight={18}
                    labelsDistanceFromXaxis={8}
                  />

                  <View style={[styles.monthLabelRow, { width: availableWidth }]}>
                    {monthMarkerLabels.map((t, idx) => (
                      <Text key={`${t}-${idx}`} style={styles.monthLabelText}>
                        {t || " "}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
            </>
          )}

          <Pressable
            style={styles.showAllCard}
            onPress={() =>
              router.push({
                pathname: "/moodStress-all-data",
                params: { mode },
              } as any)
            }
          >
            <Text style={styles.showAllText}>Show All Data</Text>
            <Text style={styles.showAllChevron}>›</Text>
          </Pressable>

          <View style={styles.goalResultCard}>
            <View style={styles.goalResultContent}>
            <MoodGoalRing
              emoji={selectedEmoji}
              status={selectedGoalStatus}
              size={88}
              ringWidth={6}
              emojiScale={0.65}
            />

              <View style={styles.goalResultTextBlock}>
                <Text style={styles.goalResultTitle}>Daily Goal</Text>
                <Text style={styles.goalResultSubtitle}>
                  Mood: {selectedMoodLabel} {selectedEmoji || ""}
                  {"\n"}
                  Stress: {selected.stressLevel > 0 ? `${selected.stressLevel}/10` : "No log"}
                </Text>

                <Text style={styles.goalResultSmallText}>
                  Goal:
                  {"\n"}Mood: {moodToLabel(moodGoal)} {moodToEmoji(moodGoal)}
                  {"\n"}Stress: {stressGoal}/10
                </Text>

                <Text style={styles.goalResultSmallText}>
                  Status:{" "}
                  {selectedGoalStatus === "met"
                    ? "Met"
                    : selectedGoalStatus === "partial"
                    ? "Partially met"
                    : selectedGoalStatus === "notMet"
                    ? "Not met"
                    : "No log"}
                </Text>
                              </View>
            </View>

            <Pressable
              style={styles.editGoalButton}
              onPress={() =>
                router.push({
                  pathname: "/screens/moodStressGoal",
                  params: { mode: "edit" },
                } as any)
              }
            >
              <Text style={styles.editGoalText}>Edit Goal</Text>
              <Text style={styles.editGoalChevron}>›</Text>
            </Pressable>
          </View>

          {selectedMoodStressNote ? (
            <View style={styles.moodStressNotesCard}>
              <Text style={styles.moodStressNotesTitle}>Notes</Text>
              <Text style={styles.moodStressNotesText}>{selectedMoodStressNote}</Text>
            </View>
            ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },

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
  backChevron: {
    fontSize: 28,
    lineHeight: 28,
    fontWeight: "400",
    color: "#000",
  },
  backText: {
    fontSize: 17,
    fontWeight: "500",
    color: "#000",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },

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
  segmentItemSelected: {
    backgroundColor: "white",
  },
  segmentText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
  segmentTextSelected: {
    color: "#000",
  },

  totalBlock: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 6,
  },
  totalLabel: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  emojiLarge: {
    fontSize: 48,
  },
  totalUnit: {
    fontSize: 24,
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
  stressSummaryLabel: {
    marginTop: 10,
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  stressSummaryValue: {
    marginTop: 2,
    fontSize: 35,
    color: "#000",
    fontWeight: "700",
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
  cardTitle: {
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "600",
    marginBottom: 12,
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
  dayEmoji: {
    fontSize: 24,
    marginTop: 4,
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
  calendarEmoji: {
    fontSize: 22,
  },

  topLabel: {
    fontSize: 10,
    color: "#187498",
    fontWeight: "700",
    marginBottom: 2,
  },

  monthLabelRow: {
    marginTop: 8,
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

  moodStressNotesCard: {
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
  
  moodStressNotesTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#EB5353",
    marginBottom: 10,
  },
  
  moodStressNotesText: {
    fontSize: 20,
    fontWeight: "500",
    color: "#000",
    lineHeight: 24,
  },
  moodGoalRing: {
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    marginTop: 4,
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
});
