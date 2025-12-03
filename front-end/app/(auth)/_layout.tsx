// app/_layout.tsx
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';

export default function AuthLayout() {
    const { user, loading } = useUser();
    const segments = useSegments(); 

    useEffect(() => {
        if (loading) return; 

        const inAuthGroup = segments[0] === '(auth)';
        
        // This checks if "reset-password" exists anywhere in the current URL path
        const currentPath = segments.join('/');
        const isResettingPassword = currentPath.includes('reset-password');

        if (user && !isResettingPassword ) {
            // Only redirect to Home if they are logged in AND NOT resetting password
            router.replace('/home');
        } else if (!user && !inAuthGroup) {
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