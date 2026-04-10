import useStepsDisplayed from "@/src/hooks/useHealthKit/stepsDisplayed";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type Mode = "D" | "W" | "M";
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

export default function StepAllDataScreen() {
  const { mode } = useLocalSearchParams<{ mode?: Mode }>();
  const m: Mode = (mode as Mode) ?? "D";

  const insets = useSafeAreaInsets();
  const health = useStepsDisplayed();

  useEffect(() => {
    if (!health.isAuthorized && !health.loading) {
      health.connectAndImport();
    }
  }, [health.isAuthorized, health.loading]);

  useEffect(() => {
    if (!health.isAuthorized) return;
    if (m === "W") health.loadRange(7);
    if (m === "M") health.loadRange(30);
  }, [m, health.isAuthorized]);

  const rows = useMemo<Row[]>(() => {
    if (m === "D") {
      const bins = (health.stepsDayBins || []).map((x: any) => clampNonNeg(x));
      const safe: number[] = bins.length === 24 ? (bins as number[]) : new Array(24).fill(0);

      return safe
        .map((v: number, h: number) => ({
          left: `${Math.round(v).toLocaleString()}`,
          right: hourLabel(h),
        }))
        .reverse();
    }

    const end = startOfDay(new Date());
    const days = m === "W" ? 7 : 30;
    const start = addDays(end, -(days - 1));

    const map = new Map<string, number>();
    (health.stepsRange || []).forEach((p: any) => {
      const key = toLocalDayKeyFromAny(p.startDate);
      if (!key) return;
      map.set(key, clampNonNeg(p.value));
    });

    const out: Row[] = [];
    for (let i = 0; i < days; i++) {
      const d = addDays(start, i);
      const key = localDayKey(d);
      const v = map.get(key) ?? 0;

      out.push({
        left: `${Math.round(v).toLocaleString()}`,
        right: d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      });
    }

    return out.reverse();
  }, [m, health.stepsDayBins, health.stepsRange]);

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

        {health.loading && <Text style={{ paddingHorizontal: 14 }}>Loading...</Text>}
        {!!health.error && (
          <Text style={{ paddingHorizontal: 14, color: "red" }}>{health.error}</Text>
        )}

        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <Text style={styles.sectionLabel}>Steps</Text>

          <View style={styles.card}>
            {rows.map((r: Row, idx: number) => (
              <View key={`${idx}-${r.right}`} style={styles.row}>
                <Text style={styles.leftText}>{r.left}</Text>
                <View style={styles.rightWrap}>
                  <Text style={styles.rightText}>{r.right}</Text>
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
  rightText: { fontSize: 15, color: "#8E8E93", fontWeight: "600" }
});