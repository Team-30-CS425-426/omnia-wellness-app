// Code written by Alexis Mae Asuncion

import React, { useState, useCallback } from "react";
import {
  StyleProp,
  ViewStyle,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { Colors } from "../../../constants/Colors";
import ThemedCard from "../ThemedCard";
import ThemedText from "../ThemedText";
import ThemedView from "../ThemedView";

import { useUser } from "@/contexts/UserContext";
import {
  fetchActiveHabits,
  HabitWithFrequencyLabel,
  pauseHabit,
} from "@/src/services/habitService";
import {
  isHabitCompletedToday,
  setHabitCompletedForToday,
} from "@/src/services/habitCompletionService";

interface HabitsProps {
  style?: StyleProp<ViewStyle>;
}

export function Habits({ style }: HabitsProps) {
  const { user } = useUser();

  const [habits, setHabits] = useState<HabitWithFrequencyLabel[]>([]);
  const [completedMap, setCompletedMap] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [togglingHabitId, setTogglingHabitId] = useState<number | null>(null);

  const loadHabits = useCallback(async () => {
    if (!user?.id) {
      setHabits([]);
      setCompletedMap({});
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const habitResult = await fetchActiveHabits(user.id);

      if (!habitResult.success || !habitResult.data) {
        console.error("Failed to fetch habits:", habitResult.error);
        setHabits([]);
        setCompletedMap({});
        setLoading(false);
        return;
      }

      const fetchedHabits = habitResult.data;
      setHabits(fetchedHabits);

      const completionResults = await Promise.all(
        fetchedHabits.map(async (habit) => {
          const result = await isHabitCompletedToday(user.id, habit.id);
          return {
            habitId: habit.id,
            completed: result.success ? result.completed ?? false : false,
          };
        })
      );

      const completionMap: Record<number, boolean> = {};
      completionResults.forEach(({ habitId, completed }) => {
        completionMap[habitId] = completed;
      });

      setCompletedMap(completionMap);
    } catch (error) {
      console.error("Error loading dashboard habits:", error);
      setHabits([]);
      setCompletedMap({});
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, [loadHabits])
  );

  const handleToggleHabit = async (habitId: number) => {
    if (!user?.id) return;

    const currentValue = completedMap[habitId] ?? false;
    const newValue = !currentValue;

    setCompletedMap((prev) => ({
      ...prev,
      [habitId]: newValue,
    }));
    setTogglingHabitId(habitId);

    try {
      const result = await setHabitCompletedForToday(user.id, habitId, newValue);

      if (!result.success) {
        setCompletedMap((prev) => ({
          ...prev,
          [habitId]: currentValue,
        }));

        Alert.alert("Error", result.error || "Failed to update habit completion.");
      }
    } catch (error) {
      setCompletedMap((prev) => ({
        ...prev,
        [habitId]: currentValue,
      }));
      Alert.alert("Error", "Something went wrong while updating the habit.");
      console.error("Toggle habit error:", error);
    } finally {
      setTogglingHabitId(null);
    }
  };

  const handleRemoveHabit = (habitId: number, habitName: string) => {
    if (!user?.id) return;

    Alert.alert(
      "Remove Habit",
      `Are you sure you want to remove "${habitName}" from your habits?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await pauseHabit(habitId, user.id);

              if (!result.success) {
                Alert.alert("Error", result.error || "Failed to remove habit.");
                return;
              }

              setHabits((prev) => prev.filter((h) => h.id !== habitId));

              setCompletedMap((prev) => {
                const updated = { ...prev };
                delete updated[habitId];
                return updated;
              });
            } catch (error) {
              console.error("Error removing habit:", error);
              Alert.alert("Error", "Something went wrong while removing the habit.");
            }
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={style}>
      <ThemedText style={styles.sectionTitle}>Habits</ThemedText>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={Colors.default.berryBlue} />
        </View>
      ) : habits.length === 0 ? (
        <ThemedCard style={styles.emptyCard}>
          <ThemedText style={styles.emptyText}>
            No habits added yet.
          </ThemedText>
        </ThemedCard>
      ) : (
        <View style={styles.listContainer}>
          {habits.map((habit) => {
            const isCompleted = completedMap[habit.id] ?? false;
            const isThisHabitToggling = togglingHabitId === habit.id;

            return (
              <ThemedCard
                key={habit.id}
                style={{
                  ...styles.habitCard,
                  ...(isCompleted ? styles.completedHabitCard : {}),
                }}
              >
                <View style={styles.row}>
                  <Pressable
                    onPress={() => handleToggleHabit(habit.id)}
                    style={styles.checkboxContainer}
                    disabled={isThisHabitToggling}
                  >
                    <Ionicons
                      name={isCompleted ? "checkbox" : "square-outline"}
                      size={25}
                      color={isCompleted ? Colors.default.berryBlue : "#BDBDBD"}
                    />
                  </Pressable>

                  <View style={styles.textContainer}>
                    <ThemedText
                      style={{
                        ...styles.habitName,
                        ...(isCompleted ? styles.completedHabitName : {}),
                      }}
                    >
                      {habit.habitName}
                    </ThemedText>

                    {!!habit.description && (
                      <ThemedText
                        style={{
                          ...styles.description,
                          ...(isCompleted ? styles.completedDescription : {}),
                        }}
                      >
                        {habit.description}
                      </ThemedText>
                    )}

                    <View
                      style={{
                        ...styles.badge,
                        ...(isCompleted ? styles.completedBadge : {}),
                      }}
                    >
                      <ThemedText
                        style={{
                          ...styles.badgeText,
                          ...(isCompleted ? styles.completedBadgeText : {}),
                        }}
                      >
                        {habit.frequencyLabel}
                      </ThemedText>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => handleRemoveHabit(habit.id, habit.habitName)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#BDBDBD" />
                  </Pressable>
                </View>
              </ThemedCard>
            );
          })}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: Colors.default.berryBlue,
    fontFamily: "timesnewroman",
    fontWeight: "bold",
    fontSize: 20,
    marginBottom: 6,
  },

  centered: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },

  listContainer: {
    //alignItems: "center",
    gap: 0,
  },

  emptyCard: {
    width: 375,
    padding: 16,
    borderRadius: 20,
    marginTop: 4,
    //alignSelf: "center",
  },

  emptyText: {
    fontSize: 15,
    color: Colors.default.mediumGray,
  },

  habitCard: {
    width: 375,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 22,
    //alignSelf: "center",
    marginBottom: 0,
  },

  completedHabitCard: {
    backgroundColor: "#F3F3F3",
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  checkboxContainer: {
    marginRight: 14,
    paddingTop: 2,
  },

  textContainer: {
    flex: 1,
    justifyContent: "center",
  },

  habitName: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#4A4A4A",
  },

  completedHabitName: {
    color: "#7A7A7A",
  },

  description: {
    fontSize: 14,
    color: "#B0B0B0",
    marginBottom: 8,
    lineHeight: 20,
  },

  completedDescription: {
    color: "#A8A8A8",
  },

  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#F3ECFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  completedBadge: {
    backgroundColor: "#e8e8e8",
  },

  badgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8E63D2",
  },

  completedBadgeText: {
    color: "#8A8A8A",
  },

  deleteButton: {
    marginLeft: 10,
    paddingTop: 2,
  },
});

