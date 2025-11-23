import { Text, View } from "react-native";

/*
Currently a minimalistic HomePage with placeholders
*/

export default function HomePage() {
    return (
        <View>
            <Title/>
            <WellnessDashboards/>
        </View>
    );
}

function WellnessDashboards() {
    return (
        <>
            <Text>Wellness Dashboards</Text>
            <Metrics/>
            <KeyStats/>
            <Insights/>
        </>
    )
}

function Title() {
    return (
        <Text>Omnia</Text>
    )
}

function Metrics() {
    return (
        <>
            <DateDropDown/>
            <Sleep/>
            <Activity/>
            <Nutrition/>
            <MoodStress/>
        </>
    )
}

function KeyStats() {
    return (
        <>
            <Text>Key Stats</Text>
            <SleepQuality/>
            <Steps/>
            <Mood/>
            <Habits/>
            <Calories/>
        </>
        
    )
}

function Insights() {
    return (
        <>
            <Text>Protein Intake is very low - Try adding a high protein snack</Text>
            <Text>Reduced deep sleep last night may affect your endurance today. Consider lighter training.</Text>
        </>
    )
}

function DateDropDown() {
    return (
        <>
            <Text>Oct 30, 2025</Text>
        </>
    )
}

function Sleep() {
    return (
        <>
            <Text>6h</Text>
            <Text>Sleep</Text>
        </>
    )
}

function Activity() {
    return (
        <>
            <Text>45</Text>
            <Text>Activity</Text>
        </>
    )
}

function Nutrition() {
    return (
        <>
            <Text>1,450</Text>
            <Text>Nutrition</Text>
        </>
    )
}

function MoodStress(){
    return (
        <>
            <Text>8.2</Text>
            <Text>Mood/Stress</Text>
        </>
    )
}

function SleepQuality() {
    return (
        <>
            <Text>Sleep Quality</Text>
            <Text>6 hours</Text>
        </>
    )
}

function Steps() {
    return (
        <>
            <Text>Steps</Text>
            <Text>5,340</Text>
        </>
    )
}

function Mood() {
    return (
        <>
            <Text>Mood</Text>
            <Text>Low</Text>
        </>
    )
}

function Habits() {
    return (
        <>
            <Text>Habits</Text>
            <Text>3 of 4</Text>
        </>
    )
}

function Calories() {
    return (
        <>
            <Text>Calories</Text>
            <Text>1,450</Text>
        </>
    )
}

