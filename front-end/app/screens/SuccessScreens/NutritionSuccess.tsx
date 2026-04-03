// NutritionSuccess.tsx
import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Animated, Easing,
} from 'react-native';
import AnimatedBackground from '../../components/AnimateBackground';

const GREEN = '#34C759';

interface Props {
  visible: boolean;
  mealName: string;      // e.g. "Chicken Salad"
  mealType: string;      // e.g. "Lunch"
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  onClose: () => void;
  onViewHistory: () => void;
}

export default function NutritionSuccess({
  visible, mealName, mealType, calories, protein, carbs, fat,
  onClose, onViewHistory,
}: Props) {
  // Card animations
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale   = useRef(new Animated.Value(0.92)).current;

  // Macros row fade-in
  const macrosOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      cardOpacity.setValue(0);
      cardScale.setValue(0.92);
      macrosOpacity.setValue(0);
      return;
    }

    Animated.sequence([
      Animated.delay(2600), // wait for Lottie animation
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1, duration: 320, useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1, friction: 6, tension: 45, useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Macros row fades in
      Animated.timing(macrosOpacity, {
        toValue: 1, duration: 400,
        easing: Easing.out(Easing.quad), useNativeDriver: true,
      }).start();
    });
  }, [visible]);

  return (
    <View style={styles.overlay}>
      <AnimatedBackground
        visible={visible}
        source={require('../../../assets/animations/food.json')}
      />

      {/* ── Success content ── */}
      <Animated.View
        style={[styles.screen, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}
      >
        {/* Check icon */}
        <View style={styles.iconCircle}>
          <Text style={{ fontSize: 36, color: 'white' }}>✓</Text>
        </View>

        <Text style={styles.header}>Meal Logged!</Text>
        <Text style={styles.subtitle}>Fuel your body right!</Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <Stat label="meal" value={mealName} />
          <View style={styles.divider} />
          <Stat label="type" value={mealType} />
          <View style={styles.divider} />
          <Stat label="calories" value={String(calories)} />
        </View>

        {/* Macros row */}
        <Animated.View style={[styles.macrosRow, { opacity: macrosOpacity }]}>
          <MacroStat label="Protein" value={protein} unit="g" />
          <MacroStat label="Carbs" value={carbs} unit="g" />
          <MacroStat label="Fat" value={fat} unit="g" />
        </Animated.View>

        {/* Buttons */}
        <TouchableOpacity style={styles.primaryBtn} onPress={onViewHistory}>
          <Text style={styles.primaryBtnText}>View Nutrition Data</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
          <Text style={styles.secondaryBtnText}>Done</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MacroStat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <View style={styles.macroStat}>
      <Text style={styles.macroValue}>{value}{unit}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'white',
    justifyContent: 'flex-start', alignItems: 'stretch',
  },
  header: {
    fontSize: 20, fontWeight: '600',
    color: GREEN,
  },
  screen: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: 'transparent',
  },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: GREEN,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
  },
  subtitle: { fontSize: 13, color: '#888', marginBottom: 22 },

  statsRow: {
    width: '100%', flexDirection: 'row',
    justifyContent: 'space-around', alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1.5, borderBottomWidth: 1.5,
    borderColor: '#e8f5e9', marginBottom: 18,
  },
  divider: { width: 1, height: 36, backgroundColor: '#e8f5e9' },
  stat:    { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 20, fontWeight: '700', color: '#0a0a0a' },
  statLabel: {
    fontSize: 10, color: '#999', marginTop: 4,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },

  macrosRow: {
    width: '100%', flexDirection: 'row',
    justifyContent: 'space-evenly', alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 22,
  },
  macroStat: { alignItems: 'center', flex: 1 },
  macroValue: { fontSize: 18, fontWeight: '700', color: GREEN,textAlign: 'center' },
  macroLabel: {
    fontSize: 10, color: '#999', marginTop: 4,
    textTransform: 'uppercase', letterSpacing: 0.6, textAlign: 'center'
  },

  primaryBtn: {
    width: '100%', backgroundColor: GREEN,
    borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 8,
  },
  primaryBtnText:   { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtn:     { width: '100%', backgroundColor: '#e8f5e9', borderRadius: 12, padding: 12, alignItems: 'center' },
  secondaryBtnText: { color: GREEN, fontWeight: '600', fontSize: 14 },
});
