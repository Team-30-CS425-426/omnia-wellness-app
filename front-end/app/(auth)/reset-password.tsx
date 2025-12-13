// Developed by Johan Ramirez
import React, { useState } from 'react';
import { StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUser } from '../../contexts/UserContext';
import ThemedView from '../components/ThemedView';
import ThemedText from '../components/ThemedText';
import ThemedTextInput from '../components/ThemedTextInput';
import Spacer from '../components/Spacer';
import ThemedButton from '../components/ThemedButton';


const UpdatePassword = () => {
    const router = useRouter();
    const { updateUserPassword } = useUser();
    const insets = useSafeAreaInsets();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUpdate = async () => {
        // Validation
        if (!password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in both fields.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match.');
            return;
        }
        if (password.length < 6) {
             Alert.alert('Error', 'Password should be at least 6 characters.');
             return;
        }

        setLoading(true);

        try {
            // Try to update the user's password
            await updateUserPassword(password);
            
            Alert.alert(
                'Success', 
                'Your password has been updated!',
                [
                    { 
                        text: 'Go Home', 
                        // The user is already logged in, so we send them to the App
                        onPress: () => router.replace('/home') 
                    }
                ]
            );

        } catch (error: any) {
            Alert.alert('Update Failed', error.message || 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemedView style={[styles.container, { paddingTop: insets.top + 50, paddingBottom: insets.bottom + 50 }]}>
            
            <ThemedText title={true}>New Password</ThemedText>
            <Spacer height={10} />
            <ThemedText style={styles.subtitle}>Enter your new password below.</ThemedText>
            
            <Spacer height={40} />

            {/* New Password Field */}
            <ThemedTextInput 
                placeholder="New Password" 
                secureTextEntry={true}
                onChangeText={setPassword}
                value={password}
            />
            <Spacer height={20} />

            {/* Password Confirmation Fiel */}
            <ThemedTextInput 
                placeholder="Confirm New Password" 
                secureTextEntry={true}
                onChangeText={setConfirmPassword}
                value={confirmPassword}
            />

            <Spacer height={40} />

            {/* Update Password Button */}
            <ThemedButton onPress={handleUpdate} disabled={loading}>
                 {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <ThemedText style={{ color: 'white', fontWeight: '600', textAlign: 'center' }}>
                        Update Password
                    </ThemedText>
                )}
            </ThemedButton>

        </ThemedView>
    );
};

export default UpdatePassword;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center', // Centers content vertically
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    }
});