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
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";

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
          <View style={{ width: 70, alignItems: "flex-start" }}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color="black" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.pageTitle}>Sleep Goal</Text>

          <View style={{ width: 70 }} />
        </View>

          <Text style={styles.sectionLabel}>Success Rate: {successRate}%</Text>
          <Slider
            style={styles.slider}
            minimumValue={50}
            maximumValue={100}
            step={5}
            value={successRate}
            minimumTrackTintColor={Colors.default.sleepyBlue}
            maximumTrackTintColor="#E5E5EA"
            thumbTintColor={Colors.default.sleepyBlue}
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
    paddingTop: 50,
    paddingBottom: 22,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: -6,
  },
  backArrow: { fontSize: 22, fontWeight: "600", marginRight: 6 },
  backText: { fontSize: 17 },
  headerTitle: { fontSize: 20, fontWeight: "bold", textAlign: "center", flex: 1 },
  pageTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.default.sleepyBlue,
    textAlign: "center",
    flex: 1,
  },
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
    backgroundColor: Colors.default.sleepyBlue,
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