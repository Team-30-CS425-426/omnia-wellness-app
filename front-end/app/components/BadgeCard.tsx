// Code written by Alexis Mae Asuncion

import React from "react";
import { StyleSheet, Text, View } from "react-native";

type BadgeCardProps = {
  icon?: string | null;
  title: string;
  subtitle?: string;
  locked?: boolean; // ADDED: supports locked/unearned badge display
};

export default function BadgeCard({
  icon,
  title,
  subtitle,
  locked = false, // ADDED: default is earned/unlocked
}: BadgeCardProps) {
  return (
    <View style={[styles.card, locked && styles.lockedCard]}>
      <Text style={[styles.icon, locked && styles.lockedContent]}>
        {icon ?? "🏅"}
      </Text>

      <Text style={[styles.title, locked && styles.lockedTitle]}>
        {title}
      </Text>

      {subtitle ? (
        <Text style={[styles.subtitle, locked && styles.lockedSubtitle]}>
          {subtitle}
        </Text>
      ) : null}
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

  // ADDED: grayed-out badge container
  lockedCard: {
    backgroundColor: "#F1F1F1",
    borderColor: "#CFCFCF",
  },

  icon: {
    fontSize: 42,
    marginBottom: 10,
  },

  // ADDED: makes locked icon look disabled
  lockedContent: {
    opacity: 0.35,
  },

  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2E2C76",
    textAlign: "center",
    marginBottom: 8,
  },

  // ADDED: muted locked title
  lockedTitle: {
    color: "#777777",
  },

  subtitle: {
    fontSize: 13,
    color: "#666666",
    textAlign: "center",
  },

  // ADDED: muted locked subtitle
  lockedSubtitle: {
    color: "#999999",
  },
});