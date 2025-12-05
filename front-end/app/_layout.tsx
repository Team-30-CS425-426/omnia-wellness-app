import {Stack} from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { UserProvider } from '../contexts/UserContext'
// At the top of your root layout
import { LogBox } from 'react-native';
LogBox.ignoreLogs(['Text strings must be rendered within a <Text> component']);

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