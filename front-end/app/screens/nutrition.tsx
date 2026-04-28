// code written by Alexis Mae Asuncion

import React, { useState, useLayoutEffect, useEffect } from "react";
import { Ionicons } from '@expo/vector-icons';
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
  ScrollView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { router, useLocalSearchParams} from "expo-router";

import { useUser } from "../../contexts/UserContext";
import { insertNutritionLog, updateNutritionLog } from "../../src/services/nutritionService";
import NutritionSuccess from "./SuccessScreens/NutritionSuccess";
import { Colors } from "../../constants/Colors"

// nutrition streak refresh
import { refreshNutritionStreak } from "../../src/services/nutritionStreakService";

// ADDED: import nutrition badge awarding
import { checkAndAwardNutritionBadges } from "../../src/services/badgeAwardService";

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

  // Success screen state
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMealName, setSuccessMealName] = useState("");
  const [successMealType, setSuccessMealType] = useState("");
  const [successCalories, setSuccessCalories] = useState(0);
  const [successProtein, setSuccessProtein] = useState(0);
  const [successCarbs, setSuccessCarbs] = useState(0);
  const [successFat, setSuccessFat] = useState(0);

  const {                                                                                                            
      id,                                                                                                            
      mealName: paramMealName,                                                                                       
      calories: paramCalories,                                                                                     
      protein: paramProtein,                                                                                       
      carbs: paramCarbs,
      fat: paramFat,                                                                                                 
      notes: paramNotes,
      nutritionEventType: paramNutritionEventType,                                                                   
      time: paramTime                                                                                              
  } = useLocalSearchParams<{                                                                                         
      id?: string;                                                                                                   
      mealName?: string;
      calories?: string;                                                                                             
      protein?: string;                                                                                            
      carbs?: string;
      fat?: string;
      notes?: string;
      nutritionEventType?: string;
      time?: string;                                                                                                 
  }>();
  
    useEffect(() => {                                                                                                  
      if (id) {                                                                                                      
          setMealName(paramMealName ?? '');                                                                          
          setCalories(paramCalories ?? '');                                                                        
          setProtein(paramProtein ?? '');
          setCarbs(paramCarbs ?? '');                                                                                
          setFat(paramFat ?? '');
          setNotes(paramNotes ?? '');                                                                                
          setMealType(paramNutritionEventType === '2' ? 'Snack' : 'Breakfast');
      }                                                                                                              
  }, [id]);

  // Async because we call Supabase
  const resetForm = () => {
    setMealName("");
    setMealType(null);
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setNotes("");
    setMealTime(new Date());
  };

  const handleSave = async () => {
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

    if (
      isNaN(parsedCalories) ||
      parsedCalories <= 0 ||
      isNaN(parsedProtein) ||
      parsedProtein < 0 ||
      isNaN(parsedCarbs) ||
      parsedCarbs < 0 ||
      isNaN(parsedFat) ||
      parsedFat < 0
    ) {
      Alert.alert("Please enter valid numbers for Calories, Protein, Carbs, and Fat.");
      return;
    }

    // Ensure user is logged in
    if (!user?.id) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }

    const trimmedMealName = mealName.trim();
const trimmedNotes = notes.trim();

if (id) {
  const result = await updateNutritionLog(Number(id), user.id, {
    mealName: trimmedMealName,
    mealType,
    calories: parsedCalories,
    protein: parsedProtein,
    carbs: parsedCarbs,
    fat: parsedFat,
    mealTime,
    notes: trimmedNotes,
  });

  if (result.success) {
    router.back();
  } else {
    Alert.alert("Error", result.error || "Failed to update meal.");
  }
} else {
  const result = await insertNutritionLog(user.id, {
    mealName: trimmedMealName,
    mealType,
    calories: parsedCalories,
    protein: parsedProtein,
    carbs: parsedCarbs,
    fat: parsedFat,
    mealTime,
    notes: trimmedNotes,
  });

  if (result.success) {
    setSuccessMealName(trimmedMealName);
    setSuccessMealType(mealType);
    setSuccessCalories(parsedCalories);
    setSuccessProtein(parsedProtein);
    setSuccessCarbs(parsedCarbs);
    setSuccessFat(parsedFat);
    setSuccessVisible(true);

    resetForm();

    refreshNutritionStreak(user.id)
      .then(() => checkAndAwardNutritionBadges(user.id))
      .catch((error) => {
        console.error("Failed to refresh nutrition streak / badges:", error);
      });
    } else {
      Alert.alert("Error", result.error || "Failed to save nutrition entry");
    }
  }
  };
  
    return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {successVisible ? (
        <NutritionSuccess
          visible={successVisible}
          mealName={successMealName}
          mealType={successMealType}
          calories={successCalories}
          protein={successProtein}
          carbs={successCarbs}
          fat={successFat}
          onClose={() => setSuccessVisible(false)}
          onViewHistory={() => {
            setSuccessVisible(false);
            router.push("/screens/historicalNutritionData" as any);
          }}
        />
      ) : (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
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

            <Text style={styles.headerTitle}>Log Your Meal</Text>

            <TouchableOpacity
              style={styles.barcodeButton}
              onPress={() => router.push("/barcode-scanner" as any)}
            >
              <Ionicons name="barcode-outline" size={26} color="#000" />
            </TouchableOpacity>
          </View>


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
                style={[
                  styles.mealButton,
                  mealType === meal && styles.mealSelected,
                ]}
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
          <TouchableOpacity
            style={styles.timeInput}
            onPress={() => setShowTimePicker(true)}
          >
            <Text>
              {mealTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
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
          </ScrollView>
      </TouchableWithoutFeedback>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  
  barcodeButton: {
    width: 70,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  backText: {
    fontSize: 17,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.default.CompTeal,
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

  mealContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  mealButton: {
    width: "48%",
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    alignItems: "center",
  },

  mealSelected: {
    backgroundColor: '#5ec9c452',
    borderColor: Colors.default.FINALTEAL
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },

  macroContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  macroInputContainer: {
    flex: 1,
    marginHorizontal: 5,
  },

  macroLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 5,
  },

  timeInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
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
    backgroundColor: Colors.default.FINALTEAL,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
});

export default NutritionScreen;