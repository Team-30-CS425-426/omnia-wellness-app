import React from 'react'
import { Link, router } from 'expo-router';
import {StyleSheet, Alert, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUser } from '../../contexts/UserContext';
import { getAuthErrorMessage } from '../../utils/authErrors';

import ThemedView from '../components/ThemedView'
import ThemedText from '../components/ThemedText'
import ThemedTextInput from '../components/ThemedTextInput'
import Spacer from '../components/Spacer'
import ThemedButton from '../components/ThemedButton'


/*
Currently a minimalistic HomePage with placeholders
*/

export default function HomePage() {
    return (
        <ThemedView>
            <Title/>
            <WellnessDashboards/>
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
    )
}

function Title() {
    return (
        <ThemedText>Omnia</ThemedText>
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
            <ThemedText>Key Stats</ThemedText>
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
            <ThemedText>Protein Intake is very low - Try adding a high protein snack</ThemedText>
            <ThemedText>Reduced deep sleep last night may affect your endurance today. Consider lighter training.</ThemedText>
        </>
    )
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
    )
}

function Nutrition() {
    return (
        <>
            <ThemedText>1,450</ThemedText>
            <ThemedText>Nutrition</ThemedText>
        </>
    )
}

function MoodStress(){
    return (
        <>
            <ThemedText>8.2</ThemedText>
            <ThemedText>Mood/Stress</ThemedText>
        </>
    )
}

function SleepQuality() {
    return (
        <>
            <ThemedText>Sleep Quality</ThemedText>
            <ThemedText>6 hours</ThemedText>
        </>
    )
}

function Steps() {
    return (
        <>
            <ThemedText>Steps</ThemedText>
            <ThemedText>5,340</ThemedText>
        </>
    )
}

function Mood() {
    return (
        <>
            <ThemedText>Mood</ThemedText>
            <ThemedText>Low</ThemedText>
        </>
    )
}

function Habits() {
    return (
        <>
            <ThemedText>Habits</ThemedText>
            <ThemedText>3 of 4</ThemedText>
        </>
    )
}

function Calories() {
    return (
        <>
            <ThemedText>Calories</ThemedText>
            <ThemedText>1,450</ThemedText>
        </>
    )
}

