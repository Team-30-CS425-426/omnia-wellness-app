//Developed by Johan Ramirez
import React, {useState} from 'react'
import { Link, router } from 'expo-router';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context';

//import { onAuthStateChanged, signOut, User } from 'firebase/auth';
//import { auth } from '../config/firebaseConfig';

import ThemedView from './components/ThemedView'
import ThemedText from './components/ThemedText'
import ThemedTextInput from './components/ThemedTextInput'
import Spacer from './components/Spacer'
import ThemedButton from './components/ThemedButton'

const Insights = () => {
    const insets = useSafeAreaInsets();
    const totalTopPadding = insets.top;

    //const [user, setUser] = useState<User | null>(null);
    //const [loading, setLoading] = useState(true);

    return (
        <ThemedView style = {[styles.container, {paddingTop : totalTopPadding, paddingBottom: insets.bottom + 150}]}>
            <Pressable onPress={() => router.back()} style={{ marginBottom: 20 }}>
            <Ionicons name="arrow-back" size={24} color="black" />
            </Pressable>
            <ThemedText title = {true}>Test Insights Page </ThemedText>
            <Spacer height={30} />
        </ThemedView>
    )
}

export default Insights

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
