// code written by Daisy Madera
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View  } from 'react-native';
import { router } from 'expo-router';
import ThemedText from './components/ThemedText';
import ThemedView from './components/ThemedView';
import { fetchRandomQuote, Quote } from '@/src/services/QuoteService';

export type QuoteScreenProps = {
    onDone?: () => void;
};

export function QuoteScreenContent({ onDone }: QuoteScreenProps){
    const [quote, setQuote] = useState<Quote | null > (null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const loadQuote = async () => {
        try {
            setLoading(true);
            setError(null);
            const q = await fetchRandomQuote();
            setQuote(q);
        }catch (e) {
            console.warn(e);
            setError('Could not load a quote. Please try again later.');
        }finally{
            setLoading(false);
        }
    };
    useEffect(() => {
        loadQuote ();
    }, []);

    useEffect(() => {
        if (loading) return;
        const timer = setTimeout(() => {
            if (onDone){
                onDone();
            }else{
                router.replace('/home')
            }
        }, 7000);
        return () => clearTimeout(timer);
    }, [loading, onDone]);
    
    return (
        <ThemedView style = {styles.container}>
            <View style = {styles.content}>
                <ThemedText style = {styles.title}>Today&apos;s Quote</ThemedText>
                {loading && (
                    <ActivityIndicator style = {styles.spacing} />
                )}
                {!loading && error && (
                    <ThemedText style = {[styles.spacing, styles.error]}>
                        {error}
                    </ThemedText>
                )}
                {!loading && quote && !error && (
                    <>
                    <ThemedText style = {styles.quoteText}>
                        "{quote.quote}"
                    </ThemedText>
                    <ThemedText style = {styles.authorText}>
                        -{quote.author}
                    </ThemedText>
                    <ThemedText style = {styles.helper}>
                        You&apos;ll be taken to your homepage in a moment...
                    </ThemedText>
                    </>
                )}
            </View>
        </ThemedView>
    );
}
export default function QuoteScreenRoute(){
    return <QuoteScreenContent />;
}
const styles = StyleSheet.create ({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    content:{
        flexGrow: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
    },
    quoteText: {
        fontSize: 18,
        lineHeight: 26,
        textAlign: 'center',
        marginBottom: 16,
    },
    authorText: {
        fontSize: 16,
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: 24,
    },
    helper: {
        textAlign: 'center',
        color: '#666',
    },
    spacing: {
        marginTop: 20,
    },
    error: {
        color: 'red',
        textAlign: 'center',
    },
});
