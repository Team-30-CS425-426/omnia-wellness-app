// code written by Alexis Mae Asuncion

import React, { useCallback, useMemo, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import { supabase } from "@/config/supabaseConfig";
import { useUser } from "@/contexts/UserContext";

type Mode = "W" | "M";

type MoodStressRow = {
  date: string;
  mood: number;
  stressLevel: number;
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
      return "—";
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

export default function MoodStressAllDataScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { mode } = useLocalSearchParams<{ mode?: Mode }>();

  const m: Mode = mode === "M" ? "M" : "W";
  const days = useMemo(() => (m === "W" ? 7 : 30), [m]);

  const [rows, setRows] = useState<MoodStressRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useFocusEffect(
    useCallback(() => {
      async function load() {
        if (!user?.id) return;

        setLoading(true);
        setErrorMsg("");

        try {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const start = addDays(today, -(days - 1));
          const startKey = localDayKey(start);

          const { data, error } = await supabase
            .from("StressLog")
            .select("date, mood, stressLevel")
            .eq("userID", user.id)
            .gte("date", startKey)
            .order("date", { ascending: true });

          if (error) throw error;

          const map = new Map<string, { mood: number; stressLevel: number }>();

          (data ?? []).forEach((row: any) => {
            const key = String(row.date).slice(0, 10);
            map.set(key, {
              mood: Number(row.mood) || 0,
              stressLevel: Number(row.stressLevel) || 0,
            });
          });

          const out: MoodStressRow[] = [];
          for (let i = 0; i < days; i++) {
            const d = addDays(start, i);
            const key = localDayKey(d);
            const found = map.get(key);

            out.push({
              date: key,
              mood: found?.mood ?? 0,
              stressLevel: found?.stressLevel ?? 0,
            });
          }

          setRows(out.reverse());
        } catch (e: any) {
          setRows([]);
          setErrorMsg(e?.message ?? String(e));
        } finally {
          setLoading(false);
        }
      }

      load();
    }, [user?.id, days])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ paddingTop: Math.max(8, insets.top * 0.2) }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerLeft}>
            <Text style={styles.backChevron}>‹</Text>
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <Text style={styles.headerTitle}>All Recorded Data</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <Text style={styles.sectionLabel}>
            Mood & Stress ({m === "W" ? "Last 7 days" : "Last 30 days"})
          </Text>

          {loading ? (
            <Text style={{ paddingHorizontal: 14, color: "#8E8E93" }}>Loading...</Text>
          ) : null}

          {!!errorMsg ? (
            <Text style={{ paddingHorizontal: 14, color: "red" }}>{errorMsg}</Text>
          ) : null}

          <View style={styles.card}>
            {rows.length === 0 && !loading && !errorMsg ? (
              <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
                <Text style={{ color: "#8E8E93" }}>No mood or stress records in this range.</Text>
              </View>
            ) : null}

            {rows.map((row, idx) => {
              const d = parseLocalYYYYMMDD(row.date);
              const dateText = d.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <View key={`${row.date}-${idx}`} style={styles.row}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.leftText}>
                      {moodToEmoji(row.mood)} {moodToLabel(row.mood)}
                    </Text>
                    <Text style={styles.subText}>Stress Level: {row.stressLevel}</Text>
                  </View>

                  <View style={styles.rightWrap}>
                    <Text style={styles.rightText}>{dateText}</Text>
                    
                  </View>
                </View>
              );
            })}
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

  sectionLabel: {
    marginTop: 6,
    marginHorizontal: 14,
    fontSize: 15,
    color: "#8E8E93",
    fontWeight: "700",
  },

  card: {
    marginTop: 10,
    marginHorizontal: 14,
    backgroundColor: "white",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },

  row: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },

  leftText: {
    fontSize: 18,
    fontWeight: "400",
    color: "#000",
  },
  subText: {
    marginTop: 4,
    fontSize: 16,
    color: "#000",
    //color: "#8E8E93",
    fontWeight: "400",
  },

  rightWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rightText: {
    fontSize: 15,
    color: "#8E8E93",
    fontWeight: "700",
  },
  chev: {
    fontSize: 22,
    color: "#C7C7CC",
    fontWeight: "400",
  },
});