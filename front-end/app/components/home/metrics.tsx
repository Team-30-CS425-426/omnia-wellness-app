import { supabase } from "@/config/supabaseConfig";
import { router } from "expo-router";
import { useCallback, useContext, useEffect, useState } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { EntryContext } from "./dashboard";
import DashboardGoalRing from "../DashboardGoalRing";
import { useUser } from "@/contexts/UserContext";
import { getSleepGoal } from "@/src/services/sleepGoalService";
import { getStepsGoal } from "@/src/services/stepsGoalService";
import { getActivityMinutesLastNDays } from "@/src/services/workoutService";

interface MetricsProps {
  style?: StyleProp<ViewStyle>;
  health: any;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
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
      return "—";
  }
};

export function Metrics({ style, health }: MetricsProps) {
  const { entryId } = useContext(EntryContext);
  const { user } = useUser();

  const [sleep, setSleep] = useState("NaN");
  const [activity, setActivity] = useState("0");
  const [nutrition, setNutrition] = useState("NaN");
  const [moodstress, setMoodStress] = useState("—");

  const [sleepGoalHours, setSleepGoalHours] = useState<number | null>(null);
  const [stepsGoal, setStepsGoal] = useState<number | null>(null);

  const stepsToday =
    Number.isFinite(health?.stepsToday) ? Math.round(health.stepsToday) : 0;

  const sleepToday =
    Number.isFinite(health?.sleepToday)
      ? Number(health.sleepToday).toFixed(1)
      : "0.0";

  const clampProgress = (actual: number, goal: number | null) => {
    if (!goal || goal <= 0) return 0;
    return Math.min(actual / goal, 1);
  };

  const formatStepsShort = (num: number) => {
    if (num >= 1000) {
      const value = num / 1000;
      return Number.isInteger(value) ? `${value}k` : `${value.toFixed(1)}k`;
    }
    return `${num}`;
  };

  const getSleepRingText = (actual: number, goal: number | null) => {
    if (!goal) return actual.toFixed(1);
    return actual >= goal ? `${actual.toFixed(1)}h` : `${actual.toFixed(1)}/${goal}h`;
  };

  const getStepsRingText = (actual: number, goal: number | null) => {
    if (!goal) return formatStepsShort(actual);
    return actual >= goal
      ? `${formatStepsShort(actual)}`
      : `${formatStepsShort(actual)}/${formatStepsShort(goal)}`;
  };

  async function fetchMetrics() {
    const response = await supabase
      .from("Metrics")
      .select("*")
      .eq("entry_id", entryId);

    if (response?.data?.[0]) {
      const d = response.data[0];
      setSleep(d["sleep"]);
      setNutrition(d["nutrition"]);
    } else {
      setSleep("");
      setNutrition("0");
    }
  }

  async function fetchGoals() {
    if (!user?.id) return;

    try {
      const sleepGoalData = await getSleepGoal(user.id);
      const stepsGoalData = await getStepsGoal(user.id);

      setSleepGoalHours(
        sleepGoalData?.sleep_goal_hours != null
          ? Number(sleepGoalData.sleep_goal_hours)
          : null
      );

      setStepsGoal(
        stepsGoalData?.steps_goal != null
          ? Number(stepsGoalData.steps_goal)
          : null
      );
    } catch (error) {
      console.log("Failed to fetch goal data:", error);
      setSleepGoalHours(null);
      setStepsGoal(null);
    }
  }

  async function fetchTodayActivity() {
    if (!user?.id) {
      setActivity("0");
      return;
    }

    try {
      const arr = await getActivityMinutesLastNDays(user.id, 1);
      const mins = arr?.[0]?.minutes ?? 0;
      setActivity(String(Math.round(Number(mins) || 0)));
    } catch (e) {
      console.log("Activity fetch error:", e);
      setActivity("0");
    }
  }

  async function fetchTodayMood() {
    if (!user?.id) {
      setMoodStress("—");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("StressLog")
        .select("mood, date, time")
        .eq("userID", user.id)
        .eq("date", todayKey())
        .order("time", { ascending: false })
        .limit(1);

      if (error) throw error;

      const moodValue = Number(data?.[0]?.mood ?? 0);
      setMoodStress(moodToEmoji(moodValue));
    } catch (e) {
      console.log("Mood fetch error:", e);
      setMoodStress("—");
    }
  }

  useEffect(() => {
    fetchGoals();
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchMetrics();
      fetchTodayActivity();
      fetchTodayMood();
    }, [entryId, user?.id])
  );

  return (
    <View style={style}>
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: "1%",
          paddingVertical: "1%",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flex: 1, alignItems: "center", paddingHorizontal: 0 }}>
          {sleepGoalHours ? (
            <DashboardGoalRing
              label="Sleep"
              valueText={getSleepRingText(Number(sleepToday), sleepGoalHours)}
              progress={clampProgress(Number(sleepToday), sleepGoalHours)}
              color="#187498"
              onPress={() =>
                router.push({
                  pathname: "/health-details",
                  params: { type: "sleep" },
                } as any)
              }
            />
          ) : (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/health-details",
                  params: { type: "sleep" },
                } as any)
              }
            >
              <Sleep value={sleepToday} />
            </Pressable>
          )}
        </View>

        <View style={{ flex: 1, alignItems: "center", paddingHorizontal: 0 }}>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/historicalActivityData",
              } as any)
            }
          >
            <Activity value={activity} />
          </Pressable>
        </View>

        <View style={{ flex: 1, alignItems: "center", paddingHorizontal: 0 }}>
          {stepsGoal ? (
            <DashboardGoalRing
              label="Steps"
              valueText={getStepsRingText(stepsToday, stepsGoal)}
              progress={clampProgress(stepsToday, stepsGoal)}
              color="#F9D923"
              onPress={() =>
                router.push({
                  pathname: "/health-details",
                  params: { type: "steps" },
                } as any)
              }
            />
          ) : (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/health-details",
                  params: { type: "steps" },
                } as any)
              }
            >
              <Steps value={String(stepsToday)} />
            </Pressable>
          )}
        </View>

        <View style={{ flex: 1, alignItems: "center", paddingHorizontal: 0 }}>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/historicalMoodStressData",
              } as any)
            }
          >
            <MoodStress value={moodstress} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

interface MetricItemProps {
  circleLabel: string;
  label: string;
  color?: string;
  isEmoji?: boolean;
}

function MetricItem({ circleLabel, label, color, isEmoji = false }: MetricItemProps) {
  return (
    <View style={{ alignItems: "center" }}>
      <View style={[styles.circle, { borderColor: color }]}>
        <Text style={isEmoji ? styles.emojiCircleLabel : styles.circleLabel}>
          {circleLabel}
        </Text>
      </View>
      <Text style={{ fontSize: 17 }}>{label}</Text>
    </View>
  );
}

function Sleep({ value = "" }: { value?: string }) {
  return <MetricItem circleLabel={value} label="Sleep" color="#187498" />;
}

function Activity({ value = "" }: { value?: string }) {
  return <MetricItem circleLabel={value} label="Activity" color="#36AE7C" />;
}

function Steps({ value = "" }: { value?: string }) {
  return <MetricItem circleLabel={value} label="Steps" color="#F9D923" />;
}

function MoodStress({ value = "" }: { value?: string }) {
  return (
    <MetricItem
      circleLabel={value}
      label="Mood/Stress"
      color="#EB5353"
      isEmoji={true}
    />
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  circleLabel: {
    fontSize: 16,
  },
  emojiCircleLabel: {
    fontSize: 32,
  },
});