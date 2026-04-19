import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from "../../config/supabaseConfig";

export default function ScannedFoodReviewScreen() {
  const { food } = useLocalSearchParams<{ food: string }>();
  const [quantity, setQuantity] = useState('1');
  const [saving, setSaving] = useState(false);

  const parsedFood = useMemo(() => {
    try {
      return food ? JSON.parse(food) : null;
    } catch {
      return null;
    }
  }, [food]);

  if (!parsedFood) {
    return (
      <View style={styles.center}>
        <Text>Could not load scanned food data.</Text>
      </View>
    );
  }

  const rawFood = parsedFood.food || parsedFood;

  const foodName = rawFood.food_name || 'Unknown Food';
  const brandName = rawFood.brand_name || 'Unknown Brand';

  const firstServing =
    rawFood.servings?.serving?.[0] ||
    rawFood.servings?.serving ||
    null;

  const calories = firstServing?.calories ?? 'N/A';
  const protein = firstServing?.protein ?? 'N/A';
  const carbs = firstServing?.carbohydrate ?? 'N/A';
  const fat = firstServing?.fat ?? 'N/A';
  const servingDescription = firstServing?.serving_description ?? '1 serving';
  const servingId = firstServing?.serving_id ?? null;
  const foodId = rawFood.food_id ?? null;

  async function handleSave() {
    try {
      setSaving(true);

      const qty = Number(quantity);
      if (!qty || qty <= 0) {
        throw new Error('Please enter a valid quantity.');
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('User not found. Please sign in again.');
      }

      const now = new Date();

      const { error } = await supabase.from('NutritionLog').insert({
        date: now.toISOString().slice(0, 10),
        time: now.toTimeString().slice(0, 8),
        calories: Number(calories) || null,
        protein: Number(protein) || null,
        fat: Number(fat) || null,
        carbs: Number(carbs) || null,
        userID: user.id,
        mealName: foodName,
        notes: '',
        food_id: foodId,
        serving_id: servingId,
        brand_name: brandName,
        serving_description: servingDescription,
        quantity: qty,
        source: 'barcode',
      });

      if (error) throw error;

      Alert.alert('Saved', 'Food entry saved successfully.');
      router.back();
    } catch (error: any) {
      Alert.alert('Save failed', error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{foodName}</Text>
      <Text style={styles.subtitle}>{brandName}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Serving</Text>
        <Text>{servingDescription}</Text>

        <Text style={styles.label}>Calories</Text>
        <Text>{calories}</Text>

        <Text style={styles.label}>Protein</Text>
        <Text>{protein}</Text>

        <Text style={styles.label}>Carbs</Text>
        <Text>{carbs}</Text>

        <Text style={styles.label}>Fat</Text>
        <Text>{fat}</Text>
      </View>

      <Text style={styles.label}>Quantity</Text>
      <TextInput
        style={styles.input}
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
        placeholder="Enter quantity"
      />

      <Button
        title={saving ? 'Saving...' : 'Save Food Entry'}
        onPress={handleSave}
        disabled={saving}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: '#f4f4f4',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  label: {
    fontWeight: '600',
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
  },
});