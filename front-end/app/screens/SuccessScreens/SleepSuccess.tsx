// SleepSuccess.tsx
import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Animated, Easing,
} from 'react-native';
import AnimatedBackground from '../../components/AnimateBackground';
import { Colors } from '@/constants/Colors';


const SLEEPY_BLUE = Colors.default.sleepyBlue;

interface Props {
  visible: boolean;
  hoursSlept: number;      // e.g. 7.5
  bedtime: string;         // e.g. "10:30 PM"
  sleepQuality: number;    // 1-10
  onClose: () => void;
  onViewHistory: () => void;
}

export default function SleepSuccess({
  visible, hoursSlept, bedtime, sleepQuality, onClose, onViewHistory,
}: Props) {
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale   = useRef(new Animated.Value(0.92)).current;
  const barWidth    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      cardOpacity.setValue(0);
      cardScale.setValue(0.92);
      barWidth.setValue(0);
      return;
    }

    Animated.sequence([
      Animated.delay(2600),
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1, duration: 320, useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1, friction: 6, tension: 45, useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      Animated.timing(barWidth, {
        toValue: 1, duration: 600,
        easing: Easing.out(Easing.quad), useNativeDriver: false,
      }).start();
    });
  }, [visible]);

  const barFill = `${Math.min(sleepQuality * 10, 100)}%`;

  return (
    <View style={styles.overlay}>
      <AnimatedBackground
        visible={visible}
        source={require('../../../assets/animations/sleep.json')}
      />

      <Animated.View
        style={[styles.screen, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}
      >
        <View style={styles.iconCircle}>
          <Text style={{ fontSize: 36, color: 'white' }}>✓</Text>
        </View>

        <Text style={styles.header}>Sleep Logged!</Text>
        <Text style={styles.subtitle}>Rest well — recovery is part of the journey!</Text>

        <View style={styles.statsRow}>
          <Stat label="hours slept" value={`${hoursSlept}h`} />
          <View style={styles.divider} />
          <Stat label="bedtime" value={bedtime} />
        </View>

        <View style={styles.barSection}>
          <View style={styles.barHeader}>
            <Text style={styles.barLabel}>Sleep Quality</Text>
            <Text style={styles.barValue}>{sleepQuality}/10</Text>
          </View>
          <View style={styles.barTrack}>
            <Animated.View
              style={[
                styles.barFill,
                {
                  width: barWidth.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', barFill],
                  }),
                },
              ]}
            />
          </View>
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
      <Text style={styles.statValue}>{value}</Text>
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
    color: SLEEPY_BLUE,
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
    backgroundColor: SLEEPY_BLUE,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
  },
  subtitle: { fontSize: 13, color: '#888', marginBottom: 22 },

  statsRow: {
    width: '100%', flexDirection: 'row',
    justifyContent: 'space-around', alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1.5, borderBottomWidth: 1.5,
    borderColor: '#F0EDFF', marginBottom: 18,
  },
  divider: { width: 1, height: 36, backgroundColor: '##F0EDFF' },
  stat:    { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#0a0a0a' },
  statLabel: {
    fontSize: 10, color: '#999', marginTop: 4,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },

  barSection: { width: '100%', marginBottom: 22 },
  barHeader:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  barLabel:   { fontSize: 12, color: '#888' },
  barValue:   { fontSize: 12, fontWeight: '600', color: SLEEPY_BLUE },
  barTrack:   { width: '100%', height: 6, backgroundColor: '#F0EDFF', borderRadius: 4, overflow: 'hidden' },
  barFill:    { height: '100%', backgroundColor: SLEEPY_BLUE, borderRadius: 4 },

  primaryBtn: {
    width: '100%', backgroundColor: SLEEPY_BLUE,
    borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 8,
  },
  primaryBtnText:   { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtn:     { width: '100%', backgroundColor: '#F0EDFF', borderRadius: 12, padding: 12, alignItems: 'center' },
  secondaryBtnText: { color: SLEEPY_BLUE, fontWeight: '600', fontSize: 14 },
});
