import React, { useState, useLayoutEffect } from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import ThemedView from "../components/ThemedView";
import ThemedText from "../components/ThemedText";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GoalsScreen = () => {
    const insets = useSafeAreaInsets();
    const totalTopPadding = insets.top;
    const navigation = useNavigation();

    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

  return (
    <ThemedView style = {[styles.container, {paddingTop : totalTopPadding + 25}]}>
        <ThemedView style = {[styles.headerRow]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style = {styles.backButton}>
                <Text>← Back</Text>
            </TouchableOpacity>
      </ThemedView>
      <ThemedText title={true}>Set Goals</ThemedText>
      
      {/* Add your goals form/UI here */}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',     // Aligns children horizontally
    alignItems: 'center',      // Centers items vertically relative to each other
    marginBottom: 20,          // Adds space below the header
    paddingHorizontal: 15,     // Optional: padding for the sides
  },
  backButton: {
    marginRight: 10,           // Space between the arrow and the text
  },
});

export default GoalsScreen;