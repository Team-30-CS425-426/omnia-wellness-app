import { supabase } from "@/config/supabaseConfig";
import { router } from "expo-router";
import { useContext, useEffect, useState } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { EntryContext } from "./dashboard";

import { useUser } from "@/contexts/UserContext";
import { getActivityMinutesLastNDays } from "@/src/services/workoutService";

interface MetricsProps {
  style?: StyleProp<ViewStyle>;
  health: any;
}

export function Metrics({ style, health }: MetricsProps) {
  const { entryId } = useContext(EntryContext);
  const { user } = useUser(); 

  const [sleep, setSleep] = useState("NaN");
  const [activity, setActivity] = useState("0"); // show 0 by default
  const [nutrition, setNutrition] = useState("NaN");
  const [moodstress, setMoodStress] = useState("NaN");

  const stepsToday =
    Number.isFinite(health?.stepsToday) ? Math.round(health.stepsToday) : 0;

  const sleepToday =
    Number.isFinite(health?.sleepToday)
      ? Number(health.sleepToday).toFixed(1)
      : "0.0";

  async function fetchMetrics() {
    const response = await supabase
      .from("Metrics")
      .select("*")
      .eq("entry_id", entryId);

    if (response?.data?.[0]) {
      const d = response.data[0];
      setSleep(d["sleep"]);
      setNutrition(d["nutrition"]);
      setMoodStress(d["moodstress"]);
    } else {
      setSleep("");
      setNutrition("0");
      setMoodStress("0");
    }
  }

  // Pull today's Activity minutes from ActivityLog
  async function fetchTodayActivity() {
    if (!user?.id) {
      setActivity("0");
      return;
    }

    try {
      // last 1 day => "today"
      const arr = await getActivityMinutesLastNDays(user.id, 1);
      const mins = arr?.[0]?.minutes ?? 0;
      setActivity(String(Math.round(Number(mins) || 0)));
    } catch (e) {
      console.log("Activity fetch error:", e);
      setActivity("0");
    }
  }

  useEffect(() => {
    fetchMetrics();
    fetchTodayActivity();
  }, [entryId, user?.id]);

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
        {/* Sleep (clickable) */}
        <View style={{ flex: 1, alignItems: "center", paddingHorizontal: 0 }}>
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
        </View>

        {/* Activity (clickable) */}
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

        {/* Steps (clickable) */}
        <View style={{ flex: 1, alignItems: "center", paddingHorizontal: 0 }}>
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
        </View>

        {/* Mood */}
        <View style={{ flex: 1, alignItems: "center", paddingHorizontal: 0 }}>
          <MoodStress value={moodstress} />
        </View>
      </View>
    </View>
  );
}

interface MetricItemProps {
  circleLabel: string;
  label: string;
  color?: string;
}

function MetricItem({ circleLabel, label, color }: MetricItemProps) {
  return (
    <View style={{ alignItems: "center" }}>
      <View style={[styles.circle, { borderColor: color }]}>
        <Text style={styles.circleLabel}>{circleLabel}</Text>
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
  return <MetricItem circleLabel={value} label="Mood" color="#EB5353" />;
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
});
