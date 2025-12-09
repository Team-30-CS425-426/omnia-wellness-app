// app/_layout.tsx
// Developed by Johan Ramirez
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';

export default function AuthLayout() {
    const { user, loading, hasOnboarded, initialLoadFinished } = useUser();
    const segments = useSegments() as string[]; 

    useEffect(() => {
    console.log(" AUTH LAYOUT TRIGGERED");
    console.log("user:", user?.id);
    console.log("loading:", loading);
    console.log("hasOnboarded:", hasOnboarded);
    console.log("segments:", segments);

    const inAuthGroup = segments[0] === '(auth)';
    const currentPath = segments.join('/');
    const isResettingPassword = currentPath.includes('reset-password');
    const isOnNameScreen = currentPath.includes('onboarding/name');
    const isInIndex = segments.length === 0;

    console.log("currentPath:", currentPath);
    console.log("inAuthGroup:", inAuthGroup);
    console.log("isOnNameScreen:", isOnNameScreen);
    console.log("isInIndex:", isInIndex);

    if (loading) {
        console.log("loading… skipping redirect");
        return;
    }

    if (user) {
        console.log("USER LOGGED IN");

        if (isResettingPassword) {
            console.log("Password reset flow detected");
            return;
        }

        if (hasOnboarded === null) {
            console.log("Waiting for profile data (hasOnboarded) to load...");
            return;
         }

        if (hasOnboarded === false && !isOnNameScreen) {
            console.log("Redirect: go to /onboarding/name");
            router.replace('/onboarding/name' as any);
            return;
        }

        if (hasOnboarded === true && !currentPath.includes('(tabs)')) {
            console.log("Redirect: go to /(tabs)/home");
            router.replace('/(tabs)/home');
            return;
        }
    }

    if (!user && !inAuthGroup && !isInIndex) {
        console.log("Redirect: not logged in → /login");
        router.replace('/login');
    }
    }, [user, loading, segments]);

    return (
        <>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false, animation: "none" }} />
        </>
    );
}
