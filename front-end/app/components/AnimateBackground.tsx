import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Dimensions, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');

// Wrap Path so we can animate its props
const AnimatedPath = Animated.createAnimatedComponent(Path);

// 1500 ensures the dash covers the full length of the curve on most screens
const STROKE_LENGTH = 1500; 

export default function AnimatedBackground({ visible }: { visible: boolean }) {
  const dash1 = useRef(new Animated.Value(STROKE_LENGTH)).current;
  const dash2 = useRef(new Animated.Value(STROKE_LENGTH)).current;

  useEffect(() => {
    if (!visible) {
      // Reset to hidden state
      dash1.setValue(STROKE_LENGTH);
      dash2.setValue(STROKE_LENGTH);
      return;
    }

    const drawLine = (anim: Animated.Value, delay: number) =>
      Animated.timing(anim, {
        toValue: 0,
        duration: 4000,
        delay,
        easing: Easing.out(Easing.cubic), // exponential easing feels more "premium"
        useNativeDriver: false, 
      });

    Animated.parallel([
      drawLine(dash1, 0),
      drawLine(dash2, 300), // Staggered start for a more natural look
    ]).start();
  }, [visible]);

  return (
    <Svg
      width={W}
      height={H}
      style={StyleSheet.absoluteFill} // Positions it behind your content
      viewBox={`0 0 ${W} ${H}`}
    >
      {/* Top Wave: Arcs UP then flattens */}
      <AnimatedPath
        d={`M -20 ${H * 0.22} 
            C ${W * 0.3} ${H * 0.05}, 
              ${W * 0.7} ${H * 0.25}, 
              ${W + 50} ${H * 0.15}`}
        stroke="#005BB5"
        strokeWidth={55} // Thicker stroke to match the asset
        strokeLinecap="round"
        fill="none"
        strokeDasharray={STROKE_LENGTH}
        strokeDashoffset={dash1}
      />

      {/* Bottom Wave: Arcs DOWN then peaks UP */}
      <AnimatedPath
        d={`M -20 ${H * 0.75} 
            C ${W * 0.3} ${H * 0.95}, 
              ${W * 0.7} ${H * 0.65}, 
              ${W + 50} ${H * 0.85}`}
        stroke="#005BB5"
        strokeWidth={55}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={STROKE_LENGTH}
        strokeDashoffset={dash2}
      />
    </Svg>
  );
}