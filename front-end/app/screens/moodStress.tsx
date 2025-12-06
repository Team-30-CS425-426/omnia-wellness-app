import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function WorkoutScreen() {
    return (
        <View style={styles.container}>
            <text style={styles.title}>Mood & Stress Tracker</text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center" },
    title: { fontSize: 24, fontWeight: "bold" },
});