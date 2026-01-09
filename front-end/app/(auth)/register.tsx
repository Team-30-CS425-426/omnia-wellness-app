//Developed by Johan Ramirez
import React from 'react'
import { Link, router} from 'expo-router';
import {StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Constants from 'expo-constants';
import { getAuthErrorMessage } from '../../utils/authErrors';
import { useUser } from '../../contexts/UserContext';
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_ANON_KEY_ALT } from '../../config/supabaseConfig';
import ThemedView from '../components/ThemedView'
import ThemedText from '../components/ThemedText'
import ThemedTextInput from '../components/ThemedTextInput'
import Spacer from '../components/Spacer'
import ThemedButton from '../components/ThemedButton'

const Register = () => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const { register, logout } = useUser();
    
    //basic validation and submission after clicking submit
    const handleSubmit = async () => {

    // console.log('SUPABASE_URL:', SUPABASE_URL);
    // console.log('SUPABASE_ANON_KEY exists:', !!SUPABASE_ANON_KEY);
    // console.log('SUPABASE_ANON_KEY length:', SUPABASE_ANON_KEY?.length);
    // console.log('First 30 chars:', SUPABASE_ANON_KEY?.substring(0, 30));
    
    if (!email || !password || !confirmPassword) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
    }

    if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
    }
        setLoading(true);

    try {
        await register(email, password);
        
        console.log('Registration successful, attempting to send email...');
        console.log('Email being sent to:', email);

        const emailResponse = await fetch(`${SUPABASE_URL}/functions/v1/smart-worker`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY_ALT}` // Your anon key
        },
        body: JSON.stringify({ email })
    });
        console.log('Email function response status:', emailResponse.status);
        const emailData = await emailResponse.json();
        console.log('Email function response data:', emailData);

        // Sign out immediately after registration, to go back to log in page
        //Alert.alert('Success', 'Account created! Please log in.');
        //router.replace('/login');

    } catch (error: any) 
        {
            const message = error.message || 'Registration failed';
            Alert.alert('Registration Failed', message);
        } finally {
            setLoading(false);
        }
    };

    const insets = useSafeAreaInsets();
    
    const totalTopPadding = insets.top;

    return (
        <ThemedView style = {[styles.container, {paddingTop : totalTopPadding, paddingBottom: insets.bottom + 150}]}>
            

            <ThemedText style = {[{paddingTop : totalTopPadding}]} title = {true} >Omnia </ThemedText>
            <Spacer height={30} />

            <ThemedText style = {[styles.subHeader]}>Create an Account </ThemedText>
            <Spacer height={30} />

            {/* Email Input Field */}
            <ThemedTextInput 
                placeholder = "Enter a Valid Email" 
                keyboardType = "email-address"
                onChangeText = {setEmail}
                value = {email}
                textContentType="oneTimeCode"
                autoComplete='off'
                autoCorrect={false}
                spellCheck={false}
                />
            <Spacer height={15} />

            {/* Password Input Field */}
            <ThemedTextInput 
                placeholder = "Enter a Valid Password" 
                secureTextEntry={true}
                onChangeText = {setPassword}
                value = {password}
                textContentType="oneTimeCode"
                autoComplete='off'
                autoCorrect={false}
                spellCheck={false}
            />

            {/* Password Confirmation Input Field */}
            <Spacer height={15} />
            <ThemedTextInput 
                placeholder = "Confirm Your Password" 
                secureTextEntry={true}
                onChangeText = {setConfirmPassword}
                value = {confirmPassword}
                textContentType="none"
                autoComplete='off'
                autoCorrect={false}
                spellCheck={false}
            />

            {/* Submission Button */}
            <Spacer height={10} />
            <ThemedButton onPress={handleSubmit} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <ThemedText style={{ 
                        color: 'white', 
                        textAlign: 'center', 
                        fontWeight: '600' 
                        }}>
                        Sign Up
                    </ThemedText>
                )}
            </ThemedButton>

            {/* Login Redirect Link */}
             <Spacer height = {20} />
            <Link href = "/login">
                <ThemedText style = {{color : '#005BB5'}}> Login Instead </ThemedText>
            </Link>
        </ThemedView>
    )
}

export default Register

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
