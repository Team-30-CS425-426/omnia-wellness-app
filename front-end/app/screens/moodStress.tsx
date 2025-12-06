import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  Keyboard, 
  TouchableWithoutFeedback 
} from 'react-native';
import { Text } from 'react-native-elements';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useRouter } from 'expo-router';   

const MOODS = [
  { label: 'Very Low', emoji: '😞' },
  { label: 'Low', emoji: '🙁' },
  { label: 'Neutral', emoji: '😐' },
  { label: 'Good', emoji: '😊' },
  { label: 'Excellent', emoji: '😁' },
];

const MoodStressScreen = () => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [stressLevel, setStressLevel] = useState(5);
  const [notes, setNotes] = useState('');
  const router = useRouter()

  const handleSave = () => {
    if (!selectedMood) {
      Alert.alert('Please select your mood before saving.');
      return;
    }

    const entry = {
      mood: selectedMood,
      stress: stressLevel,
      notes,
      date: new Date(),
    };

    console.log('Mood & Stress Entry:', entry);
    Alert.alert('Entry saved!', `Mood: ${selectedMood}\nStress: ${stressLevel}`);

    setSelectedMood(null);
    setStressLevel(5);
    setNotes('');
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: "Mood & Stress",        
          headerBackTitle: "Back",       
        }}
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Text h3 style={styles.title}>Mood & Stress Tracker</Text>

          {/* Mood Selector */}
          <Text style={styles.sectionLabel}>Select Your Mood</Text>
          <View style={styles.moodContainer}>
            {MOODS.map((mood) => (
              <TouchableOpacity
                key={mood.label}
                style={[
                  styles.moodButton,
                  selectedMood === mood.label && styles.moodSelected,
                ]}
                onPress={() => setSelectedMood(mood.label)}
              >
                <Text style={styles.emoji}>{mood.emoji}</Text>
                <Text style={styles.moodLabel}>{mood.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Stress Level Selector */}
          <Text style={styles.sectionLabel}>Stress Level: {stressLevel}</Text>
          <View style={styles.sliderContainer}>
            <TouchableOpacity onPress={() => setStressLevel(Math.max(1, stressLevel - 1))}>
              <Ionicons name="remove-circle-outline" size={32} />
            </TouchableOpacity>
            <Text style={styles.stressValue}>{stressLevel}</Text>
            <TouchableOpacity onPress={() => setStressLevel(Math.min(10, stressLevel + 1))}>
              <Ionicons name="add-circle-outline" size={32} />
            </TouchableOpacity>
          </View>

          {/* Notes */}
          <Text style={styles.sectionLabel}>Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add Notes"
            placeholderTextColor="#999"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={() => router.replace('/home')}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { textAlign: 'center', marginBottom: 20 },
  sectionLabel: { fontSize: 16, fontWeight: '500', marginVertical: 10 },

  moodContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  moodButton: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
  },
  moodSelected: { backgroundColor: '#E0F0FF' },
  emoji: { fontSize: 32 },
  moodLabel: { marginTop: 5, fontSize: 14 },

  sliderContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: 20 },
  stressValue: { fontSize: 20, fontWeight: 'bold' },

  notesInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    height: 80,
    marginBottom: 20,
    textAlignVertical: 'top',
  },

  saveButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default MoodStressScreen;
