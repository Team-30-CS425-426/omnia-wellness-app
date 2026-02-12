import { useContext} from "react";
import { StyleProp, Text, View, ViewStyle, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { EntryContext } from "./dashboard";

import { Colors } from "../../../constants/Colors";
import ThemedCard from "../ThemedCard";
import Spacer from "../Spacer";

import { useNutritionStats } from "@/src/hooks/NutritionTotals";

interface KeyStatsProps {
    style?: StyleProp<ViewStyle>;
    health: any;
}

export function KeyStats({ style, health }: KeyStatsProps) {
   const { nutrition, isLoading, error } = useNutritionStats();
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
                <Pressable
                    onPress={() =>
                        router.push({
                            pathname: "/health-details",
                            params: { type: "steps" },
                        } as any)
                    }
                >
                </Pressable>
            </View>
        </View>
    );
}

interface KeyStatsItemProps {
    label?: string;
    content?: string;
}

function KeyStatsItem({ label, content }: KeyStatsItemProps) {
    return (
        <ThemedCard style={{
            height: 120,
            width: 220,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 0,
            paddingHorizontal: 0,
            marginVertical: 0
        }}>
            <View>
                <Text style={{fontSize: 16, color: Colors.default.berryBlue}}>{label}</Text>
                <Text style={{fontSize: 16, color: Colors.default.berryBlue}}>{content}</Text>
            </View>
        </ThemedCard>
    );
}

interface NutritionProps {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
}

function Nutrition({ calories = 0, protein = 0, carbs = 0, fat = 0 }: NutritionProps) {
    const calorieGoal = 2000;
    const proteinGoal = 150;
    const carbsGoal = 200;
    const fatGoal = 70;
    
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
                    color: Colors.default.pastelPink,
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
                        <View style={[styles.progressBarFill, { width: `${calorieProgressPercent}%` }]} />
                    </View>
                    <Spacer height={10} />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={styles.label}>Protein</Text>
                        <Text style={styles.value}>{protein}g / {proteinGoal}g</Text>
                    </View>
                    <View style={styles.progressBarTrack}>
                        <View style={[styles.progressBarFill, { width: `${proteinProgressPercent}%` }]} />
                    </View>
                    <Spacer height={10} />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={styles.label}>Carbs</Text>
                        <Text style={styles.value}>{carbs}g / {carbsGoal}g</Text>
                    </View>
                    <View style={styles.progressBarTrack}>
                        <View style={[styles.progressBarFill, { width: `${carbsProgressPercent}%` }]} />
                    </View>
                    <Spacer height={10} />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={styles.label}>Fat</Text>
                        <Text style={styles.value}>{fat}g / {fatGoal}g</Text>
                    </View>
                    <View style={styles.progressBarTrack}>
                        <View style={[styles.progressBarFill, { width: `${fatProgressPercent}%` }]} />
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
        color: Colors.default.pastelPink,
    },
    macroText: {
        fontSize: 11,
        fontWeight: '500',
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
        backgroundColor: Colors.default.berryPurple,
        borderRadius: 4,
    },
});