import {Stack} from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { UserProvider } from '../contexts/UserContext'


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