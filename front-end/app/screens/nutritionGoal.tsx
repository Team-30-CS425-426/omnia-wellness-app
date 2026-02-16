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

import { useNavigation } from "@react-navigation/native";

import { useUser } from "../../contexts/UserContext";

import { insertNutritionGoal, checkNutritionGoalExists } from "../../src/services/nutritionGoalService";

const NutritionScreen = () => {
  const navigation = useNavigation();

  const { user } = useUser();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");


  // Async because we call Supabase
  const handleSave = async () => {
    // Check required fields

    const parsedCalories = parseInt(calories, 10);
    const parsedProtein = parseInt(protein, 10);
    const parsedCarbs = parseInt(carbs, 10);
    const parsedFat = parseInt(fat, 10);

    // Validate numeric input
    if (
      isNaN(parsedCalories) || parsedCalories <= 0 ||
      isNaN(parsedProtein) || parsedProtein < 0 ||
      isNaN(parsedCarbs) || parsedCarbs < 0 ||
      isNaN(parsedFat) || parsedFat < 0
    ) {
      Alert.alert("Please enter valid numbers for Calories, Protein, Carbs, and Fat.");
      return;
    }

    // Ensure user is logged in 
    if (!user?.id) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }

    try {
        const exists = await checkNutritionGoalExists(user.id);
        if (exists) {
          Alert.alert("Error", "Nutrition goal already exists.");
          return;
        }
      } catch (error) {
        Alert.alert("Error", "Failed to check nutrition goal existence.");
        return;
      }
      
    try {
        await insertNutritionGoal(user?.id, {
          calories: parsedCalories,
          protein: parsedProtein,
          carbs: parsedCarbs,
          fat: parsedFat,
        });
    
        Alert.alert(
          "Nutrition Goal Saved!",
          `Calories: ${parsedCalories}\nProtein: ${parsedProtein}g\nCarbs: ${parsedCarbs}g\nFat: ${parsedFat}g`
        );
    
        // Reset form
        setCalories("");
        setProtein("");
        setCarbs("");
        setFat("");
        
        // Navigate back
        navigation.goBack();
      } catch (error: any) {
        Alert.alert("Error", error.message || "Failed to save nutrition goal");
      }
    }

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
            <Text style={styles.headerTitle}>Nutrition Tracker</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Page Title */}
          <Text style={styles.pageTitle}>Set Your Nutrition Goal</Text>


          <Text style={styles.sectionLabel}>What's Your Caloric Goal?</Text>

          {/* Calories */}
          <Text style={styles.sectionLabel}>Calories</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter calories"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={calories}
            onChangeText={setCalories}
          />

          {/* Protein, Carbs, Fat */}
          <View style={styles.macroContainer}>
            <View style={styles.macroInputContainer}>
              <Text style={styles.macroLabel}>Protein (g)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={protein}
                onChangeText={setProtein}
              />
            </View>
            <View style={styles.macroInputContainer}>
              <Text style={styles.macroLabel}>Carbs (g)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={carbs}
                onChangeText={setCarbs}
              />
            </View>
            <View style={styles.macroInputContainer}>
              <Text style={styles.macroLabel}>Fat (g)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={fat}
                onChangeText={setFat}
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Set Goal</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, 
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

  mealContainer: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    justifyContent: "space-between", 
    marginBottom: 20 
  },

  mealButton: { 
    width: "48%", 
    padding: 12, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: "#ccc", 
    borderRadius: 10, 
    alignItems: "center" 
  },

  mealSelected: { 
    backgroundColor: "#E0F0FF", 
    borderColor: "#007AFF" 
  },

  input: { 
    borderWidth: 1, 
    borderColor: "#ccc", 
    borderRadius: 8, 
    padding: 10, 
    marginBottom: 10, 
    fontSize: 16 
  },

  macroContainer: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: 20 
  },
  
  macroInputContainer: { 
    flex: 1, 
    marginHorizontal: 5 
  },

  macroLabel: { 
    fontSize: 14, 
    fontWeight: "500", 
    marginBottom: 5 
  },

  timeInput: { 
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
export default NutritionScreen;
