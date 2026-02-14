// code written by Alexis Mae Asuncion

import React, { useState, useLayoutEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import { useUser } from "../../contexts/UserContext";
import { insertHabit } from "../../src/services/habitService";

const FREQUENCY_OPTIONS = ["Daily", "Weekly", "Monthly"] as const; 

const HabitTrackerScreen = () => {
  const navigation = useNavigation();

  const { user } = useUser();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const [habitName, setHabitName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<(typeof FREQUENCY_OPTIONS)[number] | null>(null); 

  const handleSave = async () => {
    if (!habitName.trim() || !frequency) {
      Alert.alert("Please enter a habit name and select a frequency.");
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }

    const result = await insertHabit(user.id, {
      habitName: habitName.trim(),
      description: description.trim() || undefined,
      frequencyLabel: frequency,
    });

    if (result.success) {
      Alert.alert(
        "Habit Saved!",
        `Habit: ${habitName.trim()}\nDescription: ${description.trim() || "None"}\nFrequency: ${frequency}`
      );

      // Reset form
      setHabitName("");
      setDescription("");
      setFrequency(null);
    } else {
      Alert.alert("Error", result.error || "Failed to save habit.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backArrow}>{"←"}</Text>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Habit Tracker</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Page Title */}
          <Text style={styles.pageTitle}>Log Your Habit</Text>

          {/* Habit Name */}
          <Text style={styles.sectionLabel}>Habit Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter habit name..."
            placeholderTextColor="#999"
            value={habitName}
            onChangeText={setHabitName}
          />

          {/* Description */}
          <Text style={styles.sectionLabel}>Description</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter habit description..."
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
          />

          {/* Frequency */}
          <Text style={styles.sectionLabel}>Frequency</Text>
          <View style={styles.frequencyContainer}>
            {FREQUENCY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.frequencyButton,
                  frequency === option && styles.frequencySelected,
                ]}
                onPress={() => setFrequency(option)}
              >
                <Text>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Habit</Text>
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

  frequencyContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  frequencyButton: {
    width: "30%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    alignItems: "center",
  },

  frequencySelected: {
    backgroundColor: "#E0F0FF",
    borderColor: "#007AFF",
  },

  saveButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default HabitTrackerScreen;
