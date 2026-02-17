//Developed by Johan Ramirez
import React, {useState, useCallback} from 'react'
import { router } from 'expo-router';
import { View, Pressable, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { BarChart } from 'react-native-gifted-charts';
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
    const [nutritionHistory, setNutritionHistory] = useState<any[]>([]);
    const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);

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

    // Calculate dynamic bar sizing to fill screen width
    const screenWidth = Dimensions.get('window').width;
    const yAxisLabelWidth = 40;
    const chartPadding = 20;
    const numBars = nutritionHistory.length || 1;
    const spacing = 12;
    const availableWidth = screenWidth - yAxisLabelWidth - chartPadding;
    const barWidth = Math.floor((availableWidth - (spacing * (numBars + 1))) / numBars);

    // Transform data for react-native-gifted-charts
    const barData = nutritionHistory.map((d, i) => ({
        value: d.calories,
        label: d.date.slice(5),  // "MM-DD"
        frontColor: selectedBarIndex === i ? Colors.default.berryPurple : Colors.default.berryBlue,
        onPress: () => setSelectedBarIndex(selectedBarIndex === i ? null : i),
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
                            isAnimated = {false}
                        />
                    </View>
                )}

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
    }
    
})
