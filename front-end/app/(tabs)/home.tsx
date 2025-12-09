import { supabase } from "@/config/homeSupabaseConfig";
import { useEffect, useState } from "react";
import { StyleProp, Text, View, ViewStyle, StyleSheet, ScrollView } from "react-native";
import { Dropdown } from "react-native-element-dropdown";


export default function HomeScreen() {
    return (
        <ScrollView style={{
            flex: 1,
            paddingHorizontal: '5%',
            paddingTop: '15%',
            backgroundColor: 'white'
        }}>
            <Title style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingVertical: 20
            }}/>
            <WellnessDashboards style={{
                flex: 9,
                gap: 20,
                marginBottom: '30%'
            }}/>
        </ScrollView>
    );
}


interface TitleProps {
    style?: StyleProp<ViewStyle>
}


function Title({ style }: TitleProps) {
    return (
        <View style={style}>
            <Text style={{
                fontSize: 30,
                fontFamily: 'serif'
            }}>O M N I A</Text>
        </View>
    )
}


interface WellnessDashboardsProps {
    style?: StyleProp<ViewStyle>
}


type DailyEntry ={
    id: string,
    created_at: string,
    datetime: string
}


function WellnessDashboards({ style }: WellnessDashboardsProps) {
    const [entryId, setEntryId] = useState(null)
    const [dropdownItems, setDropdownItems] = useState<DailyEntry[]>([])

    async function fetchDailyEntries() {
        const response = await supabase
            .from('DailyEntries')
            .select()
        if (response['error']) {
            console.log(JSON.stringify(response['error']))
            return
        }
        else {
            setDropdownItems(response['data'])
        }
    }
    useEffect(() => {
        fetchDailyEntries()
    }, [])
    return (
        <View style={style}>
            <Text>{entryId}</Text>
            <View>
                <Text style={{
                    fontFamily: 'timesnewroman',
                    fontWeight: 'bold',
                    fontSize: 20,
                }}>
                    Wellness Dashboards
                </Text>
            </View>
            <DateDropDown
                data={dropdownItems} 
                entryId={entryId}
                setEntryId={setEntryId}
            />
            <Metrics style={{
                gap: 20
            }}/>
            <KeyStats style={{
                gap: 20
            }}/>
            <Insights style={{
                gap: 20
            }}/>
        </View>
    )
}


interface MetricsProps {
    style?: StyleProp<ViewStyle>
}


function Metrics({ style }: MetricsProps) {
    return (
        <View style={style}>
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


interface DateDropDownProps {
    entryId: any,
    setEntryId: React.Dispatch<React.SetStateAction<any>>
    style?: StyleProp<ViewStyle>,
    data?: DailyEntry[]
}


function DateDropDown({ entryId, setEntryId, style, data = [{
        datetime: 'Oct 30, 2025', 
        created_at: '',
        id: '-1'
    }]
}: DateDropDownProps) {
    const [value, setValue] = useState(
        data.length > 0 ? data[0].id : null
    )
    function handleOnChange(item: any) {
        setValue(item.id)
        setEntryId(item.id)
    }
    return (
        <Dropdown
            placeholder="Select..."
            data={data}
            labelField="datetime"
            valueField="id"
            value={value}
            onChange={handleOnChange}
        />
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


interface KeyStatsProps {
    style?: StyleProp<ViewStyle>
}


function KeyStats({ style }: KeyStatsProps) {
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
                <SleepQuality/>
                <Steps/>
                <Mood/>
                <Habits/>
                <Calories/>
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

function SleepQuality() {
    return (
        <KeyStatsItem label="Sleep Quality" content="6 hours"/>
    )
}

function Steps() {
    return (
        <KeyStatsItem label="Steps" content="5340"/>
    )
}

function Mood() {
    return (
        <KeyStatsItem label="Mood" content="Low"/>
    )
}

function Habits() {
    return (
        <KeyStatsItem label="Habits" content="3 of 4"/>
    )
}

function Calories() {
    return (
        <KeyStatsItem label="Calories" content="1450"/>
    )
}


interface InsightsProps {
    style?: StyleProp<ViewStyle>
}


function Insights({ style }: InsightsProps) {
    return (
        <View style={style}>
            {/* Insights Title */}
            <Text style={{
                fontSize: 20,
                fontFamily: 'times'
            }}>
                Insights
            </Text>

            {/* Body */}
            <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 20
            }}>
                <InsightsItem content="Protein Intake is very low - Try adding a high protein snack"/>
                <InsightsItem content="Reduced deep sleep last night may affect your endurance today. Consider lighter training."/>        
            </View>
        </View>
    )
}


interface InsightsItemProps {
    content?: string
}


function InsightsItem({ content }: InsightsItemProps) {
    return (
        <View style={{
            borderWidth: 1,
            backgroundColor: 'lightgrey',
            width: 200,
            padding: 10
        }}>
            <Text style={{ fontSize: 16 }}>{content}</Text>
        </View>
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
