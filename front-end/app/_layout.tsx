import React from 'react';
import {Stack} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import * as Notifications from 'expo-notifications';
import { UserProvider } from '../contexts/UserContext';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});
// At the top of your root layout
LogBox.ignoreLogs(['Text strings must be rendered within a <Text> component']);

const RootLayout = () => {

    return (
        <>
        <UserProvider>
        <StatusBar style = "dark" />
        <Stack screenOptions={{
            headerShown: false,
        }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding/name" options={{ headerShown: false }} />
            {/*<Stack.Screen name = "index" options = {{title: 'Home'}}/>*/}
        </Stack>
        </UserProvider>
        </>
    )
}

export default RootLayout