import { useContext, useEffect, useState } from "react"
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native"
import { EntryContext } from "./dashboard"
import { supabase } from "@/config/supabaseConfig"

interface MetricsProps {
    style?: StyleProp<ViewStyle>
}


export function Metrics({ style }: MetricsProps) {
    const { entryId } = useContext(EntryContext)
    const [sleep, setSleep] = useState(null)
    const [activity, setActivity] = useState(null)
    const [nutrition, setNutrition] = useState(null)
    const [moodstress, setMoodStress] = useState(null)
    // const [sleepQuality, setSleepQuality] = useState(null)
    // const [steps, setSteps] = useState(null)
    // const [mood, setMood] = useState(null)
    // const [habits, setHabits] = useState(null)
    // const [calories, setCalories] = useState(null)

    async function fetchMetrics() {
        const response: any = await supabase
            .from('Metrics')
            .select('*')
            .eq('entry_id', entryId)
        if (response['error']) {
            return
        }
        else {
            setSleep(response['data']['sleep'])
            setActivity(response['data']['activity'])
            setNutrition(response['data']['nutrition'])
            setMoodStress(response['data']['moodstress'])
        }
    }

    useEffect(() => {
        fetchMetrics()
    })

    return (
        <View style={style}>
            <Text>{sleep}</Text>
            <View style={{
                flexDirection: 'row',
                borderWidth: 1,
                backgroundColor: 'lightgrey',
                padding: '1%',
                justifyContent: 'space-evenly'
            }}>
                
                <Sleep/>
                <Activity/>
                <Nutrition/>
                <MoodStress/>
            </View>
        </View>
    )
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
    )
}


function Sleep() {
    return (
        <MetricItem circleLabel="6h" label="Sleep" color="blue"/>
    )
}


function Activity() {
    return (
        <MetricItem circleLabel="45" label="Activity" color="green"/>
    )
}


function Nutrition() {
    return (
        <MetricItem circleLabel="1450" label="Nutrition" color="orange"/>
    )
}


function MoodStress(){
    return (
        <MetricItem circleLabel="8.2" label="Mood/Stress" color="red"/>
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
})