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
        // Basic Validation
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }
        setLoading(true);

        try {
        // Attempt to Sign In
        await login(email, password);
        // On success, navigate to Home
        router.push('/home'); 

    } catch (error: any) {
      
        const message = error.message || 'An unknown error occurred';
        Alert.alert('Login Failed', message);

    } finally {
        setLoading(false);
    }
    };

    // Safe Area Insets for proper padding
    const insets = useSafeAreaInsets();
    
    const totalTopPadding = insets.top;

    return (
        <ThemedView style = {[styles.container, {paddingTop : totalTopPadding, paddingBottom: insets.bottom + 150}]}>
            
            <ThemedText title = {true}>Omnia </ThemedText>
            <Spacer height={30} />

            <ThemedText style = {[styles.subHeader]}> Login </ThemedText>
            <Spacer height={20} />

            {/* Email Input Field */}
            <ThemedTextInput 
                placeholder = "Enter Your Email" 
                keyboardType = "email-address"
                onChangeText = {setEmail}
                value = {email}
                />
            <Spacer height={15} />

            <View style={{ width: '80%', alignSelf: 'center' }}> 
    
                {/* Password Entry Field */}
                <ThemedTextInput 
                    placeholder="Enter Your Password" 
                    secureTextEntry={true}
                    onChangeText={setPassword}
                    value={password}
                    style={{ width: '100%' }} 
                />

                {/* Forgot Password Redirect */}
                <Link href="/resetPassword" style={{ alignSelf: 'flex-end', marginTop: 8 }}>
                    <ThemedText style=
                    {{ 
                        color: '#005BB5', 
                        fontSize: 12 
                    }}>
                        Forgot Password?
                    </ThemedText>
                </Link>

            </View>

            {/* Sign In Button */}
            <Spacer height={10} />
            <ThemedButton onPress={handleLogin} >
                <ThemedText 
                    style = {{
                        color : 'white', 
                        textAlign : 'center', 
                        fontWeight : '600'
                        }}> 
                        Sign In 
                </ThemedText>
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