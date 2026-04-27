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
import HabitSuccess from "./SuccessScreens/HabitSuccess";

import { useUser } from "../../contexts/UserContext";
import { insertHabit } from "../../src/services/habitService";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";

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

  const [showSuccess, setShowSuccess] = useState(false);
  const [loggedHabitName, setLoggedHabitName] = useState('');
  const [loggedFrequency, setLoggedFrequency] = useState('');

  const handleSave = async () => {
    Keyboard.dismiss();
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
      setLoggedHabitName(habitName.trim());
      setLoggedFrequency(frequency);
      setShowSuccess(true);

      setHabitName("");
      setDescription("");
      setFrequency(null);
    } else {
      Alert.alert("Error", result.error || "Failed to save habit.");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ width: 70, alignItems: "flex-start" }}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Ionicons name="chevron-back" size={24} color="black" />
                  <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.pageTitle}>Log Habit</Text>

              <View style={{ width: 70 }} />
            </View>

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

      {showSuccess && (
        <View style={StyleSheet.absoluteFill}>
          <HabitSuccess
            visible={showSuccess}
            habitName={loggedHabitName}
            frequency={loggedFrequency}
            onClose={() => setShowSuccess(false)}
            onViewHistory={() => {
              setShowSuccess(false);
              navigation.goBack();
            }}
          />
        </View>
      )}
    </View>
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
    paddingTop: 50,
    paddingBottom: 22,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: -6,
  },

  backArrow: {
    fontSize: 22,
    fontWeight: "600",
    marginRight: 6,
  },

  backText: {
    fontSize: 17,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },

  pageTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.default.primaryBlue,
    textAlign: "center",
    flex: 1,
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
    backgroundColor: "#EAF2FF",
    borderColor: Colors.default.primaryBlue,
  },

  saveButton: {
    backgroundColor: Colors.default.primaryBlue,
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
