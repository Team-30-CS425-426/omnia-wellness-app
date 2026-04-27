/**
 * NutritionDayView.tsx
 *
 * Day tab content for the Nutrition historical data screen.
 * Displays expandable cards for each meal/snack the user logged today.
 * Each card shows the meal name as the title and a macro breakdown when expanded.
 * Multiple cards can be expanded simultaneously.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ThemedCard from '../ThemedCard';
import ThemedText from '../ThemedText';
import { Colors } from '../../../constants/Colors';
import { NutritionLogRow } from '@/src/services/nutritionService';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import EditModal from '../editModal';

type Props = {
    entries: NutritionLogRow[];
    isCurrentDay: boolean;
    onEditEntry: (entry: NutritionLogRow) => void;
    onDeleteEntry: (entry: NutritionLogRow) => void;
};

/** Convert "HH:MM:SS" (24-h) to "h:MM AM/PM" */
function formatTime12h(time: string): string {
    const [hStr, mStr] = time.split(':');
    let h = parseInt(hStr, 10);
    const suffix = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${mStr} ${suffix}`;
}

const NutritionDayView = ({ entries, isCurrentDay, onEditEntry, onDeleteEntry }: Props) => {
    const [expandedSet, setExpandedSet] = useState<Set<number>>(new Set());

    const [selectedMeal, setselectedMeal] = useState<NutritionLogRow | null>(null);

    const toggleCard = (idx: number) => {
        setExpandedSet((prev) => {
            const next = new Set(prev);
            if (next.has(idx)) {
                next.delete(idx);
            } else {
                next.add(idx);
            }
            return next;
        });
    };

    if (entries.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No meals logged today.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {entries.map((entry, idx) => {
                const isExpanded = expandedSet.has(idx);
                const typeLabel = entry.nutritionEventType === 2 ? 'Snack' : 'Meal';

              

                return (
                    <ThemedCard
                        key={entry.id ?? idx}
                        onPress={() => toggleCard(idx)}
                        style={styles.card}
                    >
                        {/* Title row */}
                        <View style={styles.titleRow}>
                            <ThemedText style={styles.mealName}>
                                {entry.mealName}
                            </ThemedText>
                            {entry.time ? (
                                <Text style={styles.logTime}>
                                    {formatTime12h(entry.time)}
                                </Text>
                            ) : null}
                            <Text style={[
                                styles.typeBadge,
                                {
                                    backgroundColor: typeLabel === 'Snack'
                                        ? Colors.default.vibrantOrange
                                        : Colors.default.successGreen,
                                    color: '#FFFFFF',
                                },
                            ]}>{typeLabel}</Text>

                            {isCurrentDay && isExpanded && (
                                <TouchableOpacity style = {{marginLeft: 10}} onPress={() => setselectedMeal(entry)}>
                                    <Ionicons name="ellipsis-horizontal" size={16} color="black" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Expanded macro breakdown */}
                        {isExpanded && (
                            <View style={styles.macroGrid}>
                                <MacroRow label="Calories" value={`${entry.calories}`} unit="cal" color = {Colors.default.berryBlue} />
                                <MacroRow label="Protein" value={`${entry.protein}`} unit="g" color={Colors.default.strongGreen} />
                                <MacroRow label="Carbs" value={`${entry.carbs}`} unit="g" color={Colors.default.primaryBlue} />
                                <MacroRow label="Fat" value={`${entry.fat}`} unit="g" color={Colors.default.berryPurple} />
                            </View>
                        )}
                    </ThemedCard>
                );
            })}


              <EditModal
                    confirmLabel = "Edit Meal"
                    deleteLabel = "Delete Meal"
                    isVisible = {selectedMeal !== null}
                    onClose={() => setselectedMeal(null)}
                    onConfirm={() => {
                        if (selectedMeal) {
                            onEditEntry(selectedMeal);
                            setselectedMeal(null);
                        }}
                    }
                    onDelete={() => {
                        if (selectedMeal) {
                            onDeleteEntry(selectedMeal);
                            setselectedMeal(null);
                        }
                    }}
                />
        </View>
    );
};

/** Small helper component for a single macro row inside an expanded card */
function MacroRow({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
    return (
        <View style={styles.macroRow}>
            <Text style={[styles.macroLabel, { color }]}>{label}</Text>
            <Text style={styles.macroValue}>
                {value}
                <Text style={styles.macroUnit}> {unit}</Text>
            </Text>
        </View>
    );
}

export default NutritionDayView;

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 14,
        paddingTop: 4,
    },
    emptyContainer: {
        marginTop: 10,
        marginHorizontal: 14,
        alignItems: 'center',
        paddingVertical: 24,
    },
    emptyText: {
        fontSize: 15,
        color: '#8E8E93',
        fontWeight: '500',
    },
    card: {
        marginTop: 9,
        padding: 16,
        borderRadius: 16,
        width: '100%',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 4,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    mealName: {
        fontWeight: '600',
        fontSize: 16,
        color: '#5ec9c3',
        flex: 1,
    },
    logTime: {
        fontSize: 12,
        fontWeight: '500',
        color: '#C7C7CC',
        marginLeft: 8,
    },
    typeBadge: {
        fontSize: 12,
        fontWeight: '700',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        overflow: 'hidden',
        marginLeft: 8,
    },
    macroGrid: {
        marginTop: 12,
        width: '100%',
    },
    macroRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E5EA',
    },
    macroLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    macroValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#000',
    },
    macroUnit: {
        fontSize: 12,
        fontWeight: '500',
        color: '#8E8E93',
    },
});
