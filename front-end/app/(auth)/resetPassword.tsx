// Developed by Johan Ramirez
import React from 'react'; 
import { Link, router } from 'expo-router';
import { StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUser } from '../../contexts/UserContext'; 

import ThemedView from '../components/ThemedView';
import ThemedText from '../components/ThemedText';
import ThemedTextInput from '../components/ThemedTextInput';
import Spacer from '../components/Spacer';
import ThemedButton from '../components/ThemedButton';

const ForgotPassword = () => {
    const [email, setEmail] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    // CALL THE CONTEXT
    const { resetPassword } = useUser();

    // Basic validation and submission after clicking submit
    const handleSubmit = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setLoading(true); 

        try {
            // Sends an email to reset password
            await resetPassword(email);
            
            Alert.alert(
                'Check Your Email', 
                'A link has been sent to reset your password.',
                [
                    { text: "OK", onPress: () => router.replace('/login') }
                ]
            );

        } catch (error: any) {
            const message = error.message || 'Failed to send reset email';
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


            {/* Email Input */}
            <ThemedTextInput 
                placeholder="Enter your account email" 
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={setEmail}
                value={email}
            />
            <Spacer height={15} />

            {/* Submit Button */}
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

            {/* Login Button */}
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
        justifyContent: 'center' 
    },
    subHeader: { 
        fontWeight: '600',
        fontSize: 24,
    },
});