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
 *   - Gradient bars: each bar has a gradient from primaryBlue (bottom) to berryPurple (top)
 *   - Interactive selection: tapping a bar highlights it with a different color
 *   - Top labels: calorie value displayed above each bar
 * 
 * DEPENDENCIES:
 *   - nutritionService.ts: getNutritionHistory() — fetches logged nutrition data
 *   - react-native-gifted-charts: BarChart component for rendering the chart
 */

//Developed by Johan Ramirez
import React, {useState, useCallback} from 'react'
import { router } from 'expo-router';
import { View, Pressable, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { useUser } from '@/contexts/UserContext';
import { getNutritionHistory } from '@/src/services/nutritionService';
import { useFocusEffect } from '@react-navigation/native';

import ThemedView from '../components/ThemedView'
import ThemedText from '../components/ThemedText'
import Spacer from '../components/Spacer'


const HistoricalNutritionData = () => {
    const insets = useSafeAreaInsets();
    const totalTopPadding = insets.top;
    const { user } = useUser();

    // Stores the array of daily nutrition records fetched from the database
    // Each entry has { date, calories, protein, carbs, fat }
    const [nutritionHistory, setNutritionHistory] = useState<any[]>([]);

    // Tracks which bar the user has tapped (null = no selection)
    // Used to change the selected bar's gradient color for visual feedback
    const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);

    // Fetch nutrition history every time the screen comes into focus
    // Uses 7-day lookback — change the number to show more/fewer days
    useFocusEffect(
        useCallback(() => {
            async function fetchHistory() {
                if (!user?.id) return;
                try {
                    const data = await getNutritionHistory(user.id, 7);
                    setNutritionHistory(data);
                } catch (error) {
                    console.error('Error fetching nutrition history:', error);
                }
            }
            fetchHistory();
        }, [user?.id])
    );

    // DYNAMIC BAR SIZING — calculates bar width and spacing so bars fill the screen
    // Accounts for y-axis label space and chart padding
    const screenWidth = Dimensions.get('window').width;
    const yAxisLabelWidth = 40;   // approximate space for y-axis number labels
    const chartPadding = 20;      // horizontal padding around the chart
    const numBars = nutritionHistory.length || 1;
    const spacing = 12;           // gap between bars
    const availableWidth = screenWidth - yAxisLabelWidth - chartPadding;
    const barWidth = Math.floor((availableWidth - (spacing * (numBars + 1))) / numBars);

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
    // Each bar gets a gradient (showGradient), a value label on top, and an onPress handler

    const barData = nutritionHistory.map((d, i) => ({
        value: d.calories,
        label: d.date.slice(5),  // "MM-DD" — strips the year for a compact x-axis label
        showGradient: true,
        
        // Gradient colors change when a bar is selected to provide visual feedback
        frontColor: selectedBarIndex === i ? Colors.default.berryPurple : Colors.default.primaryBlue,      // bottom of gradient
        gradientColor: selectedBarIndex === i ? Colors.default.berryPurple : Colors.default.berryPurple,   // top of gradient

        // Toggle selection: tapping the same bar again deselects it
        
        onPress: () => setSelectedBarIndex(selectedBarIndex === i ? null : i),
        // Calorie value label displayed above each bar
        topLabelComponent: () => (
            <ThemedText style={{ fontSize: 10, color: Colors.default.berryBlue, marginBottom: 4 }}>
                {d.calories}
            </ThemedText>
        ),
    }));

    return (
        <ThemedView style = {[styles.container, {paddingTop : totalTopPadding + 20}]}>
            <ThemedView style = {[styles.header]}>

                <Pressable onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </Pressable>

                <ThemedView style = {{flex: 1, alignItems: 'center',}}>
                    <ThemedText
                        style = {{textAlign: 'center', marginBottom: 0,}}
                        title={true} 
                        gradient={true} 
                        gradientColors={[Colors.default.primaryBlue, Colors.default.berryPurple]}> 
                        Nutrition Data 
                    </ThemedText>
                 </ThemedView>

                <View style={{ width: 24 }} />

            </ThemedView>

            <ScrollView style = {{width: '100%'}}>
                <Spacer height={20} />

                <ThemedText style = {{color: Colors.default.violet, fontSize: 18, fontWeight: 'bold', marginBottom:10, textAlign: 'center'}}>
                    Calories
                </ThemedText>
                {nutritionHistory.length > 0 && (
                    <View style={{ alignItems: 'center' }}>
                        <BarChart
                            data={barData}
                            width={availableWidth}
                            height={200}
                            barWidth={barWidth}
                            barBorderRadius={6}
                            spacing={spacing}
                            noOfSections={4}
                            maxValue={2500}
                            yAxisThickness={1}
                            xAxisThickness={1}
                            yAxisColor={Colors.default.mediumGray}
                            xAxisColor={Colors.default.mediumGray}
                            yAxisTextStyle={{ color: Colors.default.berryBlue, fontSize: 10 }}
                            xAxisLabelTextStyle={{ color: Colors.default.berryBlue, fontSize: 10 }}
                            rulesColor={Colors.default.mediumGray}
                            rulesType="dashed"
                            hideRules={false}
                            isAnimated = {true}
                            animationDuration={1000}
                        />
                    </View>
                )}

                <Spacer height={30} />

                {/* ── Macros Line Chart ── */}
                <ThemedText style={{ color: Colors.default.violet, fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
                    Macros
                </ThemedText>

                {nutritionHistory.length > 0 && (
                    <View style={{ alignItems: 'center' }}>
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
                            maxValue={300}
                            yAxisThickness={1}
                            xAxisThickness={1}
                            yAxisColor={Colors.default.mediumGray}
                            xAxisColor={Colors.default.mediumGray}
                            yAxisTextStyle={{ color: Colors.default.berryBlue, fontSize: 10 }}
                            xAxisLabelTextStyle={{ color: Colors.default.berryBlue, fontSize: 10 }}
                            rulesColor={Colors.default.mediumGray}
                            rulesType="dashed"
                            hideRules={false}
                            curved
                            isAnimated
                            animationDuration={1000}
                            thickness={2}
                            dataPointsRadius={4}
                            yAxisLabelSuffix="g"
                            pointerConfig={{
                                pointerStripColor: Colors.default.mediumGray,
                                pointerStripWidth: 2,
                                pointerColor: Colors.default.berryBlue,
                                radius: 6,
                                activatePointersOnLongPress: false,
                                autoAdjustPointerLabelPosition: true,
                                pointerLabelWidth: 160,
                                pointerLabelHeight: 100,
                                pointerLabelComponent: (items: any[]) => {
                                    return (
                                        <View style={styles.tooltipContainer}>
                                            <ThemedText style={styles.tooltipTitle}>
                                                {items[0]?.label ?? ''}
                                            </ThemedText>
                                            <ThemedText style={[styles.tooltipValue, { color: Colors.default.strongGreen }]}>
                                                Protein: {Math.round(items[0]?.value ?? 0)}g
                                            </ThemedText>
                                            <ThemedText style={[styles.tooltipValue, { color: Colors.default.primaryBlue }]}>
                                                Carbs: {Math.round(items[1]?.value ?? 0)}g
                                            </ThemedText>
                                            <ThemedText style={[styles.tooltipValue, { color: Colors.default.berryPurple }]}>
                                                Fat: {Math.round(items[2]?.value ?? 0)}g
                                            </ThemedText>
                                        </View>
                                    );
                                },
                            }}
                        />

                        {/* Legend */}
                        <View style={styles.legend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: Colors.default.strongGreen }]} />
                                <ThemedText style={styles.legendText}>Protein</ThemedText>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: Colors.default.primaryBlue }]} />
                                <ThemedText style={styles.legendText}>Carbs</ThemedText>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: Colors.default.berryPurple }]} />
                                <ThemedText style={styles.legendText}>Fat</ThemedText>
                            </View>
                        </View>
                    </View>
                )}

                <Spacer height={30} />

            </ScrollView>

        </ThemedView>
    )
}

export default HistoricalNutritionData

const styles = StyleSheet.create({
    container: {
        flex:1,
        alignItems:'center',
        justifyContent:'flex-start'
    },
    subHeader:{ 
        fontWeight : '600',
        fontSize : 24,
    },
    header: {
        width: '100%',
        paddingHorizontal: 25,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        height: 50,
    },
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
        color: Colors.default.berryBlue,
    },
    tooltipContainer: {
        backgroundColor: Colors.default.white,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.default.mediumGray,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    tooltipTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.default.berryBlue,
        marginBottom: 4,
    },
    tooltipValue: {
        fontSize: 11,
        fontWeight: '600',
    },
})
