import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type DashboardGoalRingProps = {
  label: string;
  valueText: string;
  progress: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  onPress?: () => void;
};

export default function DashboardGoalRing({
  label,
  valueText,
  progress,
  color,
  size = 82,
  strokeWidth = 6,
  onPress,
}: DashboardGoalRingProps) {
  const clampedProgress = Math.max(0, Math.min(progress, 1));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - clampedProgress);

  return (
    <Pressable onPress={onPress} style={styles.wrapper}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            stroke="#E5E5E5"
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          <Circle
            stroke={color}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>

        <View style={styles.centerTextContainer}>
          <Text style={styles.valueText}>{valueText}</Text>
        </View>
      </View>

      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  valueText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1A1A1A',
  },
  label: {
    marginTop: 8,
    fontSize: 17,
    color: '#000',
  },
});