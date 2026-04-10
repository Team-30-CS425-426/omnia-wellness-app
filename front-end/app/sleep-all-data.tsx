import { supabase } from "@/config/supabaseConfig";
import { getSleepHoursLastNDays } from "@/src/services/sleepLogService";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type Mode = "W" | "M";
type Row = { left: string; right: string };

const pad2 = (n: number) => String(n).padStart(2, "0");
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

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

const clampNonNeg = (n: any) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return v < 0 ? 0 : v;
};

const hourLabel = (h: number) => {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
};

const minutesToHrMin = (mins: number) => {
  const m = Math.max(0, Math.round(mins));
  const hr = Math.floor(m / 60);
  const rem = m % 60;
  if (hr <= 0) return `${rem} min`;
  if (rem === 0) return `${hr} hr`;
  return `${hr} hr ${rem} min`;
};

export default function SleepAllDataScreen() {
  const { mode } = useLocalSearchParams<{ mode?: Mode }>();
  const m: Mode = (mode as Mode) ?? "W";

  const insets = useSafeAreaInsets();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sleepRange, setSleepRange] = React.useState<{ date: string; hours: number }[]>([]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
  
        const neededDays = m === "W" ? 7 : 30;
  
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
  
        if (userError) throw userError;
        if (!user) throw new Error("No authenticated user found.");
  
        const rows = await getSleepHoursLastNDays(user.id, neededDays);
        setSleepRange(rows);
      } catch (e: any) {
        setError(e?.message || "Failed to load sleep logs.");
        setSleepRange([]);
      } finally {
        setLoading(false);
      }
    }
  
    load();
  }, [m]);

  const rows = useMemo<Row[]>(() => {
    const end = addDays(startOfDay(new Date()), -1);
    const days = m === "W" ? 7 : 30;
    const start = addDays(end, -(days - 1));

    const map = new Map<string, number>();
    (sleepRange || []).forEach((p) => {
      const key = toLocalDayKeyFromAny(p.date);
      if (!key) return;
      map.set(key, clampNonNeg(p.hours) * 60);
    });

    const out: Row[] = [];
    for (let i = 0; i < days; i++) {
      const d = addDays(start, i);
      const key = localDayKey(d);
      const v = map.get(key) ?? 0;

      out.push({
        left: minutesToHrMin(v),
        right: d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      });
    }

    return out.reverse();
  }, [m, sleepRange]);

  const title = "All Recorded Data";

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ paddingTop: Math.max(8, insets.top * 0.2) }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerLeft}>
            <Text style={styles.backChevron}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={{ width: 44 }} />
        </View>

        {loading && <Text style={{ paddingHorizontal: 14 }}>Loading...</Text>}
        {!!error && (
          <Text style={{ paddingHorizontal: 14, color: "red" }}>{error}</Text>
        )}

        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <Text style={styles.sectionLabel}>Sleep</Text>

          <View style={styles.card}>
            {rows.map((r: Row, idx: number) => (
              <View key={`${idx}-${r.right}`} style={styles.row}>
                <Text style={styles.leftText}>{r.left}</Text>
                <View style={styles.rightWrap}>
                  <Text style={styles.rightText}>{r.right}</Text>
                  <Text style={styles.chev}>›</Text>
                </View>
              </View>
            ))}
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
  headerLeft: { paddingVertical: 8, paddingRight: 8 },
  backChevron: { fontSize: 28, lineHeight: 28, fontWeight: "400" },
  headerTitle: { fontSize: 20, fontWeight: "700" },

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
  leftText: { fontSize: 18, fontWeight: "400", color: "#000" },
  rightWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  rightText: { fontSize: 15, color: "#8E8E93", fontWeight: "600" },
  chev: { fontSize: 22, color: "#C7C7CC", fontWeight: "400" },
});