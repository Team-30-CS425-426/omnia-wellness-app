import React from 'react'
import { Link} from 'expo-router';
import {StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getAuthErrorMessage } from '../utils/authErrors';
import { useUser } from '../../contexts/UserContext';

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

    const { register } = useUser();

    const handleSubmit = async () => {
        // 1. Validation: Check for empty fields
        if (!email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        // 2. Validation: Check if passwords match
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }
        setLoading(true);

        try {
            await register(email, password);
            
        } catch (error: any) {
            console.log(error.code);           
            const message = getAuthErrorMessage(error.code);
            Alert.alert('Registration Failed', message);

        } finally {
            setLoading(false); 
        }
    };

    const insets = useSafeAreaInsets();
    
    const totalTopPadding = insets.top;

    return (
        <ThemedView style = {[styles.container, {paddingTop : totalTopPadding, paddingBottom: insets.bottom + 150}]}>
            

            <ThemedText style = {[{paddingTop : totalTopPadding}]} title = {true} > Omnia </ThemedText>
            <Spacer height={30} />

            <ThemedText style = {[styles.subHeader]}> Create an Account </ThemedText>
            <Spacer height={30} />

            <ThemedTextInput 
                placeholder = "Enter a Valid Email" 
                keyboardType = "email-address"
                onChangeText = {setEmail}
                value = {email}
                />
            <Spacer height={15} />

            <ThemedTextInput 
                placeholder = "Enter a Valid Password" 
                secureTextEntry={true}
                onChangeText = {setPassword}
                value = {password}
            />

            <Spacer height={15} />
            <ThemedTextInput 
                placeholder = "Confirm Your Password" 
                secureTextEntry={true}
                onChangeText = {setConfirmPassword}
                value = {confirmPassword}
            />

            <Spacer height={10} />
            <ThemedButton onPress={handleSubmit} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <ThemedText style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
                        Sign Up
                    </ThemedText>
                )}
            </ThemedButton>

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