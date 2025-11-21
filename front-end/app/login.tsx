import React, {useState} from 'react'
import { Link, router } from 'expo-router';
import {StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';

import ThemedView from './components/ThemedView'
import ThemedText from './components/ThemedText'
import ThemedTextInput from './components/ThemedTextInput'
import Spacer from './components/Spacer'
import ThemedButton from './components/ThemedButton'

const Login = () => {
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
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            console.log('User logged in:', user.email);
            
            // 3. Success! Navigate to Home
            // replace() prevents them from hitting "Back" to go back to login
            router.push('/dashboard'); 

        } catch (error: any) {
            console.log(error.code); // Helpful for debugging
            
            // 4. Handle specific errors nicely
            let errorMessage = 'Something went wrong.';
            
            if (error.code === 'auth/invalid-credential') {
                errorMessage = 'Invalid email or password.';
            } else if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed attempts. Try again later.';
            }

            Alert.alert('Login Failed', errorMessage);
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

            <ThemedTextInput 
                placeholder = "Enter Your Password" 
                secureTextEntry={true}
                onChangeText = {setPassword}
                value = {password}
            />

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