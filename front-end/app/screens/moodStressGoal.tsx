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
import { Ionicons } from "@expo/vector-icons";

import { useUser } from "../../contexts/UserContext";
import {
  insertMoodGoal,
  checkMoodGoalExists,
} from "../../src/services/moodGoalService";

const MOODS = [
  { value: 1, label: "Very Low", emoji: "😞" },
  { value: 2, label: "Low", emoji: "🙁" },
  { value: 3, label: "Neutral", emoji: "😐" },
  { value: 4, label: "Good", emoji: "😊" },
  { value: 5, label: "Excellent", emoji: "😁" },
];

const MoodStressGoalScreen = () => {
  const navigation = useNavigation();
  const { user } = useUser();
  const { mode } = useLocalSearchParams<{ mode?: string }>();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const [targetMood, setTargetMood] = useState<number | null>(null);
  const [targetStressLevel, setTargetStressLevel] = useState(5);
  const [dailyCheckins, setDailyCheckins] = useState("");

  const decreaseStress = () => {
    setTargetStressLevel((prev) => Math.max(1, prev - 1));
  };

  const increaseStress = () => {
    setTargetStressLevel((prev) => Math.min(10, prev + 1));
  };

  const handleSave = async () => {
    const parsedDailyCheckins = parseInt(dailyCheckins, 10);

    if (
      targetMood === null ||
      targetMood < 1 ||
      targetMood > 5 ||
      targetStressLevel < 1 ||
      targetStressLevel > 10 ||
      isNaN(parsedDailyCheckins) ||
      parsedDailyCheckins <= 0
    ) {
      Alert.alert(
        "Please enter valid values. Select a mood, choose a stress level from 1 to 10, and enter daily check-ins greater than 0."
      );
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }

    if (mode !== "edit") {
      try {
        const exists = await checkMoodGoalExists(user.id);
        if (exists) {
          Alert.alert("Error", "Mood goal already exists.");
          return;
        }
      } catch (error) {
        Alert.alert("Error", "Failed to check mood goal existence.");
        return;
      }
    }

    try {
      await insertMoodGoal(user.id, {
        targetMood,
        targetStressLevel,
        dailyCheckins: parsedDailyCheckins,
      });

      const selectedMood = MOODS.find((m) => m.value === targetMood);

      Alert.alert(
        "Mood Goal Saved!",
        `Target Mood: ${selectedMood?.label} ${selectedMood?.emoji}\nTarget Stress: ${targetStressLevel}/10\nDaily Check-ins: ${parsedDailyCheckins}`
      );

      setTargetMood(null);
      setTargetStressLevel(5);
      setDailyCheckins("");
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save mood goal");
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
            <Text style={styles.headerTitle}>Mood & Stress Goal</Text>
            <View style={{ width: 60 }} />
          </View>

          <Text style={styles.pageTitle}>Set Your Mood Goal</Text>

          <Text style={styles.sectionLabel}>Target Mood</Text>
          <View style={styles.moodContainer}>
            {MOODS.map((mood) => {
              const isSelected = targetMood === mood.value;

              return (
                <TouchableOpacity
                  key={mood.value}
                  style={[
                    styles.moodButton,
                    isSelected && styles.selectedMoodButton,
                  ]}
                  onPress={() => setTargetMood(mood.value)}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text
                    style={[
                      styles.moodLabel,
                      isSelected && styles.selectedMoodLabel,
                    ]}
                  >
                    {mood.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>
            Target Stress Level: {targetStressLevel}
          </Text>

          <View style={styles.stressStepperContainer}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={decreaseStress}
            >
              <Ionicons name="remove-circle-outline" size={42} color="#000" />
            </TouchableOpacity>

            <Text style={styles.stressValue}>{targetStressLevel}</Text>

            <TouchableOpacity
              style={styles.stepperButton}
              onPress={increaseStress}
            >
              <Ionicons name="add-circle-outline" size={42} color="#000" />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Daily Check-ins</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter daily check-ins"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={dailyCheckins}
            onChangeText={setDailyCheckins}
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
  moodContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  moodButton: {
    width: "18%",
    minWidth: 58,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  selectedMoodButton: {
    borderColor: "#007AFF",
    backgroundColor: "#EAF3FF",
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 10,
    textAlign: "center",
    color: "#444",
  },
  selectedMoodLabel: {
    fontWeight: "600",
    color: "#007AFF",
  },
  stressStepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 10,
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  stepperButton: {
    padding: 8,
  },
  stressValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
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

export default MoodStressGoalScreen;
