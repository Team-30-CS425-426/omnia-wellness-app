import React, { useState } from 'react';
import {StyleSheet, 
        ScrollView,
        View,
        Button,
        ActivityIndicator,
} from 'react-native';
import {Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUser } from '../../contexts/UserContext';

import ThemedView from '../components/ThemedView';
import ThemedText from '../components/ThemedText';

import useHealthData from '@/src/hooks/useHealthData';
import { QuoteScreenContent } from '../quote';

/*
Currently a minimalistic HomePage with placeholders
*/

export default function HomePage() {
    const insets = useSafeAreaInsets();
    const totalTopPadding = insets.top + 20;

    const {user, loading: userLoading} = useUser();
    const {
        loading: healthLoading,
        error,
        steps7d,
        sleep7d,
        connectAndImport,
    } = useHealthData();

    const [showQuoteSplash, setShowQuoteSplash] = useState(true);

    if (userLoading){
        return <ThemedText>Loading...</ThemedText>;
    }

    if (!user){
        return <Redirect href = "/" />;
    }

    if (showQuoteSplash) {
        return (
            <QuoteScreenContent
            onDone={() => {
                setShowQuoteSplash(false);
            }}
            />
        );
    }
   
    return (
        <ThemedView style = {[
            styles.container, 
            {paddingTop : totalTopPadding, paddingBottom: insets.bottom + 20}
            ]} >
                <ScrollView contentContainerStyle = {styles.scrollContent}>
                <Title/>
                <WellnessDashboards/>
                <View style ={styles.section}>
                    <ThemedText style = {styles.sectionTitle}>
                        Apple Health (FR2 demo)
                    </ThemedText>
                    <Button
                        title=" Connect & import 7 days"
                        onPress={connectAndImport}
                    />
                </View>
                {healthLoading && <ActivityIndicator style={styles.spacing} />}
                {error && (
                    <ThemedText style={[styles.spacing, styles.error]}>
                        {error}
                    </ThemedText>
                )}
                {steps7d.length > 0 && (
                    <View style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>
                            Steps (last 7 days)
                        </ThemedText>
                        {steps7d.map((d:any) => (
                            <ThemedText key={d.startDate}>
                                {d.startDate.slice(0,10)}: {Math.round(d.value)} steps
                            </ThemedText>
                        ))}
                    </View>
                )}
                {sleep7d.length > 0 && (
                    <View style={styles.section}>
                        <ThemedText style ={styles.sectionTitle}>
                            Sleep samples (last 7 days)
                        </ThemedText>
                        <ThemedText>{sleep7d.length} samples</ThemedText>
                    </View>
                )}
                </ScrollView>
        </ThemedView>
    );
}

function WellnessDashboards() {
    return (
        <>
            <ThemedText>Wellness Dashboards</ThemedText>
            <Metrics/>
            <KeyStats/>
            <Insights/>
        </>
    );
}

function Title() {
    return (
        <ThemedText>Omnia</ThemedText>
    );
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
    );
}

function KeyStats() {
    return (
        <>
            <ThemedText>Key Stats</ThemedText>
            <SleepQuality/>
            <Steps/>
            <Mood/>
            <Habits/>
            <Calories/>
        </>
        
    );
}

function Insights() {
    return (
        <>
            <ThemedText>Protein Intake is very low - Try adding a high protein snack</ThemedText>
            <ThemedText>Reduced deep sleep last night may affect your endurance today. Consider lighter training.</ThemedText>
        </>
    );
}

function DateDropDown() {
    return (
        <>
            <ThemedText>Oct 30, 2025</ThemedText>
        </>
    )
}

function Sleep() {
    return (
        <>
            <ThemedText>6h</ThemedText>
            <ThemedText>Sleep</ThemedText>
        </>
    )
}

function Activity() {
    return (
        <>
            <ThemedText>45</ThemedText>
            <ThemedText>Activity</ThemedText>
        </>
    );
}

function Nutrition() {
    return (
        <>
            <ThemedText>1,450</ThemedText>
            <ThemedText>Nutrition</ThemedText>
        </>
    );
}

function MoodStress(){
    return (
        <>
            <ThemedText>8.2</ThemedText>
            <ThemedText>Mood/Stress</ThemedText>
        </>
    );
}

function SleepQuality() {
    return (
        <>
            <ThemedText>Sleep Quality</ThemedText>
            <ThemedText>6 hours</ThemedText>
        </>
    );
}

function Steps() {
    return (
        <>
            <ThemedText>Steps</ThemedText>
            <ThemedText>5,340</ThemedText>
        </>
    );
}

function Mood() {
    return (
        <>
            <ThemedText>Mood</ThemedText>
            <ThemedText>Low</ThemedText>
        </>
    );
}

function Habits() {
    return (
        <>
            <ThemedText>Habits</ThemedText>
            <ThemedText>3 of 4</ThemedText>
        </>
    );
}

function Calories() {
    return (
        <>
            <ThemedText>Calories</ThemedText>
            <ThemedText>1,450</ThemedText>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex:1,
    },
    scrollContent:{
        alignItems:'center',
        paddingHorizontal: 20,
    },
    spacing: {
        marginTop:16,
    },
    error:{
        color: 'red',
    },
    section: {
        marginTop: 24,
        marginBottom: 16,
        alignSelf: 'stretch',
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginBottom: 8,
    },
    
});


