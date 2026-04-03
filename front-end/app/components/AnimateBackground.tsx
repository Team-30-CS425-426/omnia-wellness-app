// app/components/AnimateBackground.tsx
import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';

const { width: W, height: H } = Dimensions.get('window');

interface Props {
  visible: boolean;
  source?: any; // require('...animation.json')
}

export default function AnimatedBackground({ visible, source }: Props) {
  const lottieRef = useRef<LottieView>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      opacity.setValue(1);
      lottieRef.current?.reset();
      lottieRef.current?.play();

      // Start fading out after a delay (adjust to match your Lottie's peak)
      Animated.timing(opacity, {
        toValue: 0,
        duration: 800,       // how long the fade takes
        delay: 2000,         // how long to wait before fading
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <LottieView
        ref={lottieRef}
        source={source ?? require('../../assets/animations/workout.json')}
        loop={false}
        autoPlay={false}
        style={styles.lottie}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
});