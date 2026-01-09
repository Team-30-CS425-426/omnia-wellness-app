//Developed by Johan Ramirez
import React, { useState } from 'react';
import { Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../config/supabaseConfig'; 
import { useUser } from '../../contexts/UserContext';

import ThemedView from '../components/ThemedView'; 
import ThemedText from '../components/ThemedText';
import ThemedTextInput from '../components/ThemedTextInput';
import Spacer from '../components/Spacer';
import ThemedButton from '../components/ThemedButton';


export default function SetupNameScreen() {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, setOnboardedStatus } = useUser();

  const handleSaveName = async () => {
    // Validation Change: Only check for essential data (user existence)
    if (!user) {
        Alert.alert('Error', 'User data missing. Please log in again.');
        return;
    }
    
    // We intentionally skip checking if name is empty to allow empty string submission.

    setIsSubmitting(true);
    const userID = user?.id;
    console.log("UPDATING USER IN SUPABASE")
    console.log("USERID: ", userID)
    console.log("➡️ NAME VALUE SENT TO SUPABASE:", name);

    try {
      const response = await supabase
        .from('User') 
        .update({ 
            name: name,
            onboarded: true 
        }) 
        .eq('id', user.id); // Update the correct user profile

      const { error } = response;
      
      console.log("UPDATE COMPLETE")
      
      console.log("Full Supabase API Response:", response)

      if (error) {
        Alert.alert('Error', 'Failed to save profile. Please try again.');
        console.error('Supabase update error:', error);
        return;
      }
  
      setOnboardedStatus(true);

      router.replace('/(tabs)/home')

    } catch (e) {
      Alert.alert('Error', 'An unexpected error occurred.');
      console.error('SetupNameScreen Exception:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText title={true} style={styles.header}>Welcome Oboard Omnia!</ThemedText>
      <Spacer height={10} />
      <ThemedText style={styles.subHeader}>Just one more step: what should we call you?</ThemedText>
      <Spacer height={40} />
      
      <ThemedTextInput
        placeholder="Your Name (optional)"
        value={name}
        onChangeText={setName}
        autoFocus={true}
        style={styles.input}
        editable={!isSubmitting}
      />
      
      <Spacer height={20} />
      
      <ThemedButton 
        onPress={handleSaveName} 
        // Validation updated: Only disabled if submitting
        disabled={isSubmitting} 
      >
        {isSubmitting ? (
            <ActivityIndicator color="white" />
        ) : (
            <ThemedText style={{ 
                color: 'white', 
                textAlign: 'center', 
                fontWeight: '600' 
            }}>
                Get Started
            </ThemedText>
        )}
      </ThemedButton>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    subHeader: {
        fontSize: 16,
        textAlign: 'center',
    },
    input: {
        width: '100%',
        fontSize: 18,
    },
    indicator: {
        marginTop: 20,
    }
});
