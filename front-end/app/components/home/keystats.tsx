/**
 * keystats.tsx
 * 
 * HOME SCREEN COMPONENT that displays nutrition progress toward the user's goals.
 * This is where the Goal system connects to the Home tab — it shows how today's
 * logged nutrition compares against the targets set in the Nutrition Goal.
 * 
 * HOW IT CONNECTS TO THE GOAL SYSTEM:
 *   1. The Nutrition component fetches the user's nutrition goal from the database
 *      via getUserNutritionGoals() (from nutritionGoalService.ts).
 *   2. If a goal exists, the progress bars use those values as the target (100%).
 *      If no goal exists, sensible defaults are used (2000 cal, 150g protein, etc.).
 *   3. Today's actual intake (calories, protein, carbs, fat) is passed in as props
 *      from the useNutritionStats() hook, which aggregates today's nutrition logs.
 *   4. Progress percentages are calculated (actual / goal * 100, capped at 100%).
 *   5. The entire card is pressable — tapping it navigates to the Historical
 *      Nutrition Data screen (historicalNutritionData.tsx) to view the 7-day trend.
 * 
 * DEPENDENCIES:
 *   - nutritionGoalService.ts: getUserNutritionGoals() — fetches goal targets
 *   - NutritionTotals hook: useNutritionStats() — provides today's actual intake
 *   - historicalNutritionData.tsx: destination when the card is tapped
 */

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

import { useActiveEnergyContext } from "@/contexts/ActiveEnergyContext";


// Navigation handler — routes to the historical nutrition chart screen
const handleHistoricalNutritionData = () => {
    console.log('button pressed');
    router.push('/screens/historicalNutritionData');
}

const handleActiveEnergyData = () => {
    console.log('active energy pressed');
    router.push('/screens/activeEnergy' as const);
}


interface KeyStatsProps {
    style?: StyleProp<ViewStyle>;
    health?: any;
}

/**
 * KeyStats
 * 
 * Parent component that renders the "Key Stats" section on the Home tab.
 * Currently contains only the Nutrition card, but is structured to hold
 * additional stat cards (sleep, activity, etc.) in the future.
 * 
 * Receives today's nutrition totals from useNutritionStats() and passes
 * them down to the Nutrition component.
 */
export function KeyStats({ style, health }: KeyStatsProps) {
   const { nutrition } = useNutritionStats();

   const {
    isAuthorized: isActiveEnergyAuthorized,
    activeEnergyToday,
    connectAndImport: connectActiveEnergy,
    loadRange: loadActiveEnergyRange,
  } = useActiveEnergyContext();

  useFocusEffect(
    useCallback(() => {
        async function loadActiveEnergy() {
            if (!isActiveEnergyAuthorized) {
                await connectActiveEnergy();
            }

            await loadActiveEnergyRange(7);
        }

        loadActiveEnergy();
    }, [isActiveEnergyAuthorized])
);

    return (
        <View style={style}>
            <Text style={{
                color: Colors.default.berryBlue,
                fontFamily: 'timesnewroman',
                fontWeight: 'bold',
                fontSize: 20,
                flex: 1
            }}>
                Key Stats
            </Text>
            <View style={{
                flexDirection: 'column',
                gap: 20,
            }}>
                {/* Pass today's actual intake to the Nutrition card */}
                <Nutrition 
                    calories={nutrition.calories} 
                    protein={nutrition.protein} 
                    carbs={nutrition.carbs} 
                    fat={nutrition.fat}
                />
                <ActiveEnergy
                caloriesBurned={activeEnergyToday}
                />
            </View>
        </View>
    );
}

interface NutritionProps {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
}

/**
 * Nutrition
 * 
 * Displays a pressable card with 4 progress bars (calories, protein, carbs, fat).
 * Each progress bar shows today's intake vs. the user's goal.
 * 
 * GOAL FETCHING:
 *   - Uses useFocusEffect to re-fetch the nutrition goal every time the Home tab
 *     comes into focus (so progress bars update immediately after a goal is created/updated).
 *   - Falls back to default values (2000 cal, 150g protein, 200g carbs, 65g fat)
 *     if no goal has been set yet.
 * 
 * PRESSABLE BEHAVIOR:
 *   - The entire ThemedCard is pressable (onPress is passed directly to ThemedCard).
 *   - Tapping navigates to historicalNutritionData.tsx to view the 7-day bar chart.
 */
function Nutrition({ calories = 0, protein = 0, carbs = 0, fat = 0 }: NutritionProps) {
    const { user } = useUser();

    // Stores the user's nutrition goal targets, fetched from the database
    // null until the first fetch completes
    const [goals, setGoals] = useState<{
        calorie_goal: number;
        protein_goal: number;
        carb_goal: number;
        fat_goal: number;
    } | null>(null);
    
    // Fetch the user's nutrition goal from the database every time this screen gains focus
    // This ensures that if the user sets a new goal on the profile page, the progress
    // bars here immediately reflect the new targets when they switch back to the Home tab
    useFocusEffect(
        useCallback(() => {
            async function fetchGoals() {
                if (!user?.id) {
                    return;
                }
    
                try {
                    const data = await getUserNutritionGoals(user.id);
                    
                    if (data) {
                        // Goal exists — use the database values (with fallback defaults just in case)
                        setGoals({
                            calorie_goal: data.calorie_goal || 2000,
                            protein_goal: data.protein_goal || 150,
                            carb_goal: data.carb_goal || 200,
                            fat_goal: data.fat_goal || 65,
                        });
                    } else {
                        // No goal set yet — use sensible defaults so progress bars still render
                        setGoals({
                            calorie_goal: 2000,
                            protein_goal: 150,
                            carb_goal: 200,
                            fat_goal: 65,
                        });
                    }
                } catch (error) {
                    console.error('Error fetching nutrition goals:', error);
                }
            }
    
            fetchGoals();
        }, [user?.id])
    );

    // Extract goal values with fallback defaults for the progress calculations
    const calorieGoal = goals?.calorie_goal || 2000;
    const proteinGoal = goals?.protein_goal || 150;
    const carbsGoal = goals?.carb_goal || 200;
    const fatGoal = goals?.fat_goal || 65;

    // Calculate progress percentages: (actual / goal) * 100, capped at 100%
    // Math.min ensures the progress bar never overflows past 100% visually
    const calorieProgressPercent = Math.min((calories / calorieGoal) * 100, 100);
    const proteinProgressPercent = Math.min((protein / proteinGoal) * 100, 100);
    const carbsProgressPercent = Math.min((carbs / carbsGoal) * 100, 100);
    const fatProgressPercent = Math.min((fat / fatGoal) * 100, 100);

    return (
        <ThemedCard  onPress={() => handleHistoricalNutritionData()} 
        style={{
            height: 200,
            width: '100%',
            justifyContent: 'flex-start', 
            alignItems: 'flex-start',     
            padding: 10,
        }}>
            <View style={{ width: '100%' }}>
                <Text style={{
                    fontSize: 18, 
                    fontWeight: 'bold', 
                    color: "#52357B",
                    marginBottom: 10 
                }}>
                    Nutrition
                </Text>

                <View style={{ marginBottom: 15 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={styles.label}>Calories</Text>
                        <Text style={styles.value}>{calories} / {calorieGoal}</Text>
                    </View>
                    
                    <View style={styles.progressBarTrack}>
                        <View style={[styles.progressBarFill, { width: `${calorieProgressPercent}%`, backgroundColor: "#52357B"}]} />
                    </View>
                    <Spacer height={10} />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={styles.label}>Protein</Text>
                        <Text style={styles.value}>{protein}g / {proteinGoal}g</Text>
                    </View>
                    <View style={styles.progressBarTrack}>
                        <View style={[styles.progressBarFill, { width: `${proteinProgressPercent}%`, backgroundColor: "#5459AC" }]} />
                    </View>
                    <Spacer height={10} />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={styles.label}>Carbs</Text>
                        <Text style={styles.value}>{carbs}g / {carbsGoal}g</Text>
                    </View>
                    <View style={styles.progressBarTrack}>
                        <View style={[styles.progressBarFill, { width: `${carbsProgressPercent}%`, backgroundColor: "#648DB3" }]} />
                    </View>
                    <Spacer height={10} />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={styles.label}>Fat</Text>
                        <Text style={styles.value}>{fat}g / {fatGoal}g</Text>
                    </View>
                    <View style={styles.progressBarTrack}>
                        <View style={[styles.progressBarFill, { width: `${fatProgressPercent}%`, backgroundColor: "#B2D8CE" }]} />
                    </View>
                </View>
            </View>
        </ThemedCard>
    );
}

interface ActiveEnergyProps {
    caloriesBurned?: number;
}

function ActiveEnergy({ caloriesBurned = 0 }: ActiveEnergyProps) {
    return (
        <ThemedCard
            onPress={() => handleActiveEnergyData()}
            style={{
                height: 145,
                width: '100%',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                paddingHorizontal: 18,
                paddingVertical: 14,
            }}
        >
            <View style={{ width: '100%', flex: 1, justifyContent: 'space-between' }}>
                {/* Top row */}
                <View
                    style={{
                        width: '100%',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 22, marginRight: 8 }}>🔥</Text>
                        <Text
                            style={{
                                fontSize: 17,
                                fontWeight: 'bold',
                                color: '#FF5A1F',
                            }}
                        >
                            Active Energy
                        </Text>
                    </View>

                    <Text
                        style={{
                            fontSize: 24,
                            color: '#B8B8BE',
                            fontWeight: '400',
                        }}
                    >
                        ›
                    </Text>
                </View>

                {/* Bottom row */}
                <View
                    style={{
                        width: '100%',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        marginTop: 8,
                    }}
                >
                    <View>
                        <Text
                            style={{
                                fontSize: 36,
                                fontWeight: '700',
                                color: 'black',
                                lineHeight: 40,
                            }}
                        >
                            {Math.round(caloriesBurned)}
                        </Text>
                        <Text
                            style={{
                                fontSize: 18,
                                color: '#8E8E93',
                                fontWeight: '600',
                            }}
                        >
                            cal
                        </Text>
                    </View>

                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'flex-end',
                            gap: 8,
                            paddingRight: 4,
                        }}
                    >
                        <View style={[activeEnergyStyles.bar, { height: 28 }]} />
                        <View style={[activeEnergyStyles.bar, { height: 52 }]} />
                        <View style={[activeEnergyStyles.bar, { height: 52 }]} />
                        <View style={[activeEnergyStyles.bar, { height: 38 }]} />
                        <View style={[activeEnergyStyles.bar, { height: 68 }]} />
                        <View
                            style={[
                                activeEnergyStyles.bar,
                                { height: 5, width: 18, borderRadius: 3 },
                            ]}
                        />
                    </View>
                </View>
            </View>
        </ThemedCard>
    );
}

const styles = StyleSheet.create({
    label: {
        fontSize: 12,
        color: Colors.default.berryBlue,
        opacity: 0.8
    },
    value: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.default.berryBlue,
    },
    progressBarTrack: {
        height: 8,
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.default.berryBlue,
        borderRadius: 4,
    },
});
const activeEnergyStyles = StyleSheet.create({
    bar: {
        width: 18,
        borderRadius: 5,
        backgroundColor: '#E5E5EA',
    },
});