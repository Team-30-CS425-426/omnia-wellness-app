import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from './Colors';
import ThemedText from '../app/components/ThemedText';

export type GoalType = 'nutrition' | 'sleep' | 'physical-activity' | 'mood';   

export interface GoalConfig {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    textColor: string;
    route: string
    renderDetails: (goal: any) => React.ReactNode;
}

export const getIconColor = (goalType: GoalType) => {
        switch (goalType) {
          case 'nutrition':
            return Colors.default.strongGreen;
          case 'sleep':
            return Colors.default.berryBlue;
          case 'physical-activity':
            return Colors.default.darkBlue;
          case 'mood':
            return Colors.default.mustardYellow;
          default:
            return Colors.default.berryBlue;
        }
};

export interface UserGoal {
    type: GoalType;
    data: any; // The actual goal data (varies by type)
}

export const GOAL_CONFIGS: Record<GoalType, GoalConfig> = {
    'nutrition': {
        label: 'Nutrition Goal',
        icon: 'restaurant',
        color: Colors.default.white,
        textColor: Colors.default.strongGreen,
        route: '/screens/nutritionGoal',
        renderDetails: (goal) => (
            <View style={goalDetailStyles.goalDetails}>
                <ThemedText style={[goalDetailStyles.goalText, { color: Colors.default.strongGreen }]}>
                    Calories: {goal.calorie_goal}
                </ThemedText>
                <ThemedText style={[goalDetailStyles.goalText, { color: Colors.default.strongGreen }]}>
                    Protein: {goal.protein_goal}g
                </ThemedText>
                <ThemedText style={[goalDetailStyles.goalText, { color: Colors.default.strongGreen }]}>
                    Carbs: {goal.carb_goal}g
                </ThemedText>
                <ThemedText style={[goalDetailStyles.goalText, { color: Colors.default.strongGreen }]}>
                    Fat: {goal.fat_goal}g
                </ThemedText>
            </View>
        )
    },
    'sleep': {
        label: 'Sleep Goal',
        icon: 'bed',
        color: Colors.default.berryBlue,
        textColor: Colors.default.berryBlue,
        route: '/screens/sleepGoal',
        renderDetails: (goal) => (
            <View style={goalDetailStyles.goalDetails}>
                <ThemedText style={goalDetailStyles.goalText}>
                    Target Hours: {goal.target_hours}h
                </ThemedText>
                <ThemedText style={goalDetailStyles.goalText}>
                    Bedtime: {goal.bedtime || 'Not set'}
                </ThemedText>
            </View>
        )
    },
    'physical-activity': {
        label: 'Activity Goal',
        icon: 'barbell',
        color: Colors.default.darkBlue,
        textColor: Colors.default.darkBlue,
        route: '/screens/workoutGoal',
        renderDetails: (goal) => (
            <View style={goalDetailStyles.goalDetails}>
                <ThemedText style={goalDetailStyles.goalText}>
                    Weekly: {goal.weekly_minutes || 0} min
                </ThemedText>
                <ThemedText style={goalDetailStyles.goalText}>
                    Days/Week: {goal.days_per_week || 0}
                </ThemedText>
            </View>
        )
    },
    'mood': {
        label: 'Mood Goal',
        icon: 'happy',
        color: Colors.default.mustardYellow,
        textColor: Colors.default.mustardYellow,
        route: '/screens/moodStressGoal',
        renderDetails: (goal) => (
            <View style={goalDetailStyles.goalDetails}>
                <ThemedText style={goalDetailStyles.goalText}>
                    Target: {goal.target_mood || 'Not set'}
                </ThemedText>
                <ThemedText style={goalDetailStyles.goalText}>
                    Check-ins: {goal.daily_checkins || 0}
                </ThemedText>
            </View>
        )
    }
};

export const goalDetailStyles = {
    goalDetails: {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        justifyContent: 'space-between' as const,
    },
    goalText: {
        fontSize: 16,
        color: Colors.default.white,
        marginVertical: 4,
        width: '48%' as const,
    }
};