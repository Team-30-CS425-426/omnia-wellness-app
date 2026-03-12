// Code written by Alexis Mae Asuncion

import React, { useState, useLayoutEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";

import { useUser } from "../../contexts/UserContext";
import {
  insertActivityGoal,
  checkActivityGoalExists,
} from "../../src/services/activityGoalService";

const ActivityGoalScreen = () => {
  const navigation = useNavigation();
  const { user } = useUser();
  const { mode } = useLocalSearchParams<{ mode?: string }>();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const [weeklyMinutes, setWeeklyMinutes] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState("");

  const handleSave = async () => {
    const parsedWeeklyMinutes = parseInt(weeklyMinutes, 10);
    const parsedDaysPerWeek = parseInt(daysPerWeek, 10);

    if (
      isNaN(parsedWeeklyMinutes) ||
      parsedWeeklyMinutes <= 0 ||
      isNaN(parsedDaysPerWeek) ||
      parsedDaysPerWeek <= 0 ||
      parsedDaysPerWeek > 7
    ) {
      Alert.alert(
        "Please enter valid numbers. Weekly minutes must be greater than 0 and days per week must be between 1 and 7."
      );
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }

    if (mode !== "edit") {
      try {
        const exists = await checkActivityGoalExists(user.id);
        if (exists) {
          Alert.alert("Error", "Activity goal already exists.");
          return;
        }
      } catch (error) {
        Alert.alert("Error", "Failed to check activity goal existence.");
        return;
      }
    }

    try {
      await insertActivityGoal(user.id, {
        weeklyMinutes: parsedWeeklyMinutes,
        daysPerWeek: parsedDaysPerWeek,
      });

      Alert.alert(
        "Activity Goal Saved!",
        `Weekly Minutes: ${parsedWeeklyMinutes}\nDays Per Week: ${parsedDaysPerWeek}`
      );

      setWeeklyMinutes("");
      setDaysPerWeek("");
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save activity goal");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backArrow}>{"←"}</Text>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Activity Tracker</Text>
            <View style={{ width: 60 }} />
          </View>

          <Text style={styles.pageTitle}>Set Your Activity Goal</Text>

          <Text style={styles.sectionLabel}>Weekly Activity Minutes</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter weekly minutes"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={weeklyMinutes}
            onChangeText={setWeeklyMinutes}
          />

          <Text style={styles.sectionLabel}>Days Per Week</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter days per week"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={daysPerWeek}
            onChangeText={setDaysPerWeek}
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Set Goal</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 40,
    paddingBottom: 10,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backArrow: {
    fontSize: 22,
    fontWeight: "600",
    marginRight: 6,
  },
  backText: {
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  pageTitle: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ActivityGoalScreen;