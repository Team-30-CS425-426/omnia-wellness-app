import { Slot, Stack } from 'expo-router'
import { StyleSheet, Text, useColorScheme, View } from 'react-native'
import { Colors } from "../constants/Colors"
import { StatusBar } from 'expo-status-bar'

const RootLayout = () => {
    const colorScheme = useColorScheme()
    const theme = Colors.default

    return (
        <>
        <Stack screenOptions={{
            headerShown: false,
        }}>
            <Stack.Screen name = "index" options = {{title: 'Home'}}/>

        </Stack>
        </>
    )
}

export default RootLayout

const styles = StyleSheet.create({})