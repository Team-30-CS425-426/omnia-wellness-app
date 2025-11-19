import React from 'react'
import {StyleSheet, Text, View, Button } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ThemedView from './components/ThemedView'
import ThemedText from './components/ThemedText'
const home = () => {
    const insets = useSafeAreaInsets();
    const EXTRA_TOP_MARGIN = 100;

    const totalTopPadding = insets.top + EXTRA_TOP_MARGIN;

    return (
        <ThemedView style = {[styles.container, {paddingTop: totalTopPadding}]}>
            <ThemedText title = {true}>Welcome to the Omnia Wellness App</ThemedText>
            
        </ThemedView>
    )
}

export default home

const styles = StyleSheet.create({
    container: {
        flex:1,
        alignItems:'center',
        justifyContent:'space-between'
    },
    title: {
        fontWeight : 'bold',
        fontSize : 18
    },
    link: {
        marginVertical: 10,
        borderBottomWidth: 1,

    }
})