import React, {useState} from 'react'
import { Link } from 'expo-router';
import {StyleSheet, Text, View, Button, TextInput } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ThemedView from './components/ThemedView'
import ThemedText from './components/ThemedText'
import ThemedTextInput from './components/ThemedTextInput'
import Spacer from './components/Spacer'
import ThemedButton from './components/ThemedButton'

const Login = () => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    
    const handleSubmit = () => {
        console.log('Email and Password Submitted  :', email, password);
    }

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
            <ThemedButton onPress={handleSubmit} >
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