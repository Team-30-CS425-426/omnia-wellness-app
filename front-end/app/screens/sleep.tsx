// code written by Alexis Mae Asuncion

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
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";

import { useUser } from "../../contexts/UserContext";
import {
  insertSleepLog,
  formatHoursToHMin,
  SleepQualityLabel,
} from "../../src/services/sleepLogService";

const SLEEP_QUALITIES = ["Excellent", "Good", "Fair", "Poor", "Very Poor"] as const;
type SleepQuality = (typeof SLEEP_QUALITIES)[number];

const SleepTrackerScreen = () => {
  const navigation = useNavigation();
  const { user } = useUser();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const [sleepStart, setSleepStart] = useState(new Date()); // bedtime
  const [wakeTime, setWakeTime] = useState(new Date());
  const [sleepQuality, setSleepQuality] = useState<SleepQuality | null>(null);
  const [notes, setNotes] = useState("");

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showWakePicker, setShowWakePicker] = useState(false);

  // Handles saving sleep data to Supabase
  const handleSave = async () => {
    if (!sleepQuality) {
      Alert.alert("Please select sleep quality.");
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }

    // Save to Supabase
    const result = await insertSleepLog(user.id, {
      bedTime: sleepStart,
      wakeTime: wakeTime,
      sleepQualityLabel: sleepQuality as SleepQualityLabel,
      notes: notes || undefined,
      // date is optional - backend defaults to today
    });

    // Handle backend response 
    if (result.success) {
      // Convert decimal hours into readable text, ex: 7h 30min
      const hoursText =
        result.data?.hoursSlept != null
          ? formatHoursToHMin(Number(result.data.hoursSlept))
          : "N/A";

      Alert.alert(
        "Sleep Entry Saved!",
        `Bed: ${sleepStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}\n` +
          `Wake: ${wakeTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}\n` +
          `Duration: ${hoursText}\n` +
          `Quality: ${sleepQuality}`
      );

      setSleepStart(new Date());
      setWakeTime(new Date());
      setSleepQuality(null);
      setNotes("");
    } else {
      // Backend returned an error
      Alert.alert("Error", result.error || "Failed to save sleep entry");
    }
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
            <Text style={styles.headerTitle}>Sleep Tracker</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Page Title */}
          <Text style={styles.pageTitle}>Log Your Sleep</Text>

          {/* Sleep Start */}
          <Text style={styles.sectionLabel}>Sleep Start</Text>
          <TouchableOpacity style={styles.timeInput} onPress={() => setShowStartPicker(true)}>
            <Text>
              {sleepStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </TouchableOpacity>
          {showStartPicker && (
            <DateTimePicker
              value={sleepStart}
              mode="time"
              onChange={(event, selectedDate) => {
                setShowStartPicker(false);
                if (selectedDate) setSleepStart(selectedDate);
              }}
            />
          )}

          {/* Wake Time */}
          <Text style={styles.sectionLabel}>Wake Time</Text>
          <TouchableOpacity style={styles.timeInput} onPress={() => setShowWakePicker(true)}>
            <Text>
              {wakeTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </TouchableOpacity>
          {showWakePicker && (
            <DateTimePicker
              value={wakeTime}
              mode="time"
              onChange={(event, selectedDate) => {
                setShowWakePicker(false);
                if (selectedDate) setWakeTime(selectedDate);
              }}
            />
          )}

          {/* Sleep Quality */}
          <Text style={styles.sectionLabel}>Sleep Quality</Text>
          <View style={styles.qualityContainer}>
            {SLEEP_QUALITIES.map((quality) => (
              <TouchableOpacity
                key={quality}
                style={[
                  styles.qualityButton,
                  sleepQuality === quality && styles.qualitySelected,
                ]}
                onPress={() => setSleepQuality(quality)}
              >
                <Text>{quality}</Text>
              </TouchableOpacity>
            ))}
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
            <Text style={styles.saveButtonText}>Save Sleep</Text>
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

  timeInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },

  qualityContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  qualityButton: {
    width: "48%",
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    alignItems: "center",
  },

  qualitySelected: {
    backgroundColor: "#E0F0FF",
    borderColor: "#007AFF",
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
    fontWeight: "bold",
  },
});

export default SleepTrackerScreen;