import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, SafeAreaView } from "react-native";
import { router } from "expo-router";

type RangeType = "D" | "W" | "M";

export default function ActiveEnergyScreen() {
    const [selectedRange, setSelectedRange] = useState<RangeType>("D");

    return (
        <SafeAreaView style={screenStyles.container}>
            {/* Header */}
            <View style={screenStyles.header}>
                <Pressable onPress={() => router.back()} style={screenStyles.backButton}>
                    <Text style={screenStyles.backText}>{"< Back"}</Text>
                </Pressable>

                <Text style={screenStyles.title}>Active Energy</Text>

                <View style={screenStyles.headerSpacer} />
            </View>

            {/* Toggle */}
            <View style={screenStyles.toggleContainer}>
                {(["D", "W", "M"] as RangeType[]).map((item) => {
                    const isSelected = selectedRange === item;

                    return (
                        <Pressable
                            key={item}
                            onPress={() => setSelectedRange(item)}
                            style={[
                                screenStyles.toggleOption,
                                isSelected && screenStyles.toggleOptionSelected,
                            ]}
                        >
                            <Text
                                style={[
                                    screenStyles.toggleText,
                                    isSelected && screenStyles.toggleTextSelected,
                                ]}
                            >
                                {item}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            {/* Placeholder graph area */}
            <View style={screenStyles.graphCard}>
                <Text style={screenStyles.placeholderText}>
                    {selectedRange} graph will go here
                </Text>
            </View>
        </SafeAreaView>
    );
}

const screenStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3F2F8",
        paddingHorizontal: 14,
        paddingTop: 8,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    backButton: {
        width: 90,
        paddingVertical: 6,
        alignItems: 'flex-start',
    },
    backText: {
        fontSize: 18,
        color: "#111",
        fontWeight: "500",
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "black",
    },
    headerSpacer: {
        width: 90,
    },
    toggleContainer: {
        flexDirection: "row",
        backgroundColor: "#E9E9EC",
        borderRadius: 20,
        padding: 4,
        marginBottom: 18,
        marginHorizontal: 2,
    },
    toggleOption: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
        borderRadius: 16,
    },
    toggleOptionSelected: {
        backgroundColor: "white",
    },
    toggleText: {
        fontSize: 16,
        color: "black",
        fontWeight: "600",
    },
    toggleTextSelected: {
        fontWeight: "700",
    },
    graphCard: {
        flex: 1,
        backgroundColor: "white",
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        marginBottom: 8,
    },
    placeholderText: {
        fontSize: 18,
        color: "#8E8E93",
    },
});