import { StyleProp, Text, View, ViewStyle } from "react-native";


interface KeyStatsProps {
    style?: StyleProp<ViewStyle>
}


export function KeyStats({ style }: KeyStatsProps) {
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