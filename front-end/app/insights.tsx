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
import ThemedCard from './components/ThemedCard';
import { Colors } from '../constants/Colors';

const Insights = () => {

  type Insight= {
    title: string;
    body: string;
} 
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const insets = useSafeAreaInsets();
    const totalTopPadding = insets.top;
    const { user } = useUser();
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    

    //const [user, setUser] = useState<User | null>(null);
    //const [loading, setLoading] = useState(true);
    const fetchInsights = async () => {
        setLoading(true);
        setError(null);
        setInsights([]);
      
        try {
          if (!user) throw new Error("Not logged in");
          console.log("User is logged in, making backend call to generate insights");
          const response = await fetch("https://omnia-wellness-app.onrender.com/insights", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user.id }),
          });
      
          if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`);
          }
          
          const data = await response.json();        // { insights: "<text from LLM>" }
          console.log(data);

          const apiInsights = data.insights;

          if (Array.isArray(apiInsights)) {
            setInsights(apiInsights);                           // [{ title, body }, ...]
          } else if (typeof apiInsights === "string") {
            // Fallback: wrap a single string insight into one card
            setInsights([{ title: "Weekly Insights", body: apiInsights }]);
          } else {
            setInsights([]); 
        }
        } catch (e: any) {
          console.error("Insights call error:", e);
          setError(e.message || "Could not load insights.");
        } finally {
          setLoading(false);
        }
      };

      return (
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top +10,
            paddingBottom: insets.bottom,
            paddingHorizontal: 16,
          }}
          style={{ backgroundColor: 'white' }}
        >
          <ThemedView>
              {/* Header */}
              <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.headerLeft}>
                  <ThemedText style={[styles.backChevron, { color: 'black' }]}>‹</ThemedText>
                  <ThemedText style={[styles.backText, { color: 'black' }]}>Back</ThemedText>
                </Pressable>
                <ThemedText
                  style={styles.headerTitle}
                  gradient
                  gradientColors={[Colors.default.successGreen, Colors.default.strongGreen]}
                >
                  Insights
                </ThemedText>
                <View style={{ width: 60 }} />
              </View>
            <ThemedButton color={Colors.default.successGreen} onPress={fetchInsights} disabled={loading}>
              {loading ? "Generating..." : "Generate Insights"}
            </ThemedButton>
    
            <Spacer height={20} />
            {loading && <ActivityIndicator size="large" />}
            {error && <ThemedText style={{ color: 'red' }}>{error}</ThemedText>}
    
            {insights.length > 0 &&
          insights.map((item, idx) => {
            const isExpanded = expandedIndex === idx;
            return (
              <ThemedCard
                key={idx}
                onPress={() =>
                  setExpandedIndex(isExpanded ? null : idx)
                }
                style={{
                  marginTop: 9,
                  padding: 16,
                  borderRadius: 16,
                  width: '100%',
                  justifyContent: 'flex-start',
                  alignItems: 'flex-start',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.05,
                  shadowRadius: 6,
                  elevation: 4,
                }}
              >
                <ThemedText
                  style={{ fontWeight: '600', fontSize: 16, marginBottom: isExpanded ? 8 : 0, color: "#47a647" }}
                >
                  {item.title}
                </ThemedText>

                {isExpanded && (
                  <ThemedText style={{ fontSize: 14, color: Colors.default.darkGray }}>
                    {item.body}
                  </ThemedText>
                )}
              </ThemedCard>
            );
          })}
          </ThemedView>
        </ScrollView>
      );
}

export default Insights

const styles = StyleSheet.create({
    container: {
        flex:1,
        alignItems:'center',
        justifyContent:'flex-start'
    },
    subHeader:{ 
        fontWeight : '600',
        fontSize : 24,
    },
    header: {
      height: 40,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',  // centers title between left + right
    },
    headerMain: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
    },
    backChevron: {
      fontSize: 28,
      lineHeight: 28,
      fontWeight: '400',
    },
    backText: {
      fontSize: 17,
      fontWeight: '500',
    },
    headerTitle: {
      fontSize: 36,
      fontWeight: '700',
      lineHeight: 40,
      textAlign: 'center',
  },
    
})
