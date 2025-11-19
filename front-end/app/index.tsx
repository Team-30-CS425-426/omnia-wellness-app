import React, {useState} from 'react'
import { Link } from 'expo-router';
import {StyleSheet, Text, View, Button, TextInput } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ThemedView from './components/ThemedView'
import ThemedText from './components/ThemedText'
import ThemedTextInput from './components/ThemedTextInput'
import Spacer from './components/Spacer'
import ThemedButton from './components/ThemedButton'

const Home = () => {
    const insets = useSafeAreaInsets();
    
    const totalTopPadding = insets.top;

    return (
        <ThemedView style = {[styles.container, {paddingTop : totalTopPadding, paddingBottom: insets.bottom + 150}]}>

            <ThemedText title = {true}>Welcome to Omnia </ThemedText>
            <Spacer height={30} />

            <Link href = "/login">
                <ThemedText style = {{color : '#005BB5', fontSize: 18}}> Login </ThemedText>
            </Link>

            <Spacer height = {20} />
            <ThemedText title = {false}>Don't have an account?</ThemedText>

            <Spacer height = {5} />
            <Link href = "/register">
                <ThemedText style = {{color : '#005BB5'}}> Register Here </ThemedText>
            </Link>

        </ThemedView>
    )
}

export default Home

const styles = StyleSheet.create({
    container: {
        flex:1,
        alignItems:'center',
        justifyContent:'center'
    },
    subHeader:{ 
        fontWeight : '600',
        fontSize : 24,
    },
    
})