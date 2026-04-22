// MoodStressSuccess.tsx
import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Animated, Easing,
} from 'react-native';
import AnimatedBackground from '../../components/AnimateBackground';

const RED = '#EB5353';

interface Props {
  visible: boolean;
  mood: string;        // e.g. "Good"
  moodEmoji: string;   // e.g. "😊"
  stressLevel: number; // 1-10
  onClose: () => void;
  onViewHistory: () => void;
}

export default function MoodStressSuccess({
  visible, mood, moodEmoji, stressLevel, onClose, onViewHistory,
}: Props) {
  // Card animations
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale   = useRef(new Animated.Value(0.92)).current;

  // Stress bar
  const barWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      cardOpacity.setValue(0);
      cardScale.setValue(0.92);
      barWidth.setValue(0);
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
      // Stress bar fills
      Animated.timing(barWidth, {
        toValue: 1, duration: 600,
        easing: Easing.out(Easing.quad), useNativeDriver: false,
      }).start();
    });
  }, [visible]);

  // Stress level 1-10 maps to 10%-100%
  const barFill = `${Math.min(stressLevel * 10, 100)}%`;

  return (
    <View style={styles.overlay}>
      <AnimatedBackground
        visible={visible}
        source={require('../../../assets/animations/yoga.json')}
      />

      {/* ── Success content ── */}
      <Animated.View
        style={[styles.screen, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}
      >
        {/* Check icon */}
        <View style={styles.iconCircle}>
          <Text style={{ fontSize: 36, color: 'white' }}>✓</Text>
        </View>

        <Text style={styles.header}>Mood & Stress Logged!</Text>
        <Text style={styles.subtitle}>Keep tracking — you're doing great!</Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <Stat label="mood" value={`${moodEmoji} ${mood}`} />
          
        </View>

        {/* Stress level bar */}
        <View style={styles.barSection}>
          <View style={styles.barHeader}>
            <Text style={styles.barLabel}>Stress Level</Text>
            <Text style={styles.barValue}>{stressLevel}/10</Text>
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

        {/* Buttons */}
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
    color: RED,
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
    backgroundColor: RED,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
  },
  subtitle: { fontSize: 13, color: '#888', marginBottom: 22 },

  statsRow: {
    width: '100%', flexDirection: 'row',
    justifyContent: 'space-around', alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1.5, borderBottomWidth: 1.5,
    borderColor: '#fde8e8', marginBottom: 18,
  },
  divider: { width: 1, height: 36, backgroundColor: '#fde8e8' },
  stat:    { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#0a0a0a' },
  statLabel: {
    fontSize: 10, color: '#999', marginTop: 4,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },

  barSection: { width: '100%', marginBottom: 22 },
  barHeader:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  barLabel:   { fontSize: 12, color: '#888' },
  barValue:   { fontSize: 12, fontWeight: '600', color: RED },
  barTrack:   { width: '100%', height: 6, backgroundColor: '#fde8e8', borderRadius: 4, overflow: 'hidden' },
  barFill:    { height: '100%', backgroundColor: RED, borderRadius: 4 },

  primaryBtn: {
    width: '100%', backgroundColor: RED,
    borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 8,
  },
  primaryBtnText:   { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtn:     { width: '100%', backgroundColor: '#fde8e8', borderRadius: 12, padding: 12, alignItems: 'center' },
  secondaryBtnText: { color: RED, fontWeight: '600', fontSize: 14 },
});
