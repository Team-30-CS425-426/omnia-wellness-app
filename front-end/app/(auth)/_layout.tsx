import React, {useEffect} from 'react'; //import React and useEffect hook for side effects
import { Stack, router } from 'expo-router'; //import the Stack navigator from Expo Router
import { StatusBar} from 'expo-status-bar'; //import StatusBar to control the appearance of the status bar
import {useUser} from '../../contexts/UserContext'; //import the custom UserContext to access user authentication state

export default function AuthLayout() {

    const {user} = useUser();
    console.log(user)

    useEffect (() => {
        if (user) {
            // If user is logged in, redirect to the main app
            console.log("User is logged in, redirecting to /home");
            router.replace('/home');
        }
    }, [user]);

    return (
        <>
            <StatusBar style = "auto" />
            <Stack screenOptions={{headerShown: false, animation: "none"}}/>
        </>
    )
}
