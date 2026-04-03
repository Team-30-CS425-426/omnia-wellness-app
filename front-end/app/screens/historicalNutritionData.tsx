/**
 * historicalNutritionData.tsx
 * 
 * HISTORICAL DATA SCREEN for the Nutrition Goal system.
 * Displays a bar chart showing the user's calorie intake over the past 7 days.
 * 
 * FLOW:
 *   1. User taps the Nutrition card on the home page (keystats.tsx)
 *   2. keystats.tsx routes to '/screens/historicalNutritionData'
 *   3. This screen fetches the last 7 days of nutrition logs via getNutritionHistory()
 *   4. Data is transformed into bar chart format and rendered using react-native-gifted-charts
 * 
 * FEATURES:
 *   - Dynamic bar sizing: bars automatically fill the screen width regardless of device size
 *   - Solid color bars: uses solid colors (no gradients) matching activity data screen style
 *   - Interactive selection: tapping a bar highlights it with a different color
 *   - Top labels: calorie value displayed above each bar
 *   - Chart cards: white cards with borders matching activity data layout
 *   - TOTAL block: displays selected day's total calories with date
 * 
 * DEPENDENCIES:
 *   - nutritionService.ts: getNutritionHistory() — fetches logged nutrition data
 *   - react-native-gifted-charts: BarChart component for rendering the chart
 */

//Developed by Johan Ramirez
import React, {useState, useCallback, useMemo} from 'react'
import { router } from 'expo-router';
import { View, Pressable, StyleSheet, ScrollView, Dimensions, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { useUser } from '@/contexts/UserContext';
import { getNutritionHistory } from '@/src/services/nutritionService';
import { useFocusEffect } from '@react-navigation/native';


const HistoricalNutritionData = () => {
    const insets = useSafeAreaInsets();
    const { user } = useUser();

    // Stores the array of daily nutrition records fetched from the database
    // Each entry has { date, calories, protein, carbs, fat }
    const [nutritionHistory, setNutritionHistory] = useState<any[]>([]);

    // Tracks which bar the user has tapped (null = no selection)
    // Used to change the selected bar's color for visual feedback
    const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);

    // Fetch nutrition history every time the screen comes into focus
    // Uses 7-day lookback — change the number to show more/fewer days
    useFocusEffect(
        useCallback(() => {
            async function fetchHistory() {
                if (!user?.id) return;
                try {
                    const data = await getNutritionHistory(user.id, 6);
                    setNutritionHistory(data);
                } catch (error) {
                    console.error('Error fetching nutrition history:', error);
                }
            }
            fetchHistory();
        }, [user?.id])
    );

    // DYNAMIC BAR SIZING — calculates bar width and spacing so bars fill the screen
    // Matches activity data screen sizing
    const screenWidth = Dimensions.get('window').width;
    const cardMarginH = 14;
    const cardPadding = 16;
    const yAxisLabelWidth = 40;
    const cardInnerWidth = screenWidth - cardMarginH * 2 - cardPadding * 2;
    const availableWidth = cardInnerWidth - yAxisLabelWidth;
    const numBars = nutritionHistory.length || 1;
    const spacing = 12;
    const barWidth = Math.max(6, Math.floor((availableWidth - spacing * (numBars + 1)) / numBars));

    const maxCaloriesFromData = nutritionHistory.reduce(
        (max, d) => Math.max(max, d.calories ?? 0),
        0
      );
      
      // Add ~10% headroom and round to the nearest 100
      const caloriesMaxValue =
        maxCaloriesFromData > 0
          ? Math.ceil((maxCaloriesFromData * 1.1) / 100) * 100
          : 2500; // sensible default when there's no data
      
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
            : 300; // default when there's no data





    // ── LINE CHART DATA for Macros (Protein, Carbs, Fat) ──
    // Each macro gets its own dataset with a distinct color
    const proteinData = nutritionHistory.map((d) => ({
        value: d.protein,
        label: d.date.slice(5),  // "MM-DD"
    }));

    const carbsData = nutritionHistory.map((d) => ({
        value: d.carbs,
    }));

    const fatData = nutritionHistory.map((d) => ({
        value: d.fat,
    }));

    // Transform raw nutrition data into the format expected by react-native-gifted-charts
    // Uses solid colors (no gradients) to match activity data screen style
    const barData = useMemo(() => {
        return nutritionHistory.map((d, i) => {
            const isSelected = i === selectedBarIndex;
            return {
                value: d.calories,
                label: d.date.slice(5),  // "MM-DD"
                frontColor: isSelected ? "#5459AC" : "rgba(84,89,172,0.35)", // solid color, not gradient
                onPress: () => setSelectedBarIndex(selectedBarIndex === i ? null : i),
                topLabelComponent: () => (
                    <Text style={styles.topLabel}>{Math.round(d.calories || 0)}</Text>
                ),
            };
        });
    }, [nutritionHistory, selectedBarIndex]);

    const selected = useMemo(() => {
        if (nutritionHistory.length === 0) return { date: '', calories: 0 };
        return nutritionHistory[selectedBarIndex ?? nutritionHistory.length - 1];
    }, [nutritionHistory, selectedBarIndex]);

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

    return (
        <View style={styles.safe}>
            <View style={{ flex: 2,paddingTop: Math.max(8, insets.top ) }}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.headerLeft}>
                        <Text style={styles.backChevron}>‹</Text>
                        <Text style={styles.backText}>Back</Text>
                    </Pressable>
                    <Text style={styles.headerTitle}>Nutrition Data</Text>
                    <View style={{ width: 60 }} />
                </View>

                <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
                    {/* TOTAL */}
                    <View style={styles.totalBlock}>
                        <Text style={styles.totalLabel}>TOTAL</Text>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalNumber}>
                                {Math.round(selected.calories || 0)}
                            </Text>
                            <Text style={styles.totalUnit}> cal</Text>
                        </View>
                        <Text style={styles.totalDate}>{selectedDateText}</Text>
                    </View>

                    {/* Calories Chart Card */}
                    <View style={styles.chartCard}>
                        <Text style={styles.cardTitle}>Calories</Text>
                        {nutritionHistory.length === 0 ? (
                            <Text style={{ color: "#8E8E93", paddingTop: 10 }}>
                                No nutrition data.
                            </Text>
                        ) : (
                            <View style={{ alignItems: "center", paddingTop: 10 }}>
                                <BarChart
                                    data={barData}
                                    width={availableWidth}
                                    height={240}
                                    barWidth={barWidth}
                                    spacing={spacing}
                                    barBorderRadius={10}
                                    noOfSections={4}
                                    maxValue={caloriesMaxValue}
                                    yAxisThickness={1}
                                    xAxisThickness={1}
                                    yAxisColor="#E5E5EA"
                                    xAxisColor="#E5E5EA"
                                    rulesColor="#E5E5EA"
                                    rulesType="dashed"
                                    yAxisTextStyle={{ color: "#8E8E93", fontSize: 11, fontWeight: "700" }}
                                    xAxisLabelTextStyle={{ color: "#8E8E93", fontSize: 11, fontWeight: "700" }}
                                    hideRules={false}
                                    isAnimated
                                    animationDuration={250}
                                    topLabelContainerStyle={{ marginBottom: 6 }}
                                    hideOrigin
                                    xAxisLabelsHeight={18}
                                    labelsDistanceFromXaxis={8}
                                />
                            </View>
                        )}
                    </View>

                    {/* Macros Chart Card */}
                    <View style={styles.chartCard}>
                        <Text style={styles.cardTitle}>Macros</Text>
                        {nutritionHistory.length === 0 ? (
                            <Text style={{ color: "#8E8E93", paddingTop: 10 }}>
                                No nutrition data.
                            </Text>
                        ) : (
                            <View style={{ alignItems: "center", paddingTop: 10 }}>
                                <LineChart
                                    data={proteinData}
                                    data2={carbsData}
                                    data3={fatData}
                                    color1={Colors.default.strongGreen}
                                    color2={Colors.default.primaryBlue}
                                    color3={Colors.default.berryPurple}
                                    dataPointsColor1={Colors.default.strongGreen}
                                    dataPointsColor2={Colors.default.primaryBlue}
                                    dataPointsColor3={Colors.default.berryPurple}
                                    width={availableWidth}
                                    height={200}
                                    spacing={Math.floor(availableWidth / (numBars || 1))}
                                    noOfSections={4}
                                    maxValue={macrosMaxValue}
                                    yAxisThickness={1}
                                    xAxisThickness={1}
                                    yAxisColor="#E5E5EA"
                                    xAxisColor="#E5E5EA"
                                    rulesColor="#E5E5EA"
                                    rulesType="dashed"
                                    yAxisTextStyle={{ color: "#8E8E93", fontSize: 11, fontWeight: "700" }}
                                    xAxisLabelTextStyle={{ color: "#8E8E93", fontSize: 11, fontWeight: "700" }}
                                    hideRules={false}
                                    curved
                                    isAnimated
                                    animationDuration={500}
                                    thickness={2}
                                    dataPointsRadius={4}
                                    yAxisLabelSuffix="g"
                                    pointerConfig={{
                                        pointerStripColor: "#E5E5EA",
                                        pointerStripWidth: 2,
                                        pointerColor: Colors.default.berryPurple,
                                        radius: 6,
                                        activatePointersOnLongPress: false,
                                        autoAdjustPointerLabelPosition: true,
                                        pointerLabelWidth: 160,
                                        pointerLabelHeight: 100,
                                        pointerLabelComponent: (items: any[]) => {
                                            return (
                                                <View style={styles.tooltipContainer}>
                                                    <Text style={styles.tooltipTitle}>
                                                        {items[0]?.label ?? ''}
                                                    </Text>
                                                    <Text style={[styles.tooltipValue, { color: Colors.default.strongGreen }]}>
                                                        Protein: {Math.round(items[0]?.value ?? 0)}g
                                                    </Text>
                                                    <Text style={[styles.tooltipValue, { color: Colors.default.primaryBlue }]}>
                                                        Carbs: {Math.round(items[1]?.value ?? 0)}g
                                                    </Text>
                                                    <Text style={[styles.tooltipValue, { color: Colors.default.berryPurple }]}>
                                                        Fat: {Math.round(items[2]?.value ?? 0)}g
                                                    </Text>
                                                </View>
                                            );
                                        },
                                    }}
                                />

                                {/* Legend */}
                                <View style={styles.legend}>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: Colors.default.strongGreen }]} />
                                        <Text style={styles.legendText}>Protein</Text>
                                    </View>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: Colors.default.primaryBlue }]} />
                                        <Text style={styles.legendText}>Carbs</Text>
                                    </View>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: Colors.default.berryPurple }]} />
                                        <Text style={styles.legendText}>Fat</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
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
    totalNumber: { fontSize: 52, fontWeight: "800", color: "#5459AC" },
    totalUnit: { fontSize: 20, color: "#8E8E93", fontWeight: "600", marginLeft: 6 },
    totalDate: { fontSize: 16, color: "#8E8E93", fontWeight: "600", marginTop: 2 },
    chartCard: {
        marginTop: 10,
        marginHorizontal: 14,
        backgroundColor: "white",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#E5E5EA",
        padding: 16,
        overflow: "hidden",
    },
    cardTitle: { fontSize: 16, color: "#8E8E93", fontWeight: "600", marginBottom: 6 },
    topLabel: { fontSize: 10, color: Colors.default.berryPurple, fontWeight: "700", marginBottom: 2 },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginTop: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: 12,
        color: "#8E8E93",
        fontWeight: "600",
    },
    tooltipContainer: {
        backgroundColor: "white",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E5E5EA",
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    tooltipTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: "#000",
        marginBottom: 4,
    },
    tooltipValue: {
        fontSize: 11,
        fontWeight: '600',
    },
})
