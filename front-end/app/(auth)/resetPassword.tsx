import React, { useState } from 'react'; // clean up imports
import { Link, router } from 'expo-router';
import { StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebaseConfig';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getAuthErrorMessage } from '../utils/authErrors';

import ThemedView from '../components/ThemedView';
import ThemedText from '../components/ThemedText';
import ThemedTextInput from '../components/ThemedTextInput';
import Spacer from '../components/Spacer';
import ThemedButton from '../components/ThemedButton';

const ForgotPassword = () => {
    // 1. Cleanup: Removed password/confirmPassword state (not needed here)
    const [email, setEmail] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async () => {
        // Validation
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setLoading(true); 

        try {
            // Talk to Firebase
            await sendPasswordResetEmail(auth, email);
            
            // Success!
            Alert.alert(
                'Check Your Email', 
                'A link has been sent to reset your password.',
                [
                    { text: "OK", onPress: () => router.replace('/login') }
                ]
            );

        } catch (error: any) {
            console.log(error.code); // Helpful for debugging
                        
            const message = getAuthErrorMessage(error.code);
            Alert.alert('Reset Failed', message);
            } finally {
            setLoading(false);
        }
    };

    const insets = useSafeAreaInsets();
    const totalTopPadding = insets.top;

    return (
        <ThemedView style={[styles.container, { paddingTop: totalTopPadding + 100, paddingBottom: insets.bottom + 50 }]}>
            
            <ThemedText style={[styles.subHeader]}> Reset Your Password </ThemedText>
            <Spacer height={30} />

            <ThemedTextInput 
                placeholder="Enter your account email" 
                keyboardType="email-address"
                autoCapitalize="none" // Important for emails
                onChangeText={setEmail}
                value={email}
            />
            <Spacer height={15} />

            <Spacer height={10} />
            <ThemedButton onPress={handleSubmit} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <ThemedText style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
                        Reset Password
                    </ThemedText>
                )}
            </ThemedButton>

             <Spacer height={20} />
            <Link href="/login">
                <ThemedText style={{ color: '#005BB5' }}> Login </ThemedText>
            </Link>

        </ThemedView>
    );
}

export default ForgotPassword;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center' // I added this back so it centers vertically
    },
    subHeader: { 
        fontWeight: '600',
        fontSize: 24,
    },
});