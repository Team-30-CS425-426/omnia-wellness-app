/**
 * dailyNutritionSummary.tsx
 *
 * Standalone screen that shows the daily nutrition summary.
 * Reuses the NutritionDayView component from the Day tab.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View, Pressable, StyleSheet, ScrollView, Text, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '@/contexts/UserContext';
import { getNutritionHistory, getDailyNutritionEntries, NutritionLogRow, deleteMealEntry } from '@/src/services/nutritionService';
import { useFocusEffect } from '@react-navigation/native';


import NutritionDayView from '../components/nutrition/NutritionDayView';

const DailyNutritionSummary = () => {
    const insets = useSafeAreaInsets();
    const { user } = useUser();
    // Optional date param (YYYY-MM-DD); when absent, defaults to today
    const { date: dateParam } = useLocalSearchParams<{ date?: string }>();
    const [nutritionHistory, setNutritionHistory] = useState<any[]>([]);
    const [dayEntries, setDayEntries] = useState<NutritionLogRow[]>([]);

    // Build the target Date object from the route param (or default to today)
    const targetDate = useMemo(() => {
        if (!dateParam) return new Date();
        const parsed = new Date(`${dateParam}T00:00:00`);
        return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    }, [dateParam]);

    // Fetch aggregated totals + individual entries for the target date
    useFocusEffect(
        useCallback(() => {
            async function fetchDay() {
                if (!user?.id) return;
                try {
                    // Calculate how many days back the target date is from today
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const target = new Date(targetDate);
                    target.setHours(0, 0, 0, 0);
                    const diffDays = Math.max(0, Math.round((today.getTime() - target.getTime()) / 86400000));

                    const [data, entries] = await Promise.all([
                        getNutritionHistory(user.id, diffDays),
                        getDailyNutritionEntries(user.id, targetDate),
                    ]);
                    setNutritionHistory(data);
                    setDayEntries(entries);
                } catch (error) {
                    console.error('Error fetching daily nutrition:', error);
                }
            }
            fetchDay();
        }, [user?.id, targetDate])
    );

    const dayRecord = useMemo(() => {
        if (nutritionHistory.length === 0) return { date: '', calories: 0 };
        // If a specific date was requested, find that date's record in the history
        if (dateParam) {
            const match = nutritionHistory.find((r: any) => r.date === dateParam);
            if (match) return match;
        }
        return nutritionHistory[nutritionHistory.length - 1];
    }, [nutritionHistory, dateParam]);

    const handleEditEntry = (entry: NutritionLogRow) => {
        router.push({
            pathname: '/screens/nutrition',
            params: {
                id: String(entry.id),
                mealName: entry.mealName,
                calories: String(entry.calories),
                protein: String(entry.protein),
                carbs: String(entry.carbs),
                fat: String(entry.fat),
                nutritionEventType: String(entry.nutritionEventType),
                notes: entry.notes ?? '',
                time: entry.time,
            },
        } as any);
    };

    const handleDeleteEntry = async (entry: NutritionLogRow) => {
        const result = await deleteMealEntry(entry.id!, user!.id);
        if (result.success) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const target = new Date(targetDate);
            target.setHours(0, 0, 0, 0);
            const diffDays = Math.max(0, Math.round((today.getTime() - target.getTime()) / 86400000));

            const [data, entries] = await Promise.all([
                getNutritionHistory(user!.id, diffDays),
                getDailyNutritionEntries(user!.id, targetDate),
            ]);
            setNutritionHistory(data);
            setDayEntries(entries);
        } else {
            Alert.alert('Failed to delete meal entry', result.error);
        }
    };

    const dateText = useMemo(() => {
        if (!dayRecord.date) return '';
        const d = new Date(`${dayRecord.date}T00:00:00`);
        if (Number.isNaN(d.getTime())) return dayRecord.date;
        return d.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    }, [dayRecord.date]);

    return (
        <View style={styles.safe}>
            <View style={{ flex: 1, paddingTop: Math.max(8, insets.top) }}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.headerLeft}>
                        <Text style={styles.backChevron}>‹</Text>
                        <Text style={styles.backText}>Back</Text>
                    </Pressable>
                    <View pointerEvents="none" style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                    }}>
                        <Text style={[styles.headerTitle, { textAlign: 'center' }]}>
                            Daily Summary
                            
                        </Text>
                    </View>
                    <View style={{ width: 60 }} />
                </View>

                <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
                    {/* TOTAL */}
                    <View style={styles.totalBlock}>
                        <Text style={styles.totalLabel}>TOTAL</Text>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalNumber}>
                                {Math.round(dayRecord.calories || 0)}
                            </Text>
                            <Text style={styles.totalUnit}> cal</Text>
                        </View>
                        <Text style={styles.totalDate}>{dateText}</Text>
                    </View>

                    <NutritionDayView
                        entries={dayEntries}
                        isCurrentDay={!dateParam || dateParam === new Date().toLocaleDateString('en-CA')}
                        onEditEntry={handleEditEntry}
                        onDeleteEntry={handleDeleteEntry}
                    />
                </ScrollView>
            </View>
        </View>
    );
};

export default DailyNutritionSummary;

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: 'white' },
    header: {
        height: 56,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
    backChevron: { fontSize: 28, lineHeight: 28, fontWeight: '400' },
    backText: { fontSize: 17, fontWeight: '500' },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
    totalBlock: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 6 },
    totalLabel: { fontSize: 13, color: '#8E8E93', fontWeight: '700', letterSpacing: 0.5 },
    totalRow: { flexDirection: 'row', alignItems: 'baseline' },
    totalNumber: { fontSize: 52, fontWeight: '800', color: '#5459AC' },
    totalUnit: { fontSize: 20, color: '#8E8E93', fontWeight: '600', marginLeft: 6 },
    totalDate: { fontSize: 16, color: '#8E8E93', fontWeight: '600', marginTop: 2 },
});
