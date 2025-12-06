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


/*
// 1st attempt to fix mood & stress screen not appearing
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { UserProvider } from "../contexts/UserContext";

export default function RootLayout() {
  return (
    <UserProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false, // tabs have their own headers
        }}
      >
        {/* REMOVE the manual <Stack.Screen name="index" .../> }
        {/* Expo Router will now automatically detect: }
        {/* - app/index.tsx }
        {/* - app/(tabs)/_layout.tsx }
        {/* - app/moodStress.tsx }
        {/* - app/workout.tsx *
      </Stack>
    </UserProvider>
  );
}
*/

/*
// 2nd attempt
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { UserProvider } from '../contexts/UserContext';

const RootLayout = () => {
  return (
    <UserProvider>
      <StatusBar style="dark" />

      <Stack screenOptions={{ headerShown: false }}>
        {/* Root Home (tabs) }
        <Stack.Screen name="index" options={{ title: "Home" }} />

        {/* Tabs folder (auto-registers the entire (tabs)/ folder) }
        <Stack.Screen name="(tabs)" />

        {/* Standalone screens }
        <Stack.Screen name="moodStress" />
        <Stack.Screen name="workout" />

        {/* Add more screens here if needed }
      </Stack>
    </UserProvider>
  );
};

export default RootLayout;
*/

/*
// 3rd attempt
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { UserProvider } from '../contexts/UserContext';

export default function RootLayout() {
  return (
    <UserProvider>
      <StatusBar style="dark" />

      <Stack>
        {/* Tabs }
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Standalone screens }
        <Stack.Screen name="moodStress" options={{ headerShown: true }} />
        <Stack.Screen name="workout" options={{ headerShown: true }} />
      </Stack>
    </UserProvider>
  );
}
*/
