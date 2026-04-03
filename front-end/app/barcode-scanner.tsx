import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '../config/supabaseConfig';
import { useUser } from '../contexts/UserContext';

export default function BarcodeScannerScreen() {
  const { user } = useUser();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);

  const [reviewVisible, setReviewVisible] = useState(false);
  const [scannedFood, setScannedFood] = useState<any>(null);
  const [quantity, setQuantity] = useState('1');
  const [saving, setSaving] = useState(false);

  const scanLockRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setScannerReady(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  async function handleBarcodeScanned({
    data,
    type,
  }: {
    data: string;
    type: string;
  }) {
    if (scanLockRef.current || loading || reviewVisible) return;

    scanLockRef.current = true;
    setScanned(true);
    setLoading(true);

    try {
      console.log('Scanned data:', data);
      console.log('Scanned type:', type);

      const normalizedBarcode = normalizeBarcodeToGTIN13(data);

      console.log(
        'Normalized barcode:',
        normalizedBarcode,
        normalizedBarcode.length
      );

      const functionUrl =
        'https://omltvisbblgiudgecgsv.supabase.co/functions/v1/barcode-lookup';

      const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tbHR2aXNiYmxnaXVkZ2VjZ3N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NTkyMzUsImV4cCI6MjA4MDAzNTIzNX0.WeFgn2cEBMlBUVo2-5-yPyRHf91sDlQEyvvEJGz1pQk';

      console.log('Function URL:', functionUrl);

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          barcode: normalizedBarcode,
          region: 'US',
        }),
      });

      const result = await response.json();

      console.log('Barcode lookup response status:', response.status);
      console.log('Barcode lookup response json:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Barcode lookup failed');
      }

      if (result?.food) {
        setScannedFood(result.food);
        setQuantity('1');
        setReviewVisible(true);
        setLoading(false);
      } else {
        throw new Error('No food result returned from barcode lookup.');
      }
    } catch (error: any) {
      console.log('Barcode scan / lookup error:', error);

      Alert.alert(
        'Connection issue',
        'We scanned your barcode, but could not fetch food data. Please try again.'
      );

      scanLockRef.current = false;
      setLoading(false);
      setScanned(false);
    }
  }

  async function handleSaveFoodEntry() {
    try {
      if (!scannedFood) return;

      if (!user?.id) {
        throw new Error('User not authenticated.');
      }

      setSaving(true);

      const qty = Number(quantity);
      if (!qty || qty <= 0) {
        throw new Error('Please enter a valid quantity.');
      }

      const firstServing =
        scannedFood.servings?.serving?.[0] ||
        scannedFood.servings?.serving ||
        null;

      const calories = firstServing?.calories ?? null;
      const protein = firstServing?.protein ?? null;
      const carbs = firstServing?.carbohydrate ?? null;
      const fat = firstServing?.fat ?? null;
      const servingDescription = firstServing?.serving_description ?? '1 serving';
      const servingId = firstServing?.serving_id ?? null;
      const foodId = scannedFood?.food_id ?? null;

      const now = new Date();

      const { error } = await supabase.from('NutritionLog').insert({
        date: now.toISOString().slice(0, 10),
        time: now.toTimeString().slice(0, 8),
        calories: Number(calories) || null,
        protein: Number(protein) || null,
        fat: Number(fat) || null,
        carbs: Number(carbs) || null,
        userID: user.id,
        mealName: scannedFood.food_name,
        notes: '',
        food_id: foodId,
        serving_id: servingId,
        brand_name: scannedFood.brand_name,
        serving_description: servingDescription,
        quantity: qty,
        source: 'barcode',
        nutritionEventType: null,
      });

      if (error) throw error;

      Alert.alert('Saved', 'Food entry saved successfully.');

      closeReviewAndReset();
    } catch (error: any) {
      Alert.alert('Save failed', error.message);
    } finally {
      setSaving(false);
    }
  }

  function closeReviewAndReset() {
    setReviewVisible(false);
    setScannedFood(null);
    setQuantity('1');
    scanLockRef.current = false;
    setScanned(false);
    setLoading(false);
  }

  if (!permission) return <View style={{ flex: 1 }} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.message}>
          We need camera access to scan food barcodes.
        </Text>
        <Button title="Grant permission" onPress={requestPermission} />
      </SafeAreaView>
    );
  }

  const firstServing =
    scannedFood?.servings?.serving?.[0] ||
    scannedFood?.servings?.serving ||
    null;

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={
          !scannerReady || scanned || loading || reviewVisible
            ? undefined
            : handleBarcodeScanned
        }
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a'],
        }}
      />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.scanFrame} />

      <Text style={styles.scanHint}>Line up barcode in frame</Text>

      {loading && (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>Looking up food...</Text>
        </View>
      )}

      {scanned && !loading && !reviewVisible && (
        <View style={styles.bottomButton}>
          <Button
            title="Scan again"
            onPress={() => {
              scanLockRef.current = false;
              setScanned(false);
              setLoading(false);
            }}
          />
        </View>
      )}

      <Modal
        visible={reviewVisible}
        animationType="slide"
        transparent
        onRequestClose={closeReviewAndReset}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeReviewAndReset}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {scannedFood && (
              <ScrollView
                contentContainerStyle={styles.modalContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.modalTitle}>{scannedFood.food_name}</Text>
                <Text style={styles.modalSubtitle}>
                  {scannedFood.brand_name || ''}
                </Text>

                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Serving</Text>
                  <Text style={styles.infoValue}>
                    {firstServing?.serving_description || '1 serving'}
                  </Text>

                  <Text style={styles.infoLabel}>Calories</Text>
                  <Text style={styles.infoValue}>
                    {firstServing?.calories || 'N/A'}
                  </Text>

                  <Text style={styles.infoLabel}>Protein</Text>
                  <Text style={styles.infoValue}>
                    {firstServing?.protein || 'N/A'}
                  </Text>

                  <Text style={styles.infoLabel}>Carbs</Text>
                  <Text style={styles.infoValue}>
                    {firstServing?.carbohydrate || 'N/A'}
                  </Text>

                  <Text style={styles.infoLabel}>Fat</Text>
                  <Text style={styles.infoValue}>
                    {firstServing?.fat || 'N/A'}
                  </Text>
                </View>

                <Text style={styles.quantityLabel}>Quantity</Text>
                <TextInput
                  style={styles.quantityInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                />

                <TouchableOpacity
                  style={styles.saveModalButton}
                  onPress={handleSaveFoodEntry}
                  disabled={saving}
                >
                  <Text style={styles.saveModalButtonText}>
                    {saving ? 'Saving...' : 'Save Food Entry'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function normalizeBarcodeToGTIN13(data: string): string {
  const digits = data.replace(/\D/g, '');

  console.log('Barcode digits:', digits, digits.length);

  if (digits.length === 13) return digits;
  if (digits.length === 12) return `0${digits}`;
  if (digits.length === 8) return digits.padStart(13, '0');

  if (digits.length > 13) return digits.slice(0, 13);

  throw new Error(`Invalid barcode (${digits.length} digits)`);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  message: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 16,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    zIndex: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
  },
  backButtonText: {
    fontSize: 18,
    color: '#444',
    fontWeight: '500',
  },
  scanFrame: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'white',
    width: 250,
    height: 150,
    alignSelf: 'center',
    top: '42%',
  },
  scanHint: {
    position: 'absolute',
    top: '60%',
    alignSelf: 'center',
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusBox: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '82%',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    left: 14,
    zIndex: 10,
    backgroundColor: '#f2f2f2',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#444',
  },
  modalContent: {
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    paddingRight: 20,
  },
  modalSubtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#f7f7f7',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: '#222',
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    marginBottom: 20,
  },
  saveModalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveModalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});