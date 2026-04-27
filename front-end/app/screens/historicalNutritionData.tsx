/**
 * historicalNutritionData.tsx
 * 
 * HISTORICAL DATA SCREEN for the Nutrition Goal system.
 * Displays a bar chart (week) or line chart (month) showing the user's calorie intake.
 * Also shows macros (protein, carbs, fat) as line charts in both modes.
 * 
 * FLOW:
 *   1. User taps the Nutrition card on the home page (keystats.tsx)
 *   2. keystats.tsx routes to '/screens/historicalNutritionData'
 *   3. This screen fetches the last 7 or 30 days of nutrition logs via getNutritionHistory()
 *   4. Data is transformed into chart format and rendered using react-native-gifted-charts
 * 
 * FEATURES:
 *   - Day/Week/Month toggle
 *   - Dynamic bar sizing: bars automatically fill the screen width regardless of device size
 *   - Solid color bars: uses solid colors (no gradients) matching activity data screen style
 *   - Interactive selection: tapping a bar highlights it with a different color
 *   - Top labels: calorie value displayed above each bar (week mode)
 *   - Chart cards: white cards with borders matching activity data layout
 *   - TOTAL block: displays selected day's total calories with date
 * 
 * DEPENDENCIES:
 *   - nutritionService.ts: getNutritionHistory() — fetches logged nutrition data
 *   - react-native-gifted-charts: BarChart and LineChart components for rendering charts
 */

//Developed by Johan Ramirez
import React, {useState, useCallback, useMemo} from 'react'
import { router } from 'expo-router';
import { View, Pressable, StyleSheet, ScrollView, Dimensions, Text, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useUser } from '@/contexts/UserContext';
import { getNutritionHistory, getDailyNutritionEntries, NutritionLogRow, deleteMealEntry } from '@/src/services/nutritionService';
import { useFocusEffect } from '@react-navigation/native';

import NutritionDayView from '../components/nutrition/NutritionDayView';
import NutritionWeekView from '../components/nutrition/NutritionWeekView';
import NutritionMonthView from '../components/nutrition/NutritionMonthView';

type Mode = "D" | "W" | "M";

function SegmentedWM({
  value,
  onChange,
}: {
  value: Mode;
  onChange: (v: Mode) => void;
}) {
  const options: { key: Mode; label: string }[] = [
    { key: "D", label: "Day" },
    { key: "W", label: "Week" },
    { key: "M", label: "Month" }
    
  ];

  return (
    <View style={styles.segmentWrap}>
      {options.map((opt) => {
        const selected = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[styles.segmentItem, selected && styles.segmentItemSelected]}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const HistoricalNutritionData = () => {
    const insets = useSafeAreaInsets();
    const { user } = useUser();

    const [mode, setModeRaw] = useState<Mode>("W");

    // ── Pre-fetched caches for each mode ──
    const [dayCache, setDayCache] = useState<any[]>([]);
    const [weekCache, setWeekCache] = useState<any[]>([]);
    const [monthCache, setMonthCache] = useState<any[]>([]);

    // Tracks which bar the user has tapped (null = no selection)
    const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);
    // Tracks which point the user last touched in Month mode (null = most recent)
    const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);

    // Reset selections when switching modes so it defaults to the most recent entry
    const setMode = useCallback((next: Mode) => {
        setModeRaw(next);
        setSelectedBarIndex(null);
        setSelectedMonthIndex(null);
    }, []);

    // Individual meal entries for the Day tab
    const [dayEntries, setDayEntries] = useState<NutritionLogRow[]>([]);

    const handleDeleteEntry = async (entry: NutritionLogRow) => {
        const result = await deleteMealEntry(entry.id!, user!.id);
        if (result.success) {
            const [dayData, weekData, monthData, entries] = await Promise.all([
                getNutritionHistory(user!.id, 0),
                getNutritionHistory(user!.id, 6),
                getNutritionHistory(user!.id, 30),
                getDailyNutritionEntries(user!.id),
            ]);
            setDayCache(dayData);
            setWeekCache(weekData);
            setMonthCache(monthData);
            setDayEntries(entries);
        } else {
            Alert.alert('Failed to delete meal entry', result.error);
        }
    }  


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
    }

    // Fetch all three ranges + day entries in one shot when the screen gains focus
    useFocusEffect(
        useCallback(() => {
            async function fetchAll() {
                if (!user?.id) return;
                try {
                    const [dayData, weekData, monthData, entries] = await Promise.all([
                        getNutritionHistory(user.id, 0),
                        getNutritionHistory(user.id, 6),
                        getNutritionHistory(user.id, 30),
                        getDailyNutritionEntries(user.id),
                    ]);
                    setDayCache(dayData);
                    setWeekCache(weekData);
                    setMonthCache(monthData);
                    setDayEntries(entries);
                    setSelectedBarIndex(null);
                    setSelectedMonthIndex(null);
                } catch (error) {
                    console.error('Error fetching nutrition data:', error);
                }
            }
            fetchAll();
        }, [user?.id])
    );

    // Derive active dataset from the cached data — instant, synchronous switch
    const nutritionHistory = useMemo(() => {
        if (mode === "D") return dayCache;
        if (mode === "W") return weekCache;
        return monthCache;
    }, [mode, dayCache, weekCache, monthCache]);

    // DYNAMIC BAR SIZING — calculates bar width and spacing so bars fill the screen
    const screenWidth = Dimensions.get('window').width;
    const cardMarginH = 14;
    const cardPadding = 16;
    const yAxisLabelWidth = 40;
    const cardInnerWidth = screenWidth - cardMarginH * 2 - cardPadding * 2;
    const availableWidth = cardInnerWidth - yAxisLabelWidth;
    const numBars = nutritionHistory.length || 1;
    const spacing = mode === "W" ? 14 : 6;
    const barWidth = Math.max(6, Math.floor((availableWidth - spacing * (numBars + 1)) / numBars));

    const maxCaloriesFromData = nutritionHistory.reduce(
        (max, d) => Math.max(max, d.calories ?? 0),
        0
      );
      
      const caloriesMaxValue =
        maxCaloriesFromData > 0
          ? Math.ceil((maxCaloriesFromData * 1.1) / 100) * 100
          : 2500;
      
      // --- Dynamic Y-axis max for Macros ---
      const maxProtein = nutritionHistory.reduce(
        (max, d) => Math.max(max, d.protein ?? 0),
        0
      );
      const maxCarbs = nutritionHistory.reduce(
        (max, d) => Math.max(max, d.carbs ?? 0),
        0
      );
      const maxFat = nutritionHistory.reduce(
        (max, d) => Math.max(max, d.fat ?? 0),
        0
      );

      const maxMacroFromData = Math.max(maxProtein, maxCarbs, maxFat);
      const macrosMaxValue =
        maxMacroFromData > 0
            ? Math.ceil((maxMacroFromData * 1.1) / 25) * 25
            : 300;

    // ── Month marker labels (5 evenly spaced) ──
    const monthMarkerIdx = useMemo(() => [0, 7, 14, 21, 29], []);
    const monthXAxisLabels = useMemo(() => {
        return nutritionHistory.map((d, i) =>
            monthMarkerIdx.includes(i) ? (d.date?.slice(5) ?? "") : ""
        );
    }, [nutritionHistory, monthMarkerIdx]);

    // ── LINE CHART DATA for Macros (Protein, Carbs, Fat) ──
    const proteinData = nutritionHistory.map((d, i) => ({
        value: d.protein,
        label: mode === "W" ? d.date.slice(5) : "",
        date: d.date,
        dataIndex: i,
    }));

    const carbsData = nutritionHistory.map((d) => ({
        value: d.carbs,
    }));

    const fatData = nutritionHistory.map((d) => ({
        value: d.fat,
    }));

    // ── LINE CHART DATA for Calories (Month mode) ──
    const caloriesLineData = useMemo(() => {
        return nutritionHistory.map((d, i) => ({
            value: d.calories ?? 0,
            label: "",
            date: d.date,
            dataIndex: i,
        }));
    }, [nutritionHistory, monthMarkerIdx]);

    // Transform raw nutrition data into the format expected by BarChart (Week mode)
    const barData = useMemo(() => {
        return nutritionHistory.map((d, i) => {
            const isSelected = i === selectedBarIndex;
            return {
                value: d.calories,
                label: d.date.slice(5),
                frontColor: isSelected ? "#5ec9c3" : "#5ec9c45e",
                onPress: () => setSelectedBarIndex(selectedBarIndex === i ? null : i),
                topLabelComponent: () => (
                    <Text style={styles.topLabel}>{Math.round(d.calories || 0)}</Text>
                ),
            };
        });
    }, [nutritionHistory, selectedBarIndex]);

    const selected = useMemo(() => {
        if (nutritionHistory.length === 0) return { date: '', calories: 0 };
        if (mode === "M") {
            const idx = selectedMonthIndex !== null && selectedMonthIndex < nutritionHistory.length
                ? selectedMonthIndex
                : nutritionHistory.length - 1;
            return nutritionHistory[idx];
        }
        const idx = selectedBarIndex != null && selectedBarIndex < nutritionHistory.length
            ? selectedBarIndex
            : nutritionHistory.length - 1;
        return nutritionHistory[idx];
    }, [nutritionHistory, selectedBarIndex, selectedMonthIndex, mode]);

    const selectedDateText = useMemo(() => {
        if (!selected.date) return '';
        const d = new Date(`${selected.date}T00:00:00`);
        if (Number.isNaN(d.getTime())) return selected.date;
        return d.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    }, [selected.date]);

    // Line chart spacing for month mode
    const lineSpacingMonth = availableWidth / Math.max(numBars - 1, 1);

    const hasData = nutritionHistory.length > 0;

    return (
        <View style={styles.safe}>
            <View style={{ flex: 2, paddingTop: Math.max(8, insets.top) }}>
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
                            Nutrition Data
                        </Text>
                    </View>
                </View>

                <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
                    {/* Day/Week/Month Toggle */}
                    <View style={{ paddingHorizontal: 14, marginTop: 6 }}>
                        <SegmentedWM value={mode} onChange={setMode} />
                    </View>

                    {/* TOTAL */}
                    <View style={styles.totalBlock}>
                        <Text style={styles.totalLabel}>TOTAL</Text>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalNumber}>
                                {Math.round(selected.calories || 0)}
                            </Text>
                            <Text style={styles.totalUnit}> cal</Text>

                            {/* View Details — visible in Week & Month modes */}
                            {mode !== "D" && selected.date ? (
                                <Pressable
                                    style={styles.viewDetailsBtn}
                                    onPress={() =>
                                        router.push({
                                            pathname: '/screens/dailyNutritionSummary' as any,
                                            params: { date: selected.date },
                                        } as any)
                                    }
                                >
                                    <Text style={styles.viewDetailsTxt}>View Details ›</Text>
                                </Pressable>
                            ) : null}
                        </View>
                        <Text style={styles.totalDate}>{selectedDateText}</Text>
                    </View>

                    {/* Tab-specific content */}
                    {mode === "D" && (
                        <NutritionDayView
                            entries={dayEntries}
                            isCurrentDay={selected.date === new Date().toLocaleDateString('en-CA')}     
                            onEditEntry={handleEditEntry}
                            onDeleteEntry={handleDeleteEntry}
                        />
                    )}

                    {mode === "W" && (
                        <NutritionWeekView
                            barData={barData}
                            proteinData={proteinData}
                            carbsData={carbsData}
                            fatData={fatData}
                            availableWidth={availableWidth}
                            barWidth={barWidth}
                            spacing={spacing}
                            caloriesMaxValue={caloriesMaxValue}
                            macrosMaxValue={macrosMaxValue}
                            numBars={numBars}
                            hasData={hasData}
                        />
                    )}

                    {mode === "M" && (
                        <NutritionMonthView
                            caloriesLineData={caloriesLineData}
                            proteinData={proteinData}
                            carbsData={carbsData}
                            fatData={fatData}
                            availableWidth={availableWidth}
                            lineSpacingMonth={lineSpacingMonth}
                            caloriesMaxValue={caloriesMaxValue}
                            macrosMaxValue={macrosMaxValue}
                            hasData={hasData}
                            onMonthSelect={setSelectedMonthIndex}
                        />
                    )}
                </ScrollView>
            </View>
        </View>
    )
}

export default HistoricalNutritionData

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "white" },
    header: {
        height: 56,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8 },
    backChevron: { fontSize: 28, lineHeight: 28, fontWeight: "400" },
    backText: { fontSize: 17, fontWeight: "500" },
    headerTitle: { fontSize: 20, fontWeight: "700", color: "#000" },
    totalBlock: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 6 },
    totalLabel: { fontSize: 13, color: "#8E8E93", fontWeight: "700", letterSpacing: 0.5 },
    totalRow: { flexDirection: "row", alignItems: "baseline" },
    totalNumber: { fontSize: 52, fontWeight: "800", color: '#5ec9c3' },
    totalUnit: { fontSize: 20, color: "#8E8E93", fontWeight: "600", marginLeft: 6 },
    viewDetailsBtn: {
        marginLeft: 'auto',
        alignSelf: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: '#5ec9c3',
    },
    viewDetailsTxt: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.default.white,
    },
    totalDate: { fontSize: 16, color: "#8E8E93", fontWeight: "600", marginTop: 2 },
    topLabel: { fontSize: 10, color: Colors.default.extraDarkBlueTeal, fontWeight: "700", marginBottom: 2 },
    // Segment toggle styles
    segmentWrap: {
        height: 38,
        borderRadius: 20,
        backgroundColor: "#E5E5EA",
        padding: 3,
        flexDirection: "row",
        gap: 6,
    },
    segmentItem: { flex: 1, borderRadius: 16, alignItems: "center", justifyContent: "center" },
    segmentItemSelected: { backgroundColor: "white" },
    segmentText: { fontSize: 15, fontWeight: "600", color: "#111" },
    segmentTextSelected: { color: "#000" },
})
