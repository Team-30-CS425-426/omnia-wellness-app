import React, { useState } from 'react';
import {
    Button,
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
}from 'react-native';

import useHealthData from '@/src/hooks/useHealthData';

export default function HomePage(){
    const {
        loading,
        error,
        steps7d,
        sleep7d,
        connectAndImport,

    } = useHealthData();

    return (
        <ScrollView contentContainerStyle={styles.container}>


            <Text style = {styles.title}>Welcome to Omnia</Text>

                <View style = {styles.section}>
                    <Text style= {styles.sectionTitle}>Apple Health (FR2 demo)</Text>
                    <Button
                    title = "Connect & import 7 Days"
                    onPress = {connectAndImport}
                    />
                </View>
                {loading && <ActivityIndicator style = { styles.spacing} />}
                {error && (
                    <Text style={[styles.spacing, styles.error]}>{error}</Text>
                )}

                {steps7d.length > 0 && (
                    <View style = {styles.section}>
                        <Text style = {styles.section}> steps (last 7 days)</Text>
                        {steps7d.map((d: any) => (
                            <Text key={d.startDate}>
                                {d.startDate.slice(0,10)}: {Math.round(d.value)} steps
                            </Text>
                        ))}
                    </View>
                )}
                {sleep7d.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            sleep samples(last 7 days)
                        </Text>
                    </View>
                )}

          </ScrollView>         
    );
}
const styles = StyleSheet.create({
    container:{
        padding: 20,
        paddingTop: 60,
    },
    title: {
        fontSize: 22,
        marginBottom: 16,
        fontWeight: '700',
    },
    spacing: {
        marginTop: 16,
    },
    error: {
        color: 'red',
    },
    section: {
        marginTop: 24,
        marginBottom: 16,
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginBottom: 8,
    },
});