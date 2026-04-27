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
import { router } from "expo-router";
import SleepSuccess from "./SuccessScreens/SleepSuccess";

import { useUser } from "../../contexts/UserContext";
import {
  insertSleepLog,
  SleepQualityLabel,
} from "../../src/services/sleepLogService";

// ADDED: import sleep streak refresh
import { refreshSleepStreak } from "../../src/services/sleepStreakService";

// ADDED: import sleep badge awarding
import { checkAndAwardSleepBadges } from "../../src/services/badgeAwardService";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";

const SLEEP_QUALITIES = ["Excellent", "Good", "Fair", "Poor", "Very Poor"] as const;
type SleepQuality = (typeof SLEEP_QUALITIES)[number];

const qualityToNumber: Record<string, number> = {
  'Excellent': 10, 'Good': 8, 'Fair': 6, 'Poor': 4, 'Very Poor': 2,
};

const SleepTrackerScreen = () => {
  const navigation = useNavigation();
  const { user } = useUser();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const [sleepStart, setSleepStart] = useState(new Date());
  const [wakeTime, setWakeTime] = useState(new Date());
  const [sleepQuality, setSleepQuality] = useState<SleepQuality | null>(null);
  const [notes, setNotes] = useState("");

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showWakePicker, setShowWakePicker] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);
  const [loggedHours, setLoggedHours] = useState(0);
  const [loggedBedtime, setLoggedBedtime] = useState('');
  const [loggedQuality, setLoggedQuality] = useState(0);
  // ADDED: helper to reset form
  const resetForm = () => {
    setSleepStart(new Date());
    setWakeTime(new Date());
    setSleepQuality(null);
    setNotes("");
  };

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

    // ADDED: trim notes before save
    const trimmedNotes = notes.trim();

    const result = await insertSleepLog(user.id, {
      bedTime: sleepStart,
      wakeTime: wakeTime,
      sleepQualityLabel: sleepQuality as SleepQualityLabel,
      notes: trimmedNotes || undefined,
      // date is optional - backend defaults to today
    });

    if (result.success) {
      setLoggedHours(Number(result.data?.hoursSlept ?? 0));
      setLoggedBedtime(
        sleepStart.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
      setLoggedQuality(qualityToNumber[sleepQuality] ?? 5);
      setShowSuccess(true);
    
      resetForm();
    
      refreshSleepStreak(user.id)
        .then(() => checkAndAwardSleepBadges(user.id))
        .catch((error) => {
          console.error("Failed to refresh sleep streak / badges:", error);
        });
    } else {
      Alert.alert("Error", result.error || "Failed to save sleep entry");
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

            <Text style={styles.pageTitle}>Log Your Sleep</Text>

            <View style={{ width: 70 }} />
          </View>
  
            <Text style={styles.sectionLabel}>Sleep Start</Text>
            <TouchableOpacity
              style={styles.timeInput}
              onPress={() => setShowStartPicker(true)}
            >
              <Text>
                {sleepStart.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </TouchableOpacity>
  
            {showStartPicker && (
              <DateTimePicker
                value={sleepStart}
                mode="time"
                onChange={(event, selectedDate) => {
                  
                  if (selectedDate) setSleepStart(selectedDate);
                }}
              />
            )}
  
            <Text style={styles.sectionLabel}>Wake Time</Text>
            <TouchableOpacity
              style={styles.timeInput}
              onPress={() => setShowWakePicker(true)}
            >
              <Text>
                {wakeTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </TouchableOpacity>
  
            {showWakePicker && (
              <DateTimePicker
                value={wakeTime}
                mode="time"
                onChange={(event, selectedDate) => {
                  
                  if (selectedDate) setWakeTime(selectedDate);
                }}
              />
            )}
  
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
  
            <Text style={styles.sectionLabel}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add notes..."
              placeholderTextColor="#999"
              value={notes}
              onChangeText={setNotes}
              multiline
            />
  
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Sleep</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
  
      {showSuccess && (
        <View style={StyleSheet.absoluteFill}>
          <SleepSuccess
            visible={showSuccess}
            hoursSlept={loggedHours}
            bedtime={loggedBedtime}
            sleepQuality={loggedQuality}
            onClose={() => setShowSuccess(false)}
            onViewHistory={() => {
              setShowSuccess(false);
              router.push("/historicalSleepData" as any);
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

  backText: {
    fontSize: 17,
  },

  pageTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.default.sleepyBlue,
    textAlign: "center",
    flex: 1,
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
    backgroundColor: "#F0EDFF",
    borderColor: Colors.default.sleepyBlue,
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
    backgroundColor: Colors.default.sleepyBlue,
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
