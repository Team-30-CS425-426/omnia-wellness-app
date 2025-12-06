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
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";

const FREQUENCY_OPTIONS = ["Daily", "Weekly", "Monthly"];

const HabitTrackerScreen = () => {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const [habitName, setHabitName] = useState("");
  const [frequency, setFrequency] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    if (!habitName || !frequency) {
      Alert.alert("Please enter a habit name and select a frequency.");
      return;
    }

    const entry = {
      habitName,
      frequency,
      startDate: startDate.toDateString(),
      notes,
      dateLogged: new Date(),
    };

    console.log("Habit Entry:", entry);

    Alert.alert(
      "Habit Saved!",
      `Habit: ${habitName}\nFrequency: ${frequency}\nStart Date: ${startDate.toDateString()}`
    );

    // Reset form
    setHabitName("");
    setFrequency(null);
    setStartDate(new Date());
    setNotes("");
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
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
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

          {/* Frequency */}
          <Text style={styles.sectionLabel}>Frequency</Text>
          <View style={styles.frequencyContainer}>
            {FREQUENCY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.frequencyButton, frequency === option && styles.frequencySelected]}
                onPress={() => setFrequency(option)}
              >
                <Text>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Start Date */}
          <Text style={styles.sectionLabel}>Start Date</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Text>{startDate.toDateString()}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setStartDate(selectedDate);
              }}
            />
          )}

          {/* Notes */}
          <Text style={styles.sectionLabel}>Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add notes about this habit..."
            placeholderTextColor="#999"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

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

  input: { 
    borderWidth: 1, 
    borderColor: "#ccc", 
    borderRadius: 8, 
    padding: 10, 
    marginBottom: 10, 
    fontSize: 16 
  },

  frequencyContainer: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: 20 
  },

  frequencyButton: { 
    width: "30%", 
    padding: 12, 
    borderWidth: 1, 
    borderColor: "#ccc", 
    borderRadius: 10, 
    alignItems: "center" 
  },

  frequencySelected: { 
    backgroundColor: "#E0F0FF", 
    borderColor: "#007AFF" 
  },

  dateInput: { 
    borderWidth: 1, 
    borderColor: "#ccc", 
    borderRadius: 8, 
    padding: 12, 
    marginBottom: 20 
  },

  notesInput: { 
    borderWidth: 1, 
    borderColor: "#ccc", 
    borderRadius: 8, 
    padding: 10, 
    height: 80, 
    marginBottom: 20, 
    textAlignVertical: "top" 
  },

  saveButton: { 
    backgroundColor: "#007AFF", 
    padding: 15, 
    borderRadius: 12, 
    alignItems: "center" 
  },

  saveButtonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "bold" 
  },
});

export default HabitTrackerScreen;
