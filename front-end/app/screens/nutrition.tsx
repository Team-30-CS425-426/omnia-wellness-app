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

import { insertNutritionLog } from "../../src/services/nutritionService";

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;
type MealType = (typeof MEAL_TYPES)[number];

const NutritionScreen = () => {
  const navigation = useNavigation();

  const { user } = useUser();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState<MealType | null>(null);
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [notes, setNotes] = useState("");
  const [mealTime, setMealTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Async because we call Supabase
  const handleSave = async () => {
    // Check required fields
    if (!mealName.trim() || !mealType || !calories || !protein || !carbs || !fat) {
      Alert.alert(
        "Please enter all required fields: Meal Name, Meal Type, Calories, Protein, Carbs, and Fat."
      );
      return;
    }

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

    // Insert into Supabase NutritionLog
    const result = await insertNutritionLog(user.id, {
      mealName,
      mealType,
      calories: parsedCalories,
      protein: parsedProtein,
      carbs: parsedCarbs,
      fat: parsedFat,
      mealTime,
      notes,
    });

    if (result.success) {
      Alert.alert(
        "Nutrition Entry Saved!",
        `Meal: ${mealName}\nType: ${mealType}\nCalories: ${parsedCalories}\nProtein: ${parsedProtein}g\nCarbs: ${parsedCarbs}g\nFat: ${parsedFat}g` +
          (notes.trim() ? `\nNotes: ${notes.trim()}` : "")
      );

      // Reset form
      setMealName("");
      setMealType(null);
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      setNotes("");
      setMealTime(new Date());
    } else {
      Alert.alert("Error", result.error || "Failed to save nutrition entry");
    }
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
            <Text style={styles.headerTitle}>Nutrition Tracker</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Page Title */}
          <Text style={styles.pageTitle}>Log Your Meal</Text>

          {/* Meal Name */}
          <Text style={styles.sectionLabel}>Meal Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter meal name..."
            placeholderTextColor="#999"
            value={mealName}
            onChangeText={setMealName}
          />

          {/* Meal Type */}
          <Text style={styles.sectionLabel}>Meal Type</Text>
          <View style={styles.mealContainer}>
            {MEAL_TYPES.map((meal) => (
              <TouchableOpacity
                key={meal}
                style={[styles.mealButton, mealType === meal && styles.mealSelected]}
                onPress={() => setMealType(meal)}
              >
                <Text>{meal}</Text>
              </TouchableOpacity>
            ))}
          </View>

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

          {/* Meal Time */}
          <Text style={styles.sectionLabel}>Meal Time</Text>
          <TouchableOpacity style={styles.timeInput} onPress={() => setShowTimePicker(true)}>
            <Text>{mealTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={mealTime}
              mode="time"
              onChange={(event, selectedDate) => {
                if (selectedDate) setMealTime(selectedDate);
              }}
            />
          )}

          {/* Notes */}
          <Text style={styles.sectionLabel}>Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add notes about your meal..."
            placeholderTextColor="#999"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Meal</Text>
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
