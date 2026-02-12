import { useContext, useEffect, useState } from "react";
import { StyleProp, Text, View, ViewStyle, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { EntryContext } from "./dashboard";
import { supabase } from "@/config/supabaseConfig";
import { Colors } from "../../../constants/Colors";
import ThemedCard from "../ThemedCard";
import Spacer from "../Spacer";
import { useUser } from "../../../contexts/UserContext";

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
    const { user } = useUser();

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

    async function fetchNutritionData() {
        console.log('fetchNutritionData Called');
        
        if (!user) {
            console.log('No user in context');
            return;
        }
        
        console.log('User ID from context:', user.id);
    
        const today = new Date();
        const targetDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        console.log('Target date:', targetDate);
    
        const response = await supabase
            .from('NutritionLog')
            .select('calories, protein, carbs, fat')
            .eq('userID', user.id)
            .eq('date', targetDate);
    
        if (response.error) {
            console.log('Supabase query error:', response.error);
            return;
        }
    
        console.log('Response data:', response.data);
        console.log('Number of logs found:', response.data?.length || 0);
    
        if (response?.data && response.data.length > 0) {
            const total = response.data.reduce((acc, log) => {
                return {
                    calories: acc.calories + (Number(log.calories) || 0),
                    protein: acc.protein + (Number(log.protein) || 0),
                    carbs: acc.carbs + (Number(log.carbs) || 0),
                    fat: acc.fat + (Number(log.fat) || 0),
                };
            }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
            
            console.log('Calculated totals:', total);
            setCalories(total.calories);
            setProtein(total.protein);
            setCarbs(total.carbs);
            setFat(total.fat);
        } else {
            console.log('No nutrition logs found for today');
            setCalories(0);
            setProtein(0);
            setCarbs(0);
            setFat(0);
        }
    }

    useEffect(() => {
        if (!user) {
            console.log('No user found');
            return;
        }
        
        console.log("User Exists!");
        fetchKeyStats();
        fetchNutritionData();

        // Set up subscription - use user from context
        console.log('Setting up subscription for user:', user.id);
        const channel = supabase
            .channel('nutrition-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'NutritionLog',
                    filter: `userID=eq.${user.id}`
                },
                (payload) => {
                    console.log('🔥 Nutrition update received:', payload);
                    fetchNutritionData();
                }
            )
            .subscribe((status) => {
                console.log('Subscription status:', status);
            });

        return () => {
            console.log('Cleaning up subscription');
            supabase.removeChannel(channel);
        };
    }, [entryId, user]);

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