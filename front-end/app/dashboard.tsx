import React, {useState} from 'react'
import { Link } from 'expo-router';
import {StyleSheet, Text, View, Button, TextInput } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ThemedView from './components/ThemedView'
import ThemedText from './components/ThemedText'
import ThemedTextInput from './components/ThemedTextInput'
import Spacer from './components/Spacer'
import ThemedButton from './components/ThemedButton'

const dashboard = () => {

    const insets = useSafeAreaInsets();
    const totalTopPadding = insets.top;

  return (
    <ThemedView style = {[styles.container, {paddingTop : totalTopPadding, paddingBottom: insets.bottom + 150}]}>
      <ThemedText title = {true}>dashboard</ThemedText>
    </ThemedView>
  )
}

export default dashboard

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