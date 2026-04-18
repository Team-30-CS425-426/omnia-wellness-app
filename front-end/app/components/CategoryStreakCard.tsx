// Code written by Alexis Mae Asuncion

import React from "react";
import { StyleSheet, Text, View } from "react-native";

type CategoryStreakCardProps = {
  title: string;
  streakCount: number;
  subtitle?: string;
  unit?: "day" | "week";
};

export default function CategoryStreakCard({
  title,
  streakCount,
  subtitle,
  unit = "day",
}: CategoryStreakCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.circle}>
        <Text style={styles.count}>{streakCount}</Text>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>🔥 {title}</Text>
        <Text style={styles.streakText}>
          {streakCount} {unit} streak
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFDF4",
    borderWidth: 1.5,
    borderColor: "#EFDFA6",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  circle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 4,
    borderColor: "#F7D21E",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    flexShrink: 0,
  },
  count: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2E2C76",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2E2C76",
    marginBottom: 2,
  },
  streakText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2E2C76",
  },
  subtitle: {
    fontSize: 13,
    color: "#666666",
    marginTop: 2,
  },
});