import React, { useLayoutEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useUser } from "../../contexts/UserContext";
import { insertSleepGoal } from "../../src/services/sleepGoalService";
import Slider from "@react-native-community/slider";

export default function SleepGoalsScreen() {
  const navigation = useNavigation();
  const { user } = useUser();

  const [sleepGoalHours, setSleepGoalHours] = useState("");
  const [successRate, setSuccessRate] = useState(70);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const handleSave = async () => {
    const parsedHours = parseFloat(sleepGoalHours);

    if (isNaN(parsedHours) || parsedHours <= 0) {
      Alert.alert("Please enter a valid number of hours.");
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }

    try {
      await insertSleepGoal(user.id, parsedHours, successRate);
      Alert.alert("Sleep Goal Saved!", `Goal: ${parsedHours} hours`);
      setSleepGoalHours("");
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save sleep goal");
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
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backArrow}>{"←"}</Text>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sleep Goal</Text>
            <View style={{ width: 60 }} />
          </View>

          <Text style={styles.pageTitle}>Set Your Sleep Goal</Text>

          <Text style={styles.sectionLabel}>Success Rate: {successRate}%</Text>
          <Slider
            style={styles.slider}
            minimumValue={50}
            maximumValue={100}
            step={5}
            value={successRate}
            minimumTrackTintColor="#187498"
            maximumTrackTintColor="#E5E5EA"
            thumbTintColor="#187498"
            onValueChange={setSuccessRate}
          />

          <Text style={styles.sectionLabel}>Hours of Sleep</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter sleep goal in hours"
            placeholderTextColor="#999"
            keyboardType="decimal-pad"
            value={sleepGoalHours}
            onChangeText={setSleepGoalHours}
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Set Goal</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

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
  pageTitle: { textAlign: "center", fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  sectionLabel: { fontSize: 16, fontWeight: "500", marginVertical: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  slider: {
    width: "100%",
    height: 40,
    marginBottom: 20,
  },
});