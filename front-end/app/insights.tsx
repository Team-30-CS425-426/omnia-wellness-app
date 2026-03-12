//Developed by Johan Ramirez
import React, {useState} from 'react'
import { Link, router } from 'expo-router';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator, ScrollView } from 'react-native';
import { useUser } from '../contexts/UserContext'


//import { onAuthStateChanged, signOut, User } from 'firebase/auth';
//import { auth } from '../config/firebaseConfig';

import ThemedView from './components/ThemedView'
import ThemedText from './components/ThemedText'
import ThemedTextInput from './components/ThemedTextInput'
import Spacer from './components/Spacer'
import ThemedButton from './components/ThemedButton'

const Insights = () => {

    const [insights, setInsights] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const insets = useSafeAreaInsets();
    const totalTopPadding = insets.top;
    const { user } = useUser();

    //const [user, setUser] = useState<User | null>(null);
    //const [loading, setLoading] = useState(true);
    const fetchInsights = async () => {
        setLoading(true);
        setError(null);
        setInsights(null);
      
        try {
          if (!user) throw new Error("Not logged in");
      
          const response = await fetch("https://omnia-wellness-app.onrender.com/insights", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user.id }),
          });
      
          if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`);
          }
      
          const data = await response.json();        // { insights: "<text from LLM>" }
          setInsights(data.insights);
        } catch (e: any) {
          console.error("Insights call error:", e);
          setError(e.message || "Could not load insights.");
        } finally {
          setLoading(false);
        }
      };

    return (
        <ThemedView style = {[styles.container, {paddingTop : totalTopPadding, paddingBottom: insets.bottom + 150}]}>
            <Pressable onPress={() => router.back()} style={{ marginBottom: 20 }}>
            <Ionicons name="arrow-back" size={24} color="black" />
            </Pressable>
            <ThemedText title = {true}>Test Insights Page </ThemedText>
            <Spacer height={30} />
            <ThemedButton onPress={fetchInsights} disabled={loading}>
            {loading ? "Generating..." : "Generate Insights"}
            </ThemedButton>
            <Spacer height={20} />
            {loading && <ActivityIndicator size="large" />}
            {error && <ThemedText style={{ color: 'red' }}>{error}</ThemedText>}
            {insights && (
                <ScrollView style={{ width: '100%', backgroundColor: '#f5f5f5', borderRadius: 12, padding: 16 }}>
                    <ThemedText>{insights}</ThemedText>
                </ScrollView>
)}
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
