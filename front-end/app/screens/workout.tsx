/*import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function WorkoutScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Workout Tracker</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center" },
    title: { fontSize: 24, fontWeight: "bold" },
});
*/

/*
// test to create back button
// works, navigates back to the home page
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function WorkoutScreen() {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            {/* Back Button }
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>

            {/* Title }
            <Text style={styles.title}>Workout Tracker</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center" },
    backButton: {
        position: "absolute",
        top: 50,
        left: 20,
        padding: 10,
    },
    backText: {
        fontSize: 18,
        fontWeight: "600",
    },
    title: { fontSize: 24, fontWeight: "bold" },
});
*/

/*
// attempt: back button with custom header
// works, go with this one so far
import React, { useLayoutEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function WorkoutScreen() {
    const navigation = useNavigation();

    // Hide default header from within this file only
    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, []);

    return (
        <View style={styles.container}>

            {/* Custom Header }
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backArrow}>←</Text>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Workout Tracker</Text>

                {/* Empty placeholder to balance layout }
                <View style={{ width: 60 }} />
            </View>

            {/* Body content }
            <Text>Your workout content here...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
        backgroundColor: "#fff",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 15,
        height: 50,
    },
    backButton: {
        flexDirection: "row",
        alignItems: "center",
    },
    backArrow: {
        fontSize: 20,
        fontWeight: "600",
        marginRight: 5,
    },
    backText: {
        fontSize: 18,
        fontWeight: "500",
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
        flex: 1,
    },
});
*/


/*
// attempt: taken from FR-Daily-CheckIns, except working with back button and header title
// works for now 
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
import { Dropdown } from "react-native-element-dropdown";
import { useNavigation } from "@react-navigation/native";

const WorkoutScreen = () => {
  const navigation = useNavigation();

  // Hide default header
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  // STATE
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

  // SAVE HANDLER
  const handleSave = () => {
    if (!workoutType || !duration || !intensity) {
      Alert.alert("Please fill out all required fields.");
      return;
    }

    const finalWorkoutType =
      workoutType === "Other" && customWorkout.trim() !== ""
        ? customWorkout.trim()
        : workoutType;

    const entry = {
      workoutType: finalWorkoutType,
      duration: parseInt(duration),
      intensity,
      notes,
      date: new Date(),
    };

    Alert.alert(
      "Workout Saved!",
      `Type: ${finalWorkoutType}\nDuration: ${duration} minutes\nIntensity: ${intensity}`
    );

    setWorkoutType(null);
    setCustomWorkout("");
    setDuration("");
    setIntensity(null);
    setNotes("");
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>

        {/* Custom Header }
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Workout Tracker</Text>
          <View style={{ width: 60 }} /> {/* Layout balancer }
        </View>

        {/* Page Title }
        <Text style={styles.pageTitle}>Workout Tracker</Text>

        {/* Workout Type }
        <Text style={styles.sectionLabel}>Workout Type</Text>
        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          data={workoutOptions}
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder="Select Workout Type..."
          value={workoutType}
          onChange={(item) => setWorkoutType(item.value)}
        />

        {/* Custom workout entry }
        {workoutType === "Other" && (
          <TextInput
            style={styles.notesInput}
            placeholder="Enter your workout..."
            placeholderTextColor="#999"
            value={customWorkout}
            onChangeText={setCustomWorkout}
          />
        )}

        {/* Duration }
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

        {/* Intensity }
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

        {/* Notes }
        <Text style={styles.sectionLabel}>Notes (Optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Add notes about your workout..."
          placeholderTextColor="#999"
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        {/* Save Button }
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Workout</Text>
        </TouchableOpacity>

      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },

  /* HEADER 
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 40,
    paddingBottom: 10,
  },
  backButton: { flexDirection: "row", alignItems: "center" },
  backArrow: { fontSize: 22, fontWeight: "600", marginRight: 6 },
  backText: { fontSize: 18 },
  headerTitle: { fontSize: 20, fontWeight: "bold", textAlign: "center", flex: 1 },

  pageTitle: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },

  /* FORM 
  sectionLabel: { fontSize: 16, fontWeight: "500", marginVertical: 10 },

  dropdown: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  placeholderStyle: { fontSize: 16, color: "#999" },
  selectedTextStyle: { fontSize: 16, color: "#000" },

  durationContainer: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  durationInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  durationLabel: { marginLeft: 10, fontSize: 16, color: "#555" },

  intensityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
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
  intensitySelected: { backgroundColor: "#E0F0FF", borderColor: "#007AFF" },
  intensityText: { fontSize: 16 },

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
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default WorkoutScreen;

*/

/*
// attempt: added suggestions
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

  // STATE
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

  // SAVE HANDLER
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

          {/* Custom Header }
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backArrow}>←</Text>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Workout Tracker</Text>
            <View style={{ width: 60 }} /> {/* Layout balancer }
          </View>

          {/* Workout Type }
          <Text style={styles.sectionLabel}>Workout Type</Text>
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            data={workoutOptions}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Select Workout Type..."
            value={workoutType}
            onChange={(item) => setWorkoutType(item.value)}
          />

          {/* Custom workout entry }
          {workoutType === "Other" && (
            <TextInput
              style={styles.notesInput}
              placeholder="Enter your workout..."
              placeholderTextColor="#999"
              value={customWorkout}
              onChangeText={setCustomWorkout}
            />
          )}

          {/* Duration }
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

          {/* Intensity }
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

          {/* Notes }
          <Text style={styles.sectionLabel}>Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add notes about your workout..."
            placeholderTextColor="#999"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          {/* Save Button }
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Workout</Text>
          </TouchableOpacity>

        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },

  /* HEADER 
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 40,
    paddingBottom: 10,
  },
  backButton: { flexDirection: "row", alignItems: "center" },
  backArrow: { fontSize: 22, fontWeight: "600", marginRight: 6 },
  backText: { fontSize: 18 },
  headerTitle: { fontSize: 20, fontWeight: "bold", textAlign: "center", flex: 1 },

  /* FORM 
  sectionLabel: { fontSize: 16, fontWeight: "500", marginVertical: 10 },

  dropdown: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  placeholderStyle: { fontSize: 16, color: "#999" },
  selectedTextStyle: { fontSize: 16, color: "#000" },

  durationContainer: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  durationInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  durationLabel: { marginLeft: 10, fontSize: 16, color: "#555" },

  intensityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
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
  intensitySelected: { backgroundColor: "#E0F0FF", borderColor: "#007AFF" },
  intensityText: { fontSize: 16 },

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
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default WorkoutScreen;
*/


/*
// to fix terminal error from code above
// above is fixed, no errors currently
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

          {/* Custom Header }
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backArrow}>{"←"}</Text>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Workout Tracker</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Workout Type }
          <Text style={styles.sectionLabel}>Workout Type</Text>
          <Dropdown
            style={styles.dropdown}
            placeholder="Select Workout Type..."
            placeholderStyle={styles.placeholderStyle}
            //placeholder={<Text style={styles.placeholderStyle}>Select Workout Type...</Text>}
            selectedTextStyle={styles.selectedTextStyle}
            data={workoutOptions}
            maxHeight={300}
            labelField="label"
            valueField="value"
            value={workoutType}
            onChange={(item) => setWorkoutType(item.value)}
          />

          {/* Custom workout entry }
          {workoutType === "Other" && (
            <TextInput
              style={styles.notesInput}
              placeholder="Enter your workout..."
              placeholderTextColor="#999"
              value={customWorkout}
              onChangeText={setCustomWorkout}
            />
          )}

          {/* Duration }
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

          {/* Intensity }
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

          {/* Notes }
          <Text style={styles.sectionLabel}>Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add notes about your workout..."
            placeholderTextColor="#999"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          {/* Save Button }
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Workout</Text>
          </TouchableOpacity>

        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 40,
    paddingBottom: 10,
  },
  backButton: { flexDirection: "row", alignItems: "center" },
  backArrow: { fontSize: 22, fontWeight: "600", marginRight: 6 },
  backText: { fontSize: 18 },
  headerTitle: { fontSize: 20, fontWeight: "bold", textAlign: "center", flex: 1 },

  sectionLabel: { fontSize: 16, fontWeight: "500", marginVertical: 10 },

  dropdown: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  placeholderStyle: { fontSize: 16, color: "#999" },
  selectedTextStyle: { fontSize: 16, color: "#000" },

  durationContainer: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  durationInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  durationLabel: { marginLeft: 10, fontSize: 16, color: "#555" },

  intensityContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 25 },
  intensityButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginHorizontal: 5,
    borderRadius: 10,
    alignItems: "center",
  },
  intensitySelected: { backgroundColor: "#E0F0FF", borderColor: "#007AFF" },
  intensityText: { fontSize: 16 },

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
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default WorkoutScreen;
*/



/*
// attempt: adding log to see in VS code terminal
// update: works
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

    // ✅ This will now show in your terminal, just like the Mood & Stress screen
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

          {/* Custom Header }
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backArrow}>{"←"}</Text>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Workout Tracker</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Workout Type }
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

          {/* Custom workout entry }
          {workoutType === "Other" && (
            <TextInput
              style={styles.notesInput}
              placeholder="Enter your workout..."
              placeholderTextColor="#999"
              value={customWorkout}
              onChangeText={setCustomWorkout}
            />
          )}

          {/* Duration }
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

          {/* Intensity }
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

          {/* Notes }
          <Text style={styles.sectionLabel}>Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add notes about your workout..."
            placeholderTextColor="#999"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          {/* Save Button }
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Workout</Text>
          </TouchableOpacity>

        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 40,
    paddingBottom: 10,
  },
  backButton: { flexDirection: "row", alignItems: "center" },
  backArrow: { fontSize: 22, fontWeight: "600", marginRight: 6 },
  backText: { fontSize: 18 },
  headerTitle: { fontSize: 20, fontWeight: "bold", textAlign: "center", flex: 1 },

  sectionLabel: { fontSize: 16, fontWeight: "500", marginVertical: 10 },

  dropdown: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  placeholderStyle: { fontSize: 16, color: "#999" },
  selectedTextStyle: { fontSize: 16, color: "#000" },

  durationContainer: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  durationInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  durationLabel: { marginLeft: 10, fontSize: 16, color: "#555" },

  intensityContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 25 },
  intensityButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginHorizontal: 5,
    borderRadius: 10,
    alignItems: "center",
  },
  intensitySelected: { backgroundColor: "#E0F0FF", borderColor: "#007AFF" },
  intensityText: { fontSize: 16 },

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
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default WorkoutScreen;
*/

// adding extra title screen
// currently works right now
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
