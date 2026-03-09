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
import { insertStepsGoal } from "../../src/services/stepsGoalService";

export default function StepsGoalsScreen() {
  const navigation = useNavigation();
  const { user } = useUser();

  const [stepsGoal, setStepsGoal] = useState("");

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const handleSave = async () => {
    const parsedSteps = parseInt(stepsGoal, 10);

    if (isNaN(parsedSteps) || parsedSteps <= 0) {
      Alert.alert("Please enter a valid number of steps.");
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }

    try {
      await insertStepsGoal(user.id, parsedSteps);
      Alert.alert("Steps Goal Saved!", `Goal: ${parsedSteps} steps`);
      setStepsGoal("");
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save steps goal");
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
            <Text style={styles.headerTitle}>Steps Goal</Text>
            <View style={{ width: 60 }} />
          </View>

          <Text style={styles.pageTitle}>Set Your Steps Goal</Text>

          <Text style={styles.sectionLabel}>Daily Step Goal</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter step goal"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={stepsGoal}
            onChangeText={setStepsGoal}
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
});