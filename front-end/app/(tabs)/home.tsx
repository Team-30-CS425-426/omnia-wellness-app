import { Redirect } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Button,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUser } from '../../contexts/UserContext';

import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';

import useHealthData from '@/src/hooks/useHealthData';
import { QuoteScreenContent } from '../quote';

/*
Currently a minimalistic HomePage with placeholders
*/

export default function HomePage() {
    const insets = useSafeAreaInsets();
    const totalTopPadding = insets.top + 20;

    const {user, loading: userLoading} = useUser();
    const {
        loading: healthLoading,
        error,
        steps7d,
        sleep7d,
        connectAndImport,
        exportToCsv,
    } = useHealthData();

    const [showQuoteSplash, setShowQuoteSplash] = useState(true);

    if (userLoading){
        return <ThemedText>Loading...</ThemedText>;
    }

    if (!user){
        return <Redirect href = "/" />;
    }

    if (showQuoteSplash) {
        return (
            <QuoteScreenContent
            onDone={() => {
                setShowQuoteSplash(false);
            }}
            />
        );
    }
   
    return (
        <ThemedView style = {[
            styles.container, 
            {paddingTop : totalTopPadding, paddingBottom: insets.bottom + 20}
            ]} >
                <ScrollView contentContainerStyle = {styles.scrollContent}>
                <View style ={styles.section}>
                    <ThemedText style = {styles.sectionTitle}>
                        Apple Health (FR2 demo)
                    </ThemedText>
                    <Button
                        title=" Connect & import 7 days"
                        onPress={ () => {
                            console.log('Connect & import 7 days pressed');
                            connectAndImport();
                        }}
                    />
                <View style = {{ height: 8 }} />
                    <Button
                    title= "Export CSV"
                    onPress={() => {
                        console.log('Export CSV pressed');
                        exportToCsv();
                      }}
                    />
                </View>
                {healthLoading && <ActivityIndicator style={styles.spacing} />}
                {error && (
                    <ThemedText style={[styles.spacing, styles.error]}>
                        {error}
                    </ThemedText>
                )}
                {steps7d.length > 0 && (
                    <View style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>
                            Steps (last 7 days)
                        </ThemedText>
                        {steps7d.map((d:any) => (
                            <ThemedText key={d.startDate}>
                                {d.startDate.slice(0,10)}: {Math.round(d.value)} steps
                            </ThemedText>
                        ))}
                    </View>
                )}
                {sleep7d.length > 0 && (
                    <View style={styles.section}>
                        <ThemedText style ={styles.sectionTitle}>
                            Sleep samples (last 7 days)
                        </ThemedText>
                        {sleep7d.map ((d:any)=> (
                            <ThemedText key = {d.startDate}>
                                {d.startDate.slice(0,10)}: {Number(d.value).toFixed(1)} hours
                            </ThemedText>
                        ))}
                    </View>
                )}
                </ScrollView>
        </ThemedView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex:1,
    },
    scrollContent:{
        alignItems:'center',
        paddingHorizontal: 20,
    },
    spacing: {
        marginTop:16,
    },
    error:{
        color: 'red',
    },
    section: {
        marginTop: 24,
        marginBottom: 16,
        alignSelf: 'stretch',
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginBottom: 8,
    },
    
});


