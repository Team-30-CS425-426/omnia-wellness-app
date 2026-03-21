// ActivitySuccessModal.tsx
import React, { useEffect, useRef } from 'react';
import {
  Modal, View, Text, TouchableOpacity,
  StyleSheet, Animated, Dimensions, Easing,
} from 'react-native';
import Svg, { Path } from "react-native-svg";
import AnimatedBackground from '../../components/AnimateBackground'; // adjust path as needed

const { width: W, height: H } = Dimensions.get('window');

const AnimatedPath = Animated.createAnimatedComponent(Path);
const STROKE_LENGTH = 1200; // approximate path length — tweak if needed

const BLUE = '#007AFF';

const workoutOptions: Record<string, string> = {
  '1': 'Running', '2': 'Strength Training', '3': 'Core / Ab Training',
  '4': 'Functional Strength Training', '5': 'Pilates', '6': 'HIIT',
  '7': 'Cycling', '8': 'CrossFit', '9': 'Yoga', '10': 'Other',
};

const intensityWidth: Record<string, string> = {
  Low: '33%', Medium: '66%', High: '100%',
};

interface Props {
  visible: boolean;
  workoutType: string;   // e.g. "1"
  duration: number;      // minutes
  intensity: 'Low' | 'Medium' | 'High';
  onClose: () => void;
  onViewActivity: () => void;
}

export default function ActivitySuccessModal({
  visible, workoutType, duration, intensity, onClose, onViewActivity,
}: Props) {
  // Card animations
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale   = useRef(new Animated.Value(0.92)).current;

  // Intensity bar
  const barWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      cardOpacity.setValue(0);
      cardScale.setValue(0.92);
      barWidth.setValue(0);
      return;
    }

    Animated.sequence([
    Animated.delay(1500), // wait for waves to draw
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1, duration: 320, useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1, friction: 6, tension: 45, useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // 4. Intensity bar fills
      Animated.timing(barWidth, {
        toValue: 1, duration: 600,
        easing: Easing.out(Easing.quad), useNativeDriver: false,
      }).start();
    });
  }, [visible]);

  const barFill = intensityWidth[intensity] ?? '66%';

  return (

      <View style={styles.overlay}>
        <AnimatedBackground visible = {visible}/>

        {/* ── Success card ── */}
        <Animated.View
          style={[styles.screen, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}
        >
          {/* Check icon */}
          <View style={styles.iconCircle}>
            {/* Replace with your icon lib, e.g. <Ionicons name="checkmark" size={36} color="#fff" /> */}
            <Text style={{ fontSize: 36, color: 'white' }}>✓</Text>
          </View>

          <Text style={styles.header}>Workout Logged!</Text>

          <Text style={styles.subtitle}>Great work — keep it up!</Text>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <Stat label="mins"      value={String(duration)} />
            <View style={styles.divider} />
            <Stat label="type"      value={workoutOptions[workoutType] ?? '—'} />
            <View style={styles.divider} />
            <Stat label="intensity" value={intensity} />
          </View>

          {/* Intensity bar */}
          <View style={styles.barSection}>
            <View style={styles.barHeader}>
              <Text style={styles.barLabel}>Intensity Level</Text>
              <Text style={styles.barValue}>{intensity}</Text>
            </View>
            <View style={styles.barTrack}>
              <Animated.View
                style={[
                    styles.barFill,
                    {
                      width: barWidth.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', barFill], // barFill = 33%, 66%, or 100%
                      }),
                    },
                  ]}
              />
            </View>
          </View>

          {/* Buttons */}
          <TouchableOpacity style={styles.primaryBtn} onPress={onViewActivity}>
            <Text style={styles.primaryBtnText}>View Activity</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
            <Text style={styles.secondaryBtnText}>Done</Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, small && { fontSize: 14 }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'white',
    justifyContent: 'flex-start', alignItems: 'stretch',
  },
  header:{
    fontSize: 20, fontWeight: '600',
    color: BLUE
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
  eyebrow: {
    fontSize: 11, fontWeight: '600',
    letterSpacing: 1.8, color: BLUE,
    textTransform: 'uppercase', marginBottom: 4,
  },
  workoutName: {
    fontSize: 24, fontWeight: '700',
    color: '#0a0a0a', textAlign: 'center', marginBottom: 4,
  },
  subtitle: { fontSize: 13, color: '#888', marginBottom: 22 },

  statsRow: {
    width: '100%', flexDirection: 'row',
    justifyContent: 'space-around', alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1.5, borderBottomWidth: 1.5,
    borderColor: '#e8f0fe', marginBottom: 18,
  },
  divider: { width: 1, height: 36, backgroundColor: '#e8f0fe' },
  stat:    { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#0a0a0a' },
  statLabel: {
    fontSize: 10, color: '#999', marginTop: 4,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },

  barSection: { width: '100%', marginBottom: 22 },
  barHeader:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  barLabel:   { fontSize: 12, color: '#888' },
  barValue:   { fontSize: 12, fontWeight: '600', color: BLUE },
  barTrack:   { width: '100%', height: 6, backgroundColor: '#e8f0fe', borderRadius: 4, overflow: 'hidden' },
  barFill:    { height: '100%', backgroundColor: BLUE, borderRadius: 4 },

  primaryBtn: {
    width: '100%', backgroundColor: BLUE,
    borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 8,
  },
  primaryBtnText:   { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtn:     { width: '100%', backgroundColor: '#e8f0fe', borderRadius: 12, padding: 12, alignItems: 'center' },
  secondaryBtnText: { color: BLUE, fontWeight: '600', fontSize: 14 },
});