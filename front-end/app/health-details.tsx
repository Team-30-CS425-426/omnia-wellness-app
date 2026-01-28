import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import useHealthData from "@/src/hooks/useHealthData";

type RangeDays = 7 | 30;

export default function HealthDetailsScreen() {
  const { type } = useLocalSearchParams<{ type?: string }>();
  const isSteps = type === "steps";
  const title = isSteps ? "Steps" : "Sleep";

  const insets = useSafeAreaInsets();
  const health = useHealthData();
  const [range, setRange] = useState<RangeDays>(7);

  // Make sure we're connected (in case user opens this screen directly)
  useEffect(() => {
    if (!health.isAuthorized && !health.loading) {
      health.connectAndImport();
    }
  }, [health.isAuthorized, health.loading]);

  // Load 7 or 30 day range whenever the toggle changes
  useEffect(() => {
    if (health.isAuthorized) {
      health.loadRange(range);
    }
  }, [range, health.isAuthorized]);

  const rows = useMemo(() => {
    const data = isSteps ? health.stepsRange : health.sleepRange;

    return (data || []).map((item: any) => {
      const date = String(item.startDate).slice(0, 10);
      const value = Number(item.value) || 0;
      return { date, value };
    });
  }, [isSteps, health.stepsRange, health.sleepRange]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: Math.max(8, insets.top * 0.25), // keeps it away from notch
          paddingHorizontal: 16,
          paddingBottom: 24,
        }}
      >
        {/* Top bar (Back + Title) */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 10,
              borderRadius: 10,
              borderWidth: 1,
            }}
          >
            <Text style={{ fontSize: 16 }}>← Back</Text>
          </Pressable>

          <Text style={{ fontSize: 18, fontWeight: "600" }}>{title}</Text>

          {/* spacer so title stays centered */}
          <View style={{ width: 70 }} />
        </View>

        {/* Toggle Buttons */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
          <Pressable
            onPress={() => setRange(7)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderWidth: 1,
              borderRadius: 12,
              backgroundColor: range === 7 ? "#eee" : "white",
            }}
          >
            <Text>Last 7 days</Text>
          </Pressable>

          <Pressable
            onPress={() => setRange(30)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderWidth: 1,
              borderRadius: 12,
              backgroundColor: range === 30 ? "#eee" : "white",
            }}
          >
            <Text>Last 30 days</Text>
          </Pressable>
        </View>

        {/* Status */}
        {health.loading && <Text>Loading...</Text>}
        {!!health.error && <Text style={{ color: "red" }}>{health.error}</Text>}

        {/* Data List */}
        <View style={{ gap: 10, marginTop: 8 }}>
          {rows.length === 0 && !health.loading ? (
            <Text>No data found for this range.</Text>
          ) : (
            rows.map((r) => (
              <View
                key={r.date}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderColor: "#eee",
                }}
              >
                <Text style={{ fontSize: 16 }}>{r.date}</Text>
                <Text style={{ fontSize: 16 }}>
                  {isSteps ? Math.round(r.value) : r.value.toFixed(1)}{" "}
                  {isSteps ? "steps" : "hrs"}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
