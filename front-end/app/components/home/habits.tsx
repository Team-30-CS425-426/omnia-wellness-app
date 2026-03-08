
import {  useState, useCallback} from "react";
import { StyleProp, Text, View, ViewStyle, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";


import { Colors } from "../../../constants/Colors";
import ThemedCard from "../ThemedCard";
import Spacer from "../Spacer";

import { useNutritionStats } from "@/src/hooks/NutritionTotals";
import { getUserNutritionGoals } from "@/src/services/nutritionGoalService";
import { useUser } from "@/contexts/UserContext";
import { useFocusEffect } from "@react-navigation/native";
import ThemedText from "../ThemedText";
import ThemedView from "../ThemedView";


interface HabitsProps {
    style?: StyleProp<ViewStyle>;
}

export function Habits({ style }: HabitsProps) {
    return (
        <ThemedView style={style}>
            <ThemedText style={{
                color: Colors.default.berryBlue,
                fontFamily: 'timesnewroman',
                fontWeight: 'bold',
                fontSize: 20,
                flex: 1
            }}>
                Habits
            </ThemedText>
        </ThemedView>
    )
}