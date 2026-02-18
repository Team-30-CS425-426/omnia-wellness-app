/**
 * nutritionGoal.tsx
 * 
 * GOAL-SETTING SCREEN for the Nutrition Goal system.
 * This screen is presented when the user selects "Nutrition" from the SetGoalModal.
 * 
 * FLOW:
 *   1. User arrives here via profile.tsx → SetGoalModal → handleGoalSelect('nutrition')
 *      which routes to '/screens/nutritionGoal' (defined in GOAL_CONFIGS)
 *   2. User fills in calorie, protein, carbs, and fat targets
 *   3. User taps "Set Goal" → handleSave runs:
 *      a. Parses and validates all numeric inputs
 *      b. Checks if user is authenticated
 *      c. Calls checkNutritionGoalExists() to prevent duplicates
 *      d. Calls insertNutritionGoal() to save/upsert the goal in the database
 *      e. Shows success alert, resets form, and navigates back to the profile page
 *   4. After navigating back, profile.tsx's useFocusEffect re-fetches goals,
 *      causing the new nutrition goal card to appear on the profile page
 * 
 * DEPENDENCIES:
 *   - nutritionGoalService.ts: insertNutritionGoal(), checkNutritionGoalExists()
 *   - UserContext: provides the authenticated user's ID
 */

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
import { useLocalSearchParams } from 'expo-router';

import { useUser } from "../../contexts/UserContext";

import { insertNutritionGoal, checkNutritionGoalExists } from "../../src/services/nutritionGoalService";

const NutritionScreen = () => {
  
  const navigation = useNavigation();

  const { user } = useUser();
  const { mode } = useLocalSearchParams<{ mode?: string }>();

  // Hide the default React Navigation header — this screen uses a custom header
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Form state — each field is stored as a string for TextInput compatibility,
  // then parsed to integers in handleSave before sending to the database
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");


  /**
   * handleSave
   * 
   * Validates user input, checks for duplicate goals, and saves to Supabase.
   * Async because it makes two database calls:
   *   1. checkNutritionGoalExists() — prevents creating a second nutrition goal
   *   2. insertNutritionGoal() — upserts the goal data into the 'nutritiongoals' table
   * 
   * On success: shows a confirmation alert, resets the form, and navigates back.
   * On failure: shows an error alert and stays on the screen.
   */
  const handleSave = async () => {

    // Parse string inputs to integers for database storage
    const parsedCalories = parseInt(calories, 10);
    const parsedProtein = parseInt(protein, 10);
    const parsedCarbs = parseInt(carbs, 10);
    const parsedFat = parseInt(fat, 10);
    

    // Validate: calories must be positive, macros must be non-negative
    if (
      isNaN(parsedCalories) || parsedCalories <= 0 ||
      isNaN(parsedProtein) || parsedProtein < 0 ||
      isNaN(parsedCarbs) || parsedCarbs < 0 ||
      isNaN(parsedFat) || parsedFat < 0
    ) {
      Alert.alert("Please enter valid numbers for Calories, Protein, Carbs, and Fat.");
      return;
    }

    // Ensure user is authenticated before making database calls
    if (!user?.id) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }

    // DUPLICATE CHECK: query the database to see if a nutrition goal already exists
    // This prevents users from accidentally creating multiple nutrition goals
    if (mode !== 'edit') {
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
    }
      
    // DATABASE INSERT: save the goal via nutritionGoalService
    // insertNutritionGoal uses .upsert() so it will update if a row somehow already exists
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
    
        // Reset form fields after successful save
        setCalories("");
        setProtein("");
        setCarbs("");
        setFat("");
        
        // Navigate back to the profile page — useFocusEffect there will re-fetch goals
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
