import { useContext, useEffect, useState } from "react";
import { StyleProp, Text, View, ViewStyle } from "react-native";
import { EntryContext } from "./dashboard";
import { supabase } from "@/config/homeSupabaseConfig";


interface KeyStatsProps {
    style?: StyleProp<ViewStyle>
}


export function KeyStats({ style }: KeyStatsProps) {
    const { entryId } = useContext(EntryContext)
    const [sleepQuality, setSleepQuality] = useState("NaN")
    const [steps, setSteps] = useState("NaN")
    const [mood, setMood] = useState("NaN")
    const [habits, setHabits] = useState("NaN")
    const [calories, setCalories] = useState("NaN")

    async function fetchKeyStats() {
        const response = await supabase
            .from('KeyStats')
            .select('*')
            .eq('entry_id', entryId)
        if (response?.data?.[0]) {
            const d = response['data'][0]
            setSleepQuality(d['sleepquality'])
            setSteps(d['steps'])
            setMood(d['mood'])
            setHabits(d['habits'])
            setCalories(d['calories'])
        }
        else {
            setSleepQuality('NaN')
            setSteps('NaN')
            setMood('NaN')
            setHabits('NaN')
            setCalories('NaN')
        }
    }

    useEffect(() => {
        fetchKeyStats()
    }, [entryId])
    return (
        <View style={style}>
            <Text style={{
                fontFamily: 'times',
                fontSize: 20
            }}>
                Key Stats
            </Text>
            <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 20
            }}>
                <SleepQuality value={sleepQuality}/>
                <Steps value={steps}/>
                <Mood value={mood}/>
                <Habits value={habits}/>
                <Calories value={calories}/>
            </View>
        </View>
        
    );
}


interface KeyStatsItemProps {
    label?: string,
    content?: string
}


function KeyStatsItem({ label, content }: KeyStatsItemProps) {
    return (
        <View style={{
            borderWidth: 1,
            backgroundColor: 'lightgrey',
            height: 60,
            width: 120,
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <Text style={{fontSize: 16}}>{label}</Text>
            <Text style={{fontSize: 16}}>{content}</Text>
        </View>
    )
}


interface SleepQualityProps {
    value?: string
}


function SleepQuality({ value = "" }: SleepQualityProps) {
    return (
        <KeyStatsItem label="Sleep Quality" content={value}/>
    )
}


interface StepsProps {
    value?: string
}


function Steps({ value = "" }: StepsProps) {
    return (
        <KeyStatsItem label="Steps" content={value}/>
    )
}


interface MoodProps {
    value?: string
}


function Mood({ value = "" }: MoodProps) {
    return (
        <KeyStatsItem label="Mood" content={value}/>
    )
}


interface HabitsProps {
    value?: string
}


function Habits({ value = "" }: HabitsProps) {
    return (
        <KeyStatsItem label="Habits" content={value}/>
    )
}


interface CaloriesProps {
    value?: string
}


function Calories({ value = "" }: CaloriesProps) {
    return (
        <KeyStatsItem label="Calories" content={value}/>
    )
}