// app/_layout.tsx (or wherever your AuthLayout is)

import React, { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router'; 
import { StatusBar } from 'expo-status-bar';
import { useUser } from '../../contexts/UserContext';

export default function AuthLayout() {
    const { user, loading } = useUser();
    const segments = useSegments(); 

    useEffect(() => {
        if (loading) return; 

        const inAuthGroup = segments[0] === '(auth)';
        
        // 🛠️ FIX: Convert segments to a string to avoid the TypeScript error
        // This checks if "reset-password" exists anywhere in the current URL path
        const currentPath = segments.join('/');
        const isResettingPassword = currentPath.includes('reset-password');
        const isVerifyingEmail = currentPath.includes('email-verified');

        if (user && !isResettingPassword && !isVerifyingEmail) {
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