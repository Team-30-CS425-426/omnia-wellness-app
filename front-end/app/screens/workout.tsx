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
import { Dropdown } from "react-native-element-dropdown";
import { useNavigation } from "@react-navigation/native";

const WorkoutScreen = () => {
  const navigation = useNavigation();

  // Hide default header
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // State
  const [workoutType, setWorkoutType] = useState<string | null>(null);
  const [customWorkout, setCustomWorkout] = useState("");
  const [duration, setDuration] = useState("");
  const [intensity, setIntensity] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const INTENSITIES = ["Low", "Medium", "High"];

  const workoutOptions = [
    { label: "Running", value: "Running" },
    { label: "Strength Training", value: "Strength Training" },
    { label: "Core / Ab Training", value: "Core / Ab Training" },
    { label: "Functional Strength Training", value: "Functional Strength Training" },
    { label: "Pilates", value: "Pilates" },
    { label: "HIIT", value: "HIIT" },
    { label: "Cycling", value: "Cycling" },
    { label: "CrossFit", value: "CrossFit" },
    { label: "Yoga", value: "Yoga" },
    { label: "Other", value: "Other" },
  ];

  const handleSave = () => {
    if (!workoutType || !duration || !intensity) {
      Alert.alert("Please fill out all required fields.");
      return;
    }

    const parsedDuration = parseInt(duration, 10);
    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      Alert.alert("Please enter a valid duration in minutes.");
      return;
    }

    const finalWorkoutType =
      workoutType === "Other" && customWorkout.trim() !== ""
        ? customWorkout.trim()
        : workoutType;

    if (!finalWorkoutType) {
      Alert.alert("Please provide a name for your custom workout.");
      return;
    }

    const entry = {
      workoutType: finalWorkoutType,
      duration: parsedDuration,
      intensity,
      notes,
      date: new Date(),
    };

    // LOG to terminal
    console.log("Workout Entry:", entry);

    Alert.alert(
      "Workout Saved!",
      `Type: ${finalWorkoutType}\nDuration: ${parsedDuration} minutes\nIntensity: ${intensity}`
    );

    // Reset form
    setWorkoutType(null);
    setCustomWorkout("");
    setDuration("");
    setIntensity(null);
    setNotes("");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>

          {/* Custom Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backArrow}>{"←"}</Text>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Workout Tracker</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Page Title */}
          <Text style={styles.pageTitle}>Log Your Workout</Text>

          {/* Workout Type */}
          <Text style={styles.sectionLabel}>Workout Type</Text>
          <Dropdown
            style={styles.dropdown}
            placeholder="Select Workout Type..."
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            data={workoutOptions}
            maxHeight={300}
            labelField="label"
            valueField="value"
            value={workoutType}
            onChange={(item) => setWorkoutType(item.value)}
          />

          {/* Custom workout entry */}
          {workoutType === "Other" && (
            <TextInput
              style={styles.notesInput}
              placeholder="Enter your workout..."
              placeholderTextColor="#999"
              value={customWorkout}
              onChangeText={setCustomWorkout}
            />
          )}

          {/* Duration */}
          <Text style={styles.sectionLabel}>Duration</Text>
          <View style={styles.durationContainer}>
            <TextInput
              style={styles.durationInput}
              placeholder="0"
              keyboardType="numeric"
              value={duration}
              onChangeText={setDuration}
            />
            <Text style={styles.durationLabel}>minutes</Text>
          </View>

          {/* Intensity */}
          <Text style={styles.sectionLabel}>Intensity</Text>
          <View style={styles.intensityContainer}>
            {INTENSITIES.map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.intensityButton,
                  intensity === level && styles.intensitySelected,
                ]}
                onPress={() => {
                  Keyboard.dismiss();
                  setIntensity(level);
                }}
              >
                <Text style={styles.intensityText}>{level}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Notes */}
          <Text style={styles.sectionLabel}>Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add notes about your workout..."
            placeholderTextColor="#999"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Workout</Text>
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
    backgroundColor: "#fff" 
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
    flex: 1 
  },

  pageTitle: { 
    textAlign: "center", 
    fontSize: 22, 
    fontWeight: "bold", 
    marginBottom: 20 
  },

  sectionLabel: { 
    fontSize: 16, 
    fontWeight: "500", 
    marginVertical: 10 
  },

  dropdown: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
  },

  placeholderStyle: { 
    fontSize: 16, 
    color: "#999" 
  },
  
  selectedTextStyle: { 
    fontSize: 16, 
    color: "#000" 
  },

  durationContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 20 
  },

  durationInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },

  durationLabel: { 
    marginLeft: 10, 
    fontSize: 16, 
    color: "#555" 
  },

  intensityContainer: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: 25 
  },

  intensityButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginHorizontal: 5,
    borderRadius: 10,
    alignItems: "center",
  },

  intensitySelected: { 
    backgroundColor: "#E0F0FF", 
    borderColor: "#007AFF" 
  },

  intensityText: { 
    fontSize: 16 
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
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  saveButtonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "bold" 
  },
});

export default WorkoutScreen;
