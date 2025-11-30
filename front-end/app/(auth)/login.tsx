import React from 'react'
import { Link, router } from 'expo-router';
import {StyleSheet, Alert, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUser } from '../../contexts/UserContext';
import { getAuthErrorMessage } from '../../utils/authErrors';

import ThemedView from '../components/ThemedView'
import ThemedText from '../components/ThemedText'
import ThemedTextInput from '../components/ThemedTextInput'
import Spacer from '../components/Spacer'
import ThemedButton from '../components/ThemedButton'

const Login = () => {
    const { login } = useUser();

    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    
    const handleLogin = async () => {
        // 1. Basic Validation
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }
        setLoading(true);

        try {
        // 2. Attempt to Sign In
        await login(email, password);
        // Optional: You can remove this router.push if your AuthLayout 
        // automatically redirects users when they log in.
        router.push('/home'); 

    } catch (error: any) {
        // --- ⬇️ CHANGE THIS SECTION ⬇️ ---
        
        // Supabase errors usually come with a readable 'message' property
        const message = error.message || 'An unknown error occurred';
        
        // You no longer need 'getAuthErrorMessage(error.code)'
        Alert.alert('Login Failed', message);
        
        // --- ⬆️ END OF CHANGE ⬆️ ---

    } finally {
        setLoading(false);
    }
    };

    const insets = useSafeAreaInsets();
    
    const totalTopPadding = insets.top;

    return (
        <ThemedView style = {[styles.container, {paddingTop : totalTopPadding, paddingBottom: insets.bottom + 150}]}>
            
            <ThemedText title = {true}>Omnia </ThemedText>
            <Spacer height={30} />

            <ThemedText style = {[styles.subHeader]}> Login </ThemedText>
            <Spacer height={20} />

            <ThemedTextInput 
                placeholder = "Enter Your Email" 
                keyboardType = "email-address"
                onChangeText = {setEmail}
                value = {email}
                />
            <Spacer height={15} />

            <View style={{ width: '80%', alignSelf: 'center' }}> 
    
                {/* 2. Tell the Input to take up 100% of this wrapper */}
                <ThemedTextInput 
                    placeholder="Enter Your Password" 
                    secureTextEntry={true}
                    onChangeText={setPassword}
                    value={password}
                    style={{ width: '100%' }} // Ensure input fills the wrapper
                />

                {/* 3. Now 'flex-end' touches the exact right edge of the input */}
                <Link href="/resetPassword" style={{ alignSelf: 'flex-end', marginTop: 8 }}>
                    <ThemedText style={{ color: '#005BB5', fontSize: 12 }}>
                        Forgot Password?
                    </ThemedText>
                </Link>

            </View>

            <Spacer height={10} />
            <ThemedButton onPress={handleLogin} >
                <ThemedText style = {{color : 'white', textAlign : 'center', fontWeight : '600'}}> Sign In </ThemedText>
            </ThemedButton>

            <Spacer height = {20} />
            <ThemedText title = {false}>Don't have an account?</ThemedText>

            <Spacer height = {5} />
            <Link href = "/register">
                <ThemedText style = {{color : '#005BB5'}}> Register Here </ThemedText>
            </Link>

        </ThemedView>
    )
}

export default Login

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