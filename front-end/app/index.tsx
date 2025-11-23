import React from 'react';
import { View, Button, StyleSheet,Text } from 'react-native';
import {useRouter } from 'expo-router';

export default function Index(){
    const router = useRouter();
    
    return(
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to Omnia</Text>
            <Button
             title="Log In"
             onPress={() => router.replace ('/(tabs)/home')}
             />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 60,
        justifyContent: 'flex-start',
    },
    title: {
        fontSize: 22,
        marginBottom: 16,
        fontWeight: '600',
    },
});
