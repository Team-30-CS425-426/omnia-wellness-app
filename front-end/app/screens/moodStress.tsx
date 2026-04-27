// code written by Alexis Mae Asuncion

import React, { useState, useLayoutEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  Text,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";

// user + service import
import { useUser } from "../../contexts/UserContext";
import { insertStressLog } from "../../src/services/moodStressService";
import MoodStressSuccess from "./SuccessScreens/MoodStressSuccess";

// ADDED: import the mood streak refresh function
import { refreshMoodStreak } from "../../src/services/moodStreakService"; // changed to moodStreakService

// ADDED: import badge awarding
import { checkAndAwardMoodBadges } from "../../src/services/badgeAwardService";

import { Colors } from "@/constants/Colors";

const MOODS = [
  { label: "Very Low", emoji: "😞" },
  { label: "Low", emoji: "🙁" },
  { label: "Neutral", emoji: "😐" },
  { label: "Good", emoji: "😊" },
  { label: "Excellent", emoji: "😁" },
] as const;

type MoodLabel = (typeof MOODS)[number]["label"];

const MoodStressScreen = () => {
  const navigation = useNavigation();

  const { user } = useUser();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const [selectedMood, setSelectedMood] = useState<MoodLabel | null>(null);
  const [stressLevel, setStressLevel] = useState(5);
  const [notes, setNotes] = useState("");

  // Success screen state
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMood, setSuccessMood] = useState("");
  const [successMoodEmoji, setSuccessMoodEmoji] = useState("");
  const [successStressLevel, setSuccessStressLevel] = useState(5);

  // Save handler (backend connection)
  const handleSave = async () => {
    if (!selectedMood) {
      Alert.alert("Please select your mood before saving.");
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }

    if (stressLevel < 1 || stressLevel > 10) {
      Alert.alert("Error", "Stress level must be between 1 and 10.");
      return;
    }

    const result = await insertStressLog(user.id, {
      moodLabel: selectedMood,
      stressLevel,
      notes: notes || undefined,
      meditated: false,
    });

    if (result.success) {
      // Find the emoji for the selected mood
      const moodEntry = MOODS.find((m) => m.label === selectedMood);
      setSuccessMood(selectedMood);
      setSuccessMoodEmoji(moodEntry?.emoji ?? "");
      setSuccessStressLevel(stressLevel);
      setSuccessVisible(true);

      // CHANGED: reset form immediately
      setSelectedMood(null);
      setStressLevel(5);
      setNotes("");

      // CHANGED: run streak + badge logic in background
      refreshMoodStreak(user.id)
        .then(() => {
          // ADDED: award badges AFTER streak updates
          return checkAndAwardMoodBadges(user.id);
        })
        .catch((error) => {
          console.error("Failed to refresh mood streak / badges:", error);
        });

    } else {
      Alert.alert("Error", result.error || "Failed to save mood & stress entry");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {successVisible ? (
        <MoodStressSuccess
          visible={successVisible}
          mood={successMood}
          moodEmoji={successMoodEmoji}
          stressLevel={successStressLevel}
          onClose={() => setSuccessVisible(false)}
          onViewHistory={() => {
            setSuccessVisible(false);
            router.push("/historicalMoodStressData" as any);
          }}
        />
      ) : (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            {/* Custom Header */}
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

              <Text style={styles.pageTitle}>Log Mood & Stress</Text>

              <View style={{ width: 70 }} />
            </View>

            {/* Mood Selector */}
            <Text style={styles.sectionLabel}>Select Your Mood</Text>
            <View style={styles.moodContainer}>
              {MOODS.map((mood) => (
                <TouchableOpacity
                  key={mood.label}
                  style={[
                    styles.moodButton,
                    selectedMood === mood.label && styles.moodSelected,
                  ]}
                  onPress={() => setSelectedMood(mood.label)}
                >
                  <Text style={styles.emoji}>{mood.emoji}</Text>
                  <Text style={styles.moodLabel}>{mood.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Stress Level */}
            <Text style={styles.sectionLabel}>Stress Level: {stressLevel}</Text>
            <View style={styles.stressControls}>
              <TouchableOpacity
                onPress={() => setStressLevel((prev) => Math.max(1, prev - 1))}
              >
                <Ionicons name="remove-circle-outline" size={36} />
              </TouchableOpacity>

              <Text style={styles.stressValue}>{stressLevel}</Text>

              <TouchableOpacity
                onPress={() => setStressLevel((prev) => Math.min(10, prev + 1))}
              >
                <Ionicons name="add-circle-outline" size={36} />
              </TouchableOpacity>
            </View>

            {/* Notes */}
            <Text style={styles.sectionLabel}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add notes..."
              placeholderTextColor="#999"
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      )}
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
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.default.candyRed,
    textAlign: "center",
    flex: 1,
  },

  sectionLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginVertical: 10,
  },

  moodContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  moodButton: {
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    width: 65,
  },

  moodSelected: {
    backgroundColor: "#FDECEC",
    borderColor: Colors.default.candyRed,
    borderWidth: 1,
  },

  emoji: {
    fontSize: 40,
  },

  moodLabel: {
    marginTop: 5,
    fontSize: 10, //14
    textAlign: "center",
  },

  stressControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 20,
  },

  stressValue: {
    fontSize: 22,
    fontWeight: "bold",
  },

  notesInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    height: 80,
    marginBottom: 20,
    textAlignVertical: "top",
  },

  saveButton: {
    backgroundColor: Colors.default.candyRed,
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

export default MoodStressScreen;
