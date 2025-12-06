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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const MOODS = [
  { label: "Very Low", emoji: "😞" },
  { label: "Low", emoji: "🙁" },
  { label: "Neutral", emoji: "😐" },
  { label: "Good", emoji: "😊" },
  { label: "Excellent", emoji: "😁" },
];

const MoodStressScreen = () => {
  const navigation = useNavigation();

  // Hide default header
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [stressLevel, setStressLevel] = useState(5);
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    if (!selectedMood) {
      Alert.alert("Please select your mood before saving.");
      return;
    }

    const entry = {
      mood: selectedMood,
      stress: stressLevel,
      notes,
      date: new Date(),
    };

    console.log("Mood & Stress Entry:", entry);

    Alert.alert(
      "Mood & Stress Saved!",
      `Mood: ${selectedMood}\nStress Level: ${stressLevel}`
    );

    // Reset
    setSelectedMood(null);
    setStressLevel(5);
    setNotes("");
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>

        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Mood & Stress</Text>

          <View style={{ width: 60 }}>
            {/* Layout balancer */}
          </View>
        </View>

        {/* Page Title */}
        <Text style={styles.pageTitle}>Log Your Mood & Stress</Text>

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
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: "#fff" 
  },

  /* HEADER */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 40,
    paddingBottom: 10,
  },

  backButton: { 
    flexDirection: "row", 
    alignItems: "center" 
  },

  backArrow: { 
    fontSize: 22, 
    fontWeight: "600", 
    marginRight: 6 
  },

  backText: { 
    fontSize: 18 
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
    marginVertical: 10 
  },

  /* MOOD SECTION */
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
    backgroundColor: "#E0F0FF",
    borderColor: "#007AFF",
    borderWidth: 1,
  },
  
  emoji: { 
    fontSize: 32 
  },

  moodLabel: { 
    marginTop: 5, 
    fontSize: 14, 
    textAlign: "center" 
  },

  /* STRESS SECTION */
  stressControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 20,
  },

  stressValue: { 
    fontSize: 22, 
    fontWeight: "bold" 
  },

  /* NOTES */
  notesInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    height: 80,
    marginBottom: 20,
    textAlignVertical: "top",
  },

  /* SAVE BUTTON */
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

export default MoodStressScreen;