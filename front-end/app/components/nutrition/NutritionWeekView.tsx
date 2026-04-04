/**
 * NutritionWeekView.tsx
 *
 * Week tab content for the Nutrition historical data screen.
 * Renders a BarChart for calories and a LineChart for macros (protein, carbs, fat).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { Colors } from '../../../constants/Colors';

type Props = {
    barData: any[];
    proteinData: any[];
    carbsData: any[];
    fatData: any[];
    availableWidth: number;
    barWidth: number;
    spacing: number;
    caloriesMaxValue: number;
    macrosMaxValue: number;
    numBars: number;
    hasData: boolean;
};

const NutritionWeekView = ({
    barData,
    proteinData,
    carbsData,
    fatData,
    availableWidth,
    barWidth,
    spacing,
    caloriesMaxValue,
    macrosMaxValue,
    numBars,
    hasData,
}: Props) => {
    if (!hasData) {
        return (
            <>
                <View style={styles.chartCard}>
                    <Text style={styles.cardTitle}>Calories</Text>
                    <Text style={styles.noData}>No nutrition data.</Text>
                </View>
                <View style={styles.chartCard}>
                    <Text style={styles.cardTitle}>Macros</Text>
                    <Text style={styles.noData}>No nutrition data.</Text>
                </View>
            </>
        );
    }

    return (
        <>
            {/* Calories BarChart */}
            <View style={styles.chartCard}>
                <Text style={styles.cardTitle}>Calories</Text>
                <View style={{ alignItems: 'center', paddingTop: 10 }}>
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
                        yAxisTextStyle={{ color: '#8E8E93', fontSize: 11, fontWeight: '700' }}
                        xAxisLabelTextStyle={{ color: '#8E8E93', fontSize: 11, fontWeight: '700' }}
                        hideRules={false}
                        isAnimated
                        animationDuration={400}
                        hideOrigin
                        xAxisLabelsHeight={18}
                        labelsDistanceFromXaxis={8}
                    />
                </View>
            </View>

            {/* Macros LineChart */}
            <View style={styles.chartCard}>
                <Text style={styles.cardTitle}>Macros</Text>
                <View style={{ alignItems: 'center', paddingTop: 10 }}>
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
                        yAxisTextStyle={{ color: '#8E8E93', fontSize: 11, fontWeight: '700' }}
                        xAxisLabelTextStyle={{ color: '#8E8E93', fontSize: 11, fontWeight: '700' }}
                        hideRules={false}
                        curved
                        isAnimated
                        animationDuration={500}
                        thickness={2}
                        dataPointsRadius={4}
                        yAxisLabelSuffix="g"
                        pointerConfig={{
                            pointerStripColor: '#E5E5EA',
                            pointerStripWidth: 2,
                            pointerColor: Colors.default.berryPurple,
                            radius: 6,
                            activatePointersOnLongPress: false,
                            autoAdjustPointerLabelPosition: true,
                            pointerLabelWidth: 160,
                            pointerLabelHeight: 100,
                            pointerLabelComponent: (items: any[]) => {
                                const dateLabel = items[0]?.label ?? '';
                                return (
                                    <View style={styles.tooltipContainer}>
                                        <Text style={styles.tooltipTitle}>{dateLabel}</Text>
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
            </View>
        </>
    );
};

export default NutritionWeekView;

const styles = StyleSheet.create({
    chartCard: {
        marginTop: 10,
        marginHorizontal: 14,
        backgroundColor: 'white',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        padding: 16,
        overflow: 'hidden',
    },
    cardTitle: { fontSize: 16, color: '#8E8E93', fontWeight: '600', marginBottom: 6 },
    noData: { color: '#8E8E93', paddingTop: 10 },
    tooltipContainer: {
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    tooltipTitle: { fontSize: 12, fontWeight: 'bold', color: '#000', marginBottom: 4 },
    tooltipValue: { fontSize: 11, fontWeight: '600' },
    legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 12, color: '#8E8E93', fontWeight: '600' },
});
