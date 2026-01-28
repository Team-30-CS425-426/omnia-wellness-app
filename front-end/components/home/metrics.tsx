import { useContext, useEffect, useState } from "react"
import { StyleProp, StyleSheet, Text, View, ViewStyle, Pressable } from "react-native";
import { router } from "expo-router";
import { EntryContext } from "./dashboard"
import { supabase } from "@/config/homeSupabaseConfig"

interface MetricsProps {
    style?: StyleProp<ViewStyle>;
    health: any;
}


export function Metrics({ style, health  }: MetricsProps) {
    const { entryId } = useContext(EntryContext)
    const [sleep, setSleep] = useState("NaN")
    const [activity, setActivity] = useState("NaN")
    const [nutrition, setNutrition] = useState("NaN")
    const [moodstress, setMoodStress] = useState("NaN")

    const stepsToday =
    Number.isFinite(health?.stepsToday) ? Math.round(health.stepsToday) : 0;

    const sleepToday =
    Number.isFinite(health?.sleepToday)
      ? Number(health.sleepToday).toFixed(1)
      : "0.0";

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
            setSleep('NaN')
            setActivity('NaN')
            setNutrition('NaN')
            setMoodStress('NaN')
        }
    }

    useEffect(() => {
        fetchMetrics()
    }, [entryId])

    return (
        <View style={style}>
            <View style={{
                flexDirection: 'row',
                borderWidth: 1,
                backgroundColor: 'lightgrey',
                padding: '1%',
                justifyContent: 'space-evenly'
            }}>
                
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
                <Activity value={activity}/>
                <Nutrition value={nutrition}/>
                <MoodStress value={moodstress}/>
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
                <Text style={{
                    fontSize: 17
                }}>
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
        <MetricItem circleLabel={value} label="Sleep" color="blue"/>
    )
}

interface ActivityProps {
    value?: string
}


function Activity({ value = "" }: ActivityProps) {
    return (
        <MetricItem circleLabel={value} label="Activity" color="green"/>
    )
}


interface NutritionProps {
    value?: string
}


function Nutrition({ value = "" }: NutritionProps) {
    return (
        <MetricItem circleLabel={value} label="Nutrition" color="orange"/>
    )
}


interface MoodStressProps {
    value?: string
}


function MoodStress({ value = "" }: MoodStressProps){
    return (
        <MetricItem circleLabel={value} label="Mood/Stress" color="red"/>
    )
}


const styles = StyleSheet.create({
    circle: {
        width: 60, 
        height: 60,
        borderRadius: 30, // 80 / 2 = 40
        borderWidth: 4, 
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'lightgrey', 
    },
    circleLabel: {
        fontSize: 16
    }
});