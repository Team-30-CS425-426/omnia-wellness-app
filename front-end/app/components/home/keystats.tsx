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

interface KeyStatsProps {
    style?: StyleProp<ViewStyle>;
}

export function KeyStats({ style }: KeyStatsProps) {
   const { nutrition } = useNutritionStats();
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
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 20,
            }}>
                <Nutrition 
                    calories={nutrition.calories} 
                    protein={nutrition.protein} 
                    carbs={nutrition.carbs} 
                    fat={nutrition.fat}
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

function Nutrition({ calories = 0, protein = 0, carbs = 0, fat = 0 }: NutritionProps) {
    const { user } = useUser();
    const [goals, setGoals] = useState<{
        calorie_goal: number;
        protein_goal: number;
        carb_goal: number;
        fat_goal: number;
    } | null>(null);
    
    useFocusEffect(
        useCallback(() => {
            async function fetchGoals() {
                if (!user?.id) {
                    return;
                }
    
                try {
                    const data = await getUserNutritionGoals(user.id);
                    
                    if (data) {
                        setGoals({
                            calorie_goal: data.calorie_goal || 2000,
                            protein_goal: data.protein_goal || 150,
                            carb_goal: data.carb_goal || 200,
                            fat_goal: data.fat_goal || 65,
                        });
                    } else {
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

    // Use goals or defaults
    const calorieGoal = goals?.calorie_goal || 2000;
    const proteinGoal = goals?.protein_goal || 150;
    const carbsGoal = goals?.carb_goal || 200;
    const fatGoal = goals?.fat_goal || 65;

    const calorieProgressPercent = Math.min((calories / calorieGoal) * 100, 100);
    const proteinProgressPercent = Math.min((protein / proteinGoal) * 100, 100);
    const carbsProgressPercent = Math.min((carbs / carbsGoal) * 100, 100);
    const fatProgressPercent = Math.min((fat / fatGoal) * 100, 100);

    return (
        <ThemedCard style={{
            height: 200,
            width: 375,
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