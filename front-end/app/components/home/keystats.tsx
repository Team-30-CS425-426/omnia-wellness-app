import { useContext, useEffect, useState } from "react";
import { StyleProp, Text, View, ViewStyle, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { EntryContext } from "./dashboard";
import { supabase } from "@/config/homeSupabaseConfig";
import { Colors } from "../../../constants/Colors";
import ThemedCard from "../ThemedCard";
import Spacer from "../Spacer";

interface KeyStatsProps {
    style?: StyleProp<ViewStyle>;
    health: any;
}

export function KeyStats({ style, health }: KeyStatsProps) {
    const { entryId } = useContext(EntryContext);
    const [sleepQuality, setSleepQuality] = useState("NaN");
    const [steps, setSteps] = useState("NaN");
    const [mood, setMood] = useState("NaN");
    const [habits, setHabits] = useState("NaN");
    const [calories, setCalories] = useState(0);
    const [protein, setProtein] = useState(0);
    const [carbs, setCarbs] = useState(0);
    const [fat, setFat] = useState(0);

    const stepsToday =
        Number.isFinite(health?.stepsToday) ? Math.round(health.stepsToday) : 0;

    async function fetchKeyStats() {
        const response = await supabase
            .from('KeyStats')
            .select('*')
            .eq('entry_id', entryId);
            
        if (response?.data?.[0]) {
            const d = response['data'][0];
            setSleepQuality(d['sleepquality']);
            setSteps(d['steps']);
            setMood(d['mood']);
            setHabits(d['habits']);
            setCalories(Number(d['calories']) || 0);
            setProtein(Number(d['protein']) || 0);
            setCarbs(Number(d['carbs']) || 0);
            setFat(Number(d['fat']) || 0);
        } else {
            setSleepQuality('NaN');
            setSteps('NaN');
            setMood('NaN');
            setHabits('NaN');
            setCalories(0);
            setProtein(0);
            setCarbs(0);
            setFat(0);
        }
    }

    // Fetch nutrition data from NutritionLog table
    async function fetchNutritionData() {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const response = await supabase
            .from('NutritionLog')
            .select('calories, protein, carbs, fat')
            .eq('userID', user.id)
            .eq('entry_id', entryId) // Assuming NutritionLog has entry_id
            .order('created_at', { ascending: false })
            .limit(1);

        if (response?.data?.[0]) {
            const d = response.data[0];
            setCalories(Number(d.calories) || 0);
            setProtein(Number(d.protein) || 0);
            setCarbs(Number(d.carbs) || 0);
            setFat(Number(d.fat) || 0);
        }
    }

    useEffect(() => {
        fetchKeyStats();
        fetchNutritionData();

        // Subscribe to nutrition updates
        const setupSubscription = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const channel = supabase
                .channel('nutrition-updates')
                .on(
                    'postgres_changes',
                    {
                        event: '*', // Listen to INSERT, UPDATE, DELETE
                        schema: 'public',
                        table: 'NutritionLog',
                        filter: `userID=eq.${user.id}`
                    },
                    (payload) => {
                        console.log('Nutrition update received:', payload);
                        // Refetch nutrition data when changes occur
                        fetchNutritionData();
                    }
                )
                .subscribe();

            return channel;
        };

        let channel: any;
        setupSubscription().then((ch) => {
            channel = ch;
        });

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [entryId]);

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
                    calories={calories} 
                    protein={protein} 
                    carbs={carbs} 
                    fat={fat}
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
    // Calculate progress (max 100%)
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
                    color: Colors.default.berryBlue,
                    marginBottom: 10 
                }}>
                    Nutrition
                </Text>

                {/* Calorie Progress Section */}
                <View style={{ marginBottom: 15 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={styles.label}>Calories</Text>
                        <Text style={styles.value}>{calories} / {calorieGoal}</Text>
                    </View>
                    
                    {/* The Progress Bar */}
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
        color: Colors.default.berryBlue,
    },
    macroText: {
        fontSize: 11,
        fontWeight: '500',
        color: Colors.default.berryBlue,
    },
    progressBarTrack: {
        height: 8,
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.05)', // Light gray track
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.default.berryBlue, // Or a nice Green
        borderRadius: 4,
    },
});