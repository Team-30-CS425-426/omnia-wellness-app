//

import React from "react";
import { StyleSheet, Text, View } from "react-native";

type BadgeCardProps = {
  icon?: string | null;
  title: string;
  subtitle?: string;
};

export default function BadgeCard({
  icon,
  title,
  subtitle,
}: BadgeCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>{icon ?? "🏅"}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    minHeight: 160,
    backgroundColor: "#FFFDF4",
    borderWidth: 1.5,
    borderColor: "#EFDFA6",
    borderRadius: 20,
    padding: 14,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 42,
    marginBottom: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2E2C76",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: "#666666",
    textAlign: "center",
  },
});