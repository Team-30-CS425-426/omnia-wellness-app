/**
 * goalConfigs.tsx
 * 
 * CENTRALIZED CONFIGURATION for the Goal system.
 * This file defines the types, display configs, and rendering logic for ALL goal types.
 * 
 * PURPOSE:
 *   - Keeps goal-related configuration in one place so profile.tsx stays clean
 *   - Makes it easy to add new goal types in the future (sleep, activity, mood)
 *     by simply adding a new entry to the GOAL_CONFIGS object
 * 
 * USED BY:
 *   - profile.tsx: imports GoalType, GOAL_CONFIGS, and UserGoal to dynamically
 *     render goal cards and handle goal selection/routing
 *   - SetGoalModal.tsx: imports GoalType and getIconColor to display the
 *     goal selection modal with properly colored icons
 * 
 * HOW IT WORKS:
 *   Each goal type has a GoalConfig entry that defines:
 *     - label:         Display name shown on the goal card
 *     - icon:          Ionicons icon name for the card header
 *     - color:         Background color of the goal card
 *     - textColor:     Text/accent color for the card
 *     - route:         Expo Router path to navigate to when creating this goal type
 *     - renderDetails: A function that takes the raw goal data from the database
 *                      and returns JSX to display the goal's details (e.g. calorie/macro values)
 */

import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from './Colors';
import ThemedText from '../app/components/ThemedText';

/**
 * GoalType
 * Union type of all supported goal categories.
 * Currently only 'nutrition' is fully implemented — the others are placeholders
 * for future development. Adding a new goal type here requires also adding
 * a corresponding entry in GOAL_CONFIGS below.
 */
export type GoalType = 'nutrition' | 'sleep' | 'steps' | 'physical-activity' | 'mood';   

/**
 * GoalConfig
 * Defines everything needed to display and navigate to a particular goal type.
 * The renderDetails function receives the raw database row for that goal
 * and returns the JSX to render inside the goal card on the profile page.
 */
export interface GoalConfig {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    textColor: string;
    route: string
    renderDetails: (goal: any) => React.ReactNode;
}

/**
 * getIconColor
 * Returns the theme color associated with each goal type.
 * Used by SetGoalModal.tsx to color the icons in the goal selection grid.
 */
export const getIconColor = (goalType: GoalType) => {
        switch (goalType) {
          case 'nutrition':
            return Colors.default.strongGreen;
          case 'sleep':
            return Colors.default.sleepyBlue;
          case 'steps':
                return Colors.default.yellowOrange;
          case 'physical-activity':
            return Colors.default.ActivityGreen;
          case 'mood':
            return Colors.default.candyRed;
          default:
            return Colors.default.berryBlue;
        }
};

/**
 * UserGoal
 * Represents a single active goal for a user, combining:
 *   - type: which goal category it belongs to (e.g. 'nutrition')
 *   - data: the raw database row (e.g. { calorie_goal: 2000, protein_goal: 150, ... })
 * 
 * An array of UserGoal objects is stored in profile.tsx's state and used
 * to dynamically render one card per active goal.
 */
export interface UserGoal {
    type: GoalType;
    data: any; // The actual goal data (varies by type)
}

/**
 * GOAL_CONFIGS
 * 
 * The master configuration object for the goal system.
 * Each key is a GoalType, and each value is a GoalConfig.
 * 
 * For nutrition specifically:
 *   - route: navigates to '/screens/nutritionGoal' (the goal-setting form)
 *   - renderDetails: displays calorie_goal, protein_goal, carb_goal, fat_goal
 *     from the database row returned by getUserNutritionGoals()
 * 
 * To add a new goal type:
 *   1. Add the type string to the GoalType union above
 *   2. Add a new entry here with label, icon, color, textColor, route, and renderDetails
 *   3. Create the corresponding goal screen (e.g. '/screens/sleepGoal')
 *   4. Create the corresponding service file (e.g. sleepGoalService.ts)
 *   5. Add a fetch call in profile.tsx's fetchAllGoals function
 */
export const GOAL_CONFIGS: Record<GoalType, GoalConfig> = {
    // NUTRITION GOAL — fully implemented
    // Displays calorie, protein, carbs, and fat targets on the profile card.
    // Data comes from the 'nutritiongoals' table via getUserNutritionGoals().
    'nutrition': {
        label: 'Nutrition Goal',
        icon: 'restaurant',
        color: Colors.default.white,
        textColor: Colors.default.berryPurple,
        route: '/screens/nutritionGoal',
        renderDetails: (goal) => (
            <View style={goalDetailStyles.goalDetails}>
                <ThemedText style={[goalDetailStyles.goalText, { color: Colors.default.successGreen }]}>
                    Calories: {goal.calorie_goal}
                </ThemedText>
                <ThemedText style={[goalDetailStyles.goalText, { color: Colors.default.successGreen }]}>
                    Protein: {goal.protein_goal}g
                </ThemedText>
                <ThemedText style={[goalDetailStyles.goalText, { color: Colors.default.successGreen }]}>
                    Carbs: {goal.carb_goal}g
                </ThemedText>
                <ThemedText style={[goalDetailStyles.goalText, { color: Colors.default.successGreen }]}>
                    Fat: {goal.fat_goal}g
                </ThemedText>
            </View>
        )
    },
    // SLEEP GOAL — placeholder, not yet implemented
    // Will display target sleep hours and preferred bedtime once the sleep goal screen is built.
    'sleep': {
        label: 'Sleep Goal',
        icon: 'bed',
        color: Colors.default.white,
        textColor: Colors.default.sleepyBlue,
        route: '/screens/sleepGoals',
        renderDetails: (goal) => (
            <View style={goalDetailStyles.goalDetails}>
                <ThemedText style={[goalDetailStyles.goalText, { color: Colors.default.sleepyBlue }]}>
                    Goal: {goal.sleep_goal_hours}h
                </ThemedText>
            </View>
        )
    },

    'steps': {
        label: 'Steps Goal',
        icon: 'walk',
        color: Colors.default.white,
        textColor: '#F9C958',
        route: '/screens/stepsGoals',
        renderDetails: (goal) => (
            <View style={goalDetailStyles.goalDetails}>
                <ThemedText style={[goalDetailStyles.goalText, { color: Colors.default.testYellow }]}>
                    Goal: {goal.steps_goal}
                </ThemedText>
            </View>
        )
    },

    // PHYSICAL ACTIVITY GOAL — implemented
    // Will display weekly activity minutes and days per week once the workout goal screen is built.
    'physical-activity': {
    label: 'Activity Goal',
    icon: 'barbell',
    color: Colors.default.white,
    textColor: Colors.default.ActivityGreen,
    route: '/screens/activityGoal',
    renderDetails: (goal) => (
        <View style={goalDetailStyles.goalDetails}>
        <ThemedText style={[goalDetailStyles.goalText, { color: Colors.default.ActivityGreen }]}>
            Weekly: {goal.weekly_minutes || 0} min
        </ThemedText>
        <ThemedText style={[goalDetailStyles.goalText, { color: Colors.default.ActivityGreen }]}>
            Days/Week: {goal.days_per_week || 0}
        </ThemedText>
        </View>
    )
    },

    // MOOD GOAL — implemented
    // Will display target mood and stress and daily check-in count once the mood goal screen is built.
    'mood': {
    label: 'Mood Goal',
    icon: 'happy',
    color: Colors.default.white,
    textColor: Colors.default.mustardYellow,
    route: '/screens/moodStressGoal',
    renderDetails: (goal) => {
        const moodLabel =
            goal.target_mood === 1 ? 'Very Low 😞' :
            goal.target_mood === 2 ? 'Low 🙁' :
            goal.target_mood === 3 ? 'Neutral 😐' :
            goal.target_mood === 4 ? 'Good 😊' :
            goal.target_mood === 5 ? 'Excellent 😁' :
            'Not set';

        return (
            <View style={goalDetailStyles.goalDetails}>
                <ThemedText style={[goalDetailStyles.goalText, { color: Colors.default.mustardYellow }]}>
                    Mood: {moodLabel}
                </ThemedText>
                <ThemedText style={[goalDetailStyles.goalText, { color: Colors.default.mustardYellow }]}>
                    Stress: ≤ {goal.target_stress_level || 0}/10
                </ThemedText>
                <ThemedText style={[goalDetailStyles.goalText, { color: Colors.default.mustardYellow, width: '100%' }]}>
                    Check-ins: {goal.daily_checkins || 0}/day
                </ThemedText>
            </View>
        );
    }
},
};

/**
 * goalDetailStyles
 * Shared styles used by each goal type's renderDetails function.
 * Arranges goal detail text in a 2-column row layout within each goal card.
 */
export const goalDetailStyles = {
    goalDetails: {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        justifyContent: 'space-between' as const,
    },
    goalText: {
        fontSize: 16,
        fontWeight: "600" as const,
        color: Colors.default.white,
        marginVertical: 4,
        width: '48%' as const,
    }
};