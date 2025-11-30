import React, { useEffect } from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '../../contexts/UserContext';
import ThemedView from '../components/ThemedView';
import ThemedText from '../components/ThemedText';
import ThemedButton from '../components/ThemedButton';
import Spacer from '../components/Spacer';

const EmailVerified = () => {
    const router = useRouter();
    const { user } = useUser();

    return (
        <ThemedView style={styles.container}>
            <ThemedText title={true}> Email Verified!</ThemedText>
            
            <Spacer height={20} />

            {/* ✅ CORRECT: Check 'user' inside the render block */}
            {user ? (
                <ThemedButton onPress={() => router.replace('/home')}>
                    <ThemedText style={{color: 'white', fontWeight: 600}}>Home</ThemedText>
                </ThemedButton>
            ) : (
                <>
                    <ThemedText style={styles.subtitle}>Verifying...</ThemedText>
                    <ActivityIndicator size="large" style={{ marginTop: 20 }} />
                </>
            )}
        </ThemedView>
    );
};

export default EmailVerified;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 10,
    }
});