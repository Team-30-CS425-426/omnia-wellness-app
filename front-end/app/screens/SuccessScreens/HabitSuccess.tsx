// HabitSuccess.tsx
import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Animated,
} from 'react-native';
import AnimatedBackground from '../../components/AnimateBackground';

const BLUE = '#007AFF';

interface Props {
  visible: boolean;
  habitName: string;
  frequency: string;
  onClose: () => void;
  onViewHistory: () => void;
}

export default function HabitSuccess({
  visible, habitName, frequency, onClose, onViewHistory,
}: Props) {
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale   = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (!visible) {
      cardOpacity.setValue(0);
      cardScale.setValue(0.92);
      return;
    }

    Animated.sequence([
      Animated.delay(1800),
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1, duration: 200, useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1, friction: 6, tension: 45, useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [visible]);

  return (
    <View style={styles.overlay}>
      <AnimatedBackground
        visible={visible}
        source={require('../../../assets/animations/check.json')}
      />

      <Animated.View
        style={[styles.screen, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}
      >
        <View style={styles.iconCircle}>
          <Text style={{ fontSize: 36, color: 'white' }}>✓</Text>
        </View>

        <Text style={styles.header}>Habit Logged!</Text>
        <Text style={styles.subtitle}>Consistency is key — great work!</Text>

        <View style={styles.statsRow}>
          <Stat label="habit" value={habitName} />
          <View style={styles.divider} />
          <Stat label="frequency" value={frequency} />
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={onViewHistory}>
          <Text style={styles.primaryBtnText}>View History</Text>
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
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
    color: BLUE,
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
    backgroundColor: BLUE,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
  },
  subtitle: { fontSize: 13, color: '#888', marginBottom: 22 },

  statsRow: {
    width: '100%', flexDirection: 'row',
    justifyContent: 'space-around', alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1.5, borderBottomWidth: 1.5,
    borderColor: '#fef3e2', marginBottom: 18,
  },
  divider: { width: 1, height: 36, backgroundColor: '#fef3e2' },
  stat:    { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#0a0a0a', textAlign: 'center' },
  statLabel: {
    fontSize: 10, color: '#999', marginTop: 4,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },

  primaryBtn: {
    width: '100%', backgroundColor: BLUE,
    borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 8,
  },
  primaryBtnText:   { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtn:     { width: '100%', backgroundColor: '#fef3e2', borderRadius: 12, padding: 12, alignItems: 'center' },
  secondaryBtnText: { color: BLUE, fontWeight: '600', fontSize: 14 },
});
