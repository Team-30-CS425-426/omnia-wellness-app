import React, { useCallback, useMemo, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import useActiveEnergyData from "@/src/hooks/useActiveEnergyData";

type Mode = "W" | "M";

const pad2 = (n: number) => String(n).padStart(2, "0");

const localDayKey = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export default function ActiveEnergyAllData() {
  const { mode } = useLocalSearchParams<{ mode?: Mode }>();
  const m: Mode = mode === "M" ? "M" : "W";

  const insets = useSafeAreaInsets();
    
  const {
    isAuthorized,
    activeEnergyRange,
    connectAndImport,
    loadRange,
    } = useActiveEnergyData();

  // Load data
  useFocusEffect(
    useCallback(() => {
      async function load() {
        if (!isAuthorized) {
          await connectAndImport();
        }
  
        await loadRange(m === "W" ? 7 : 30);
      }
  
      load();
    }, [isAuthorized, m])
  );

  /**
   * Build FULL list
   * Always 7 or 30 rows
   */
  const rows = useMemo(() => {
    const days = m === "W" ? 7 : 30;
    const today = new Date();

    // Map database/service results
    const map = new Map<string, number>();

    activeEnergyRange.forEach((d) => {
        map.set(d.date, Number(d.calories) || 0);
    });

    const output = [];

    for (let i = 0; i < days; i++) {
      const date = addDays(today, -i);
      const key = localDayKey(date);
      const calories = map.get(key) ?? 0;

      output.push({
        calories,
        date,
      });
    }

    return output;
}, [activeEnergyRange, m]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ paddingTop: Math.max(8, insets.top * 0.2) }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.headerLeft}
          >
            <Text style={styles.backChevron}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>
            All Recorded Data
          </Text>

          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {/* Section label */}
          <Text style={styles.sectionLabel}>
            Active Energy
          </Text>

          <View style={styles.card}>
            {rows.map((r, i) => (
              <View
                key={i}
                style={[
                  styles.row,
                  i === rows.length - 1 && styles.lastRow,
                ]}
              >
                <Text style={styles.leftText}>
                  {Math.round(r.calories)} cal
                </Text>

                <View style={styles.rightWrap}>
                  <Text style={styles.rightText}>
                    {r.date.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
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
    paddingVertical: 8,
    paddingRight: 8,
  },

  backChevron: {
    fontSize: 28,
    lineHeight: 28,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
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

  lastRow: {
    borderBottomWidth: 0,
  },

  leftText: {
    fontSize: 20,
    fontWeight: "400",
    color: "#000",
  },

  rightWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  rightText: {
    fontSize: 15,
    color: "#8E8E93",
    fontWeight: "600",
  },

  chev: {
    fontSize: 22,
    color: "#C7C7CC",
  },
});