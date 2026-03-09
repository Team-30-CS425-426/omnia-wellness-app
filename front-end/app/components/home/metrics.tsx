import { supabase } from "@/config/supabaseConfig";
import { router } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { EntryContext } from "./dashboard";
import DashboardGoalRing from "../DashboardGoalRing";
import { useUser } from "../../../contexts/UserContext";
import { getSleepGoal } from "@/src/services/sleepGoalService";
import { getStepsGoal } from "@/src/services/stepsGoalService";

interface MetricsProps {
    style?: StyleProp<ViewStyle>;
    health: any;
}


export function Metrics({ style, health  }: MetricsProps) {
    const { entryId } = useContext(EntryContext);
    const { user } = useUser();
    const [sleep, setSleep] = useState("NaN")
    const [activity, setActivity] = useState("NaN")
    const [nutrition, setNutrition] = useState("NaN")
    const [moodstress, setMoodStress] = useState("NaN")

    const [sleepGoalHours, setSleepGoalHours] = useState<number | null>(null);
    const [stepsGoal, setStepsGoal] = useState<number | null>(null);

    const stepsToday =
    Number.isFinite(health?.stepsToday) ? Math.round(health.stepsToday) : 0;

    const sleepToday =
    Number.isFinite(health?.sleepToday)
      ? Number(health.sleepToday).toFixed(1)
      : "0.0";

    const clampProgress = (actual: number, goal: number | null) => {
        if (!goal || goal <= 0) return 0;
        return Math.min(actual / goal, 1);
    };

    const formatStepsShort = (num: number) => {
        if (num >= 1000) {
            const value = num / 1000;
            return Number.isInteger(value) ? `${value}k` : `${value.toFixed(1)}k`;
        }
        return `${num}`;
    };
    
    const getSleepRingText = (actual: number, goal: number | null) => {
        if (!goal) return actual.toFixed(1);
        return actual >= goal ? `${actual.toFixed(1)}h` : `${actual.toFixed(1)}/${goal}h`;
    };
    
    const getStepsRingText = (actual: number, goal: number | null) => {
        if (!goal) return formatStepsShort(actual);
        return actual >= goal
            ? `${formatStepsShort(actual)}`
            : `${formatStepsShort(actual)}/${formatStepsShort(goal)}`;
    };

    async function fetchMetrics() {
        const response = await supabase
            .from('Metrics')
            .select('*')
            .eq('entry_id', entryId)
        if (response?.data?.[0]) {
            const d = response['data'][0]
            setSleep(d['sleep'])
            setActivity(d['activity'])
            setNutrition(d['nutrition'])
            setMoodStress(d['moodstress'])
        }
        else {
            setSleep('')
            setActivity('0')
            setNutrition('0')
            setMoodStress('0')
        }
    }
    async function fetchGoals() {
        if (!user?.id) return;
    
        try {
            const sleepGoalData = await getSleepGoal(user.id);
            const stepsGoalData = await getStepsGoal(user.id);
    
            setSleepGoalHours(
                sleepGoalData?.sleep_goal_hours != null
                    ? Number(sleepGoalData.sleep_goal_hours)
                    : null
            );
    
            setStepsGoal(
                stepsGoalData?.steps_goal != null
                    ? Number(stepsGoalData.steps_goal)
                    : null
            );
        } catch (error) {
            console.log("Failed to fetch goal data:", error);
            setSleepGoalHours(null);
            setStepsGoal(null);
        }
    }

    useEffect(() => {
        fetchMetrics()
    }, [entryId]);

    useEffect(() => {
        fetchGoals();
    }, [user?.id]);

    return (
        <View style={style}>
            <View style={{
                flexDirection: 'row',
                paddingHorizontal: '1%',
                paddingVertical: '1%',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                {/* Sleep (clickable) */}
                <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 0 }}>
                    {sleepGoalHours ? (
                        <DashboardGoalRing
                            label="Sleep"
                            valueText={getSleepRingText(Number(sleepToday), sleepGoalHours)}
                            progress={clampProgress(Number(sleepToday), sleepGoalHours)}
                            color="#187498"
                            onPress={() =>
                                router.push({
                                    pathname: "/health-details",
                                    params: { type: "sleep" },
                                } as any)
                            }
                            />
                         ) : (
                            <Pressable
                                onPress={() =>
                                    router.push({
                                        pathname: "/health-details",
                                        params: { type: "sleep" },
                                    } as any)
                                }
                            >
                                <Sleep value={sleepToday} />
                            </Pressable>
                        )}
                </View>
                <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 0 }}>
                    <Activity value={activity}/>
                </View>
                {/* Steps (clickable) — replacing the old Nutrition slot */}
                <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 0 }}>
                    {stepsGoal ? (
                        <DashboardGoalRing
                            label="Steps"
                            valueText={getStepsRingText(stepsToday, stepsGoal)}
                            progress={clampProgress(stepsToday, stepsGoal)}
                            color="#F9D923"
                            onPress={() =>
                                router.push({
                                    pathname: "/health-details",
                                    params: { type: "steps" },
                                } as any)
                            }
                        />
                    ) : (
                        <Pressable
                            onPress={() =>
                                router.push({
                                    pathname: "/health-details",
                                    params: { type: "steps" },
                                } as any)
                            }
                        >
                            <Steps value={String(stepsToday)} />
                        </Pressable>
                    )}
                </View>

                <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 0 }}>
                    <MoodStress value={moodstress}/>
                </View>
            </View>
        </View>
    );
}


interface MetricItemProps {
    circleLabel: string,
    label: string,
    color?: string
}


function MetricItem({ circleLabel, label, color }: MetricItemProps) {
    return (
        <View style={{
            alignItems: 'center'
        }}>
            <View style={[styles.circle, {
                borderColor: color
            }]}>
                <Text style={styles.circleLabel}>
                    {circleLabel}
                </Text>
            </View>
            <Text style={{
                fontSize: 17
            }}>
                {label}
            </Text>
        </View>
    );
}


interface SleepProps {
    value?: string
}


function Sleep({ value = "" }: SleepProps) {
    return (
        <MetricItem circleLabel={value} label="Sleep" color="#187498"/>
    )
}

interface ActivityProps {
    value?: string
}


function Activity({ value = "" }: ActivityProps) {
    return (
        <MetricItem circleLabel={value} label="Activity" color="#36AE7C"/>
    )
}


interface StepsProps {
    value?: string
}


function Steps({ value = "" }: StepsProps) {
    return (
        <MetricItem circleLabel={value} label="Steps" color="#F9D923"/>
    )
}


interface MoodStressProps {
    value?: string
}


function MoodStress({ value = "" }: MoodStressProps){
    return (
        <MetricItem circleLabel={value} label="Mood" color="#EB5353"/>
    )
}


const styles = StyleSheet.create({
    circle: {
        width: 80, 
        height: 80,
        borderRadius: 40, // 80 / 2 = 40
        borderWidth: 4, 
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white', 
    },
    circleLabel: {
        fontSize: 16
    }
});