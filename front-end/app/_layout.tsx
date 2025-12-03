import {Stack} from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { UserProvider } from '../contexts/UserContext'
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

const RootLayout = () => {

    return (
        <>
        <UserProvider>
        <StatusBar style = "dark" />
        <Stack screenOptions={{
            headerShown: false,
        }}>
            <Stack.Screen name = "index" options = {{title: 'Home'}}/>
        </Stack>
        </UserProvider>
        </>
    )
}

export default RootLayout