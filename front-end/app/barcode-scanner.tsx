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

import { mapMealTypeToEventId } from '@/src/services/nutritionService';
import * as Linking from 'expo-linking';

type ScannedMealItem = {
  localId: string;
  food: any;
  quantity: string;
};

export default function BarcodeScannerScreen() {
  const { user } = useUser();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);

  const [reviewVisible, setReviewVisible] = useState(false);

  const [scannedItems, setScannedItems] = useState<ScannedMealItem[]>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);

  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState('Snack');
  const [notes, setNotes] = useState('');
  const [mealTypeModalVisible, setMealTypeModalVisible] = useState(false);

  const selectedItem = scannedItems[selectedItemIndex] || null;
  const selectedFood = selectedItem?.food || null;
  const selectedServing =
    selectedFood?.servings?.serving?.[0] ||
    selectedFood?.servings?.serving ||
    null;

  const [saving, setSaving] = useState(false);

  const scanLockRef = useRef(false);

  function updateSelectedItemQuantity(value: string) {
    setScannedItems((prev) =>
      prev.map((item, index) =>
        index === selectedItemIndex ? { ...item, quantity: value } : item
      )
    );
  }

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
        const newItem: ScannedMealItem = {
          localId: `${Date.now()}-${Math.random()}`,
          food: result.food,
          quantity: '1',
        };
        
        setScannedItems((prev) => {
          const updated = [...prev, newItem];
          setSelectedItemIndex(updated.length - 1);
          return updated;
        });
        
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
      if (!scannedItems.length) {
        throw new Error('No scanned foods to save.');
      }
  
      if (!user?.id) {
        throw new Error('User not authenticated.');
      }
  
      if (!mealName.trim()) {
        throw new Error('Meal name is required.');
      }
  
      setSaving(true);
  
      const now = new Date();
      const nutritionEventType = mapMealTypeToEventId(mealType);
  
      const itemRows = scannedItems.map((item) => {
        const qty = Number(item.quantity);
  
        if (!qty || qty <= 0) {
          throw new Error('Please enter a valid quantity for each scanned item.');
        }
  
        const serving =
          item.food?.servings?.serving?.[0] ||
          item.food?.servings?.serving ||
          null;
  
        const caloriesPerUnit = Number(serving?.calories) || 0;
        const proteinPerUnit = Number(serving?.protein) || 0;
        const carbsPerUnit = Number(serving?.carbohydrate) || 0;
        const fatPerUnit = Number(serving?.fat) || 0;
  
        return {
          food_name: item.food?.food_name || 'Unknown Food',
          food_id: item.food?.food_id ? String(item.food.food_id) : null,
          serving_id: serving?.serving_id ? String(serving.serving_id) : null,
          brand_name: item.food?.brand_name || null,
          serving_description: serving?.serving_description || '1 serving',
          quantity: qty,
          calories: caloriesPerUnit * qty,
          protein: proteinPerUnit * qty,
          carbs: carbsPerUnit * qty,
          fat: fatPerUnit * qty,
          source: 'barcode',
        };
      });
  
      const totalCalories = itemRows.reduce((sum, item) => sum + item.calories, 0);
      const totalProtein = itemRows.reduce((sum, item) => sum + item.protein, 0);
      const totalCarbs = itemRows.reduce((sum, item) => sum + item.carbs, 0);
      const totalFat = itemRows.reduce((sum, item) => sum + item.fat, 0);
  
      const { data: nutritionLogRow, error: parentError } = await supabase
        .from('NutritionLog')
        .insert({
          date: now.toISOString().slice(0, 10),
          time: now.toTimeString().slice(0, 8),
          calories: totalCalories,
          protein: totalProtein,
          fat: totalFat,
          carbs: totalCarbs,
          nutritionEventType,
          userID: user.id,
          mealName: mealName.trim(),
          notes: notes.trim() || '',
          source: 'barcode',
          food_id: null,
          serving_id: null,
          brand_name: null,
          serving_description: null,
          quantity: null,
        })
        .select('id')
        .single();
  
      if (parentError) throw parentError;
      if (!nutritionLogRow?.id) {
        throw new Error('Could not create nutrition log row.');
      }
  
      const childRows = itemRows.map((item) => ({
        nutrition_log_id: nutritionLogRow.id,
        ...item,
      }));
  
      const { error: childError } = await supabase
        .from('nutritionlogitems')
        .insert(childRows);
  
      if (childError) throw childError;
  
      Alert.alert('Saved', 'Meal saved successfully.');
      closeReviewAndReset();
    } catch (error: any) {
      Alert.alert('Save failed', error.message);
    } finally {
      setSaving(false);
    }
  }

  function closeReviewAndReset() {
    setReviewVisible(false);
    setScannedItems([]);
    setSelectedItemIndex(0);
    setMealName('');
    setMealType('Snack');
    setNotes('');
    scanLockRef.current = false;
    setScanned(false);
    setLoading(false);
  }

  if (!permission) return <View style={{ flex: 1 }} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.message}>
          Camera access is required to scan food barcodes.
        </Text>
  
        <TouchableOpacity
          style={styles.permissionPrimaryButton}
          onPress={async () => {
            const result = await requestPermission();
  
            if (!result.granted && result.canAskAgain === false) {
              Alert.alert(
                'Camera access not enabled',
                'Camera access was previously denied. Please enable it in your device Settings to use barcode scanning.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Open Settings', onPress: () => Linking.openSettings() },
                ]
              );
            } else if (!result.granted) {
              Alert.alert(
                'Camera access not enabled',
                'Barcode scanning cannot be used unless camera access is allowed.',
                [{ text: 'OK' }]
              );
            }
          }}
        >
          <Text style={styles.permissionPrimaryButtonText}>Continue</Text>
        </TouchableOpacity>
  
        <TouchableOpacity
          style={[styles.permissionSecondaryButton, { marginTop: 12 }]}
          onPress={() => router.back()}
        >
          <Text style={styles.permissionSecondaryButtonText}>Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setReviewVisible(false);
                scanLockRef.current = false;
                setScanned(false);
                setLoading(false);
              }}
            >
              <Text style={styles.addButtonText}>＋</Text>
            </TouchableOpacity>

            {selectedFood && (
              <ScrollView
                contentContainerStyle={styles.modalContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.quantityLabel}>Meal Name</Text>
                <TextInput
                  style={styles.quantityInput}
                  value={mealName}
                  onChangeText={setMealName}
                  placeholder="Enter meal name..."
                />
                <Text style={styles.modalTitle}>{selectedFood.food_name}</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedFood.brand_name || ''}
                </Text>

                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Serving</Text>
                  <Text style={styles.infoValue}>
                   {selectedServing?.serving_description || '1 serving'}
                  </Text>

                  <Text style={styles.infoLabel}>Calories</Text>
                  <Text style={styles.infoValue}>
                   {selectedServing?.calories || 'N/A'}
                  </Text>

                  <Text style={styles.infoLabel}>Protein</Text>
                  <Text style={styles.infoValue}>
                   {selectedServing?.protein || 'N/A'}
                  </Text>

                  <Text style={styles.infoLabel}>Carbs</Text>
                  <Text style={styles.infoValue}>
                   {selectedServing?.carbohydrate || 'N/A'}
                  </Text>

                  <Text style={styles.infoLabel}>Fat</Text>
                  <Text style={styles.infoValue}>
                   {selectedServing?.fat || 'N/A'}
                  </Text>
                </View>

                <Text style={styles.quantityLabel}>Quantity</Text>
                <TextInput
                  style={styles.quantityInput}
                  value={selectedItem?.quantity || '1'}
                  onChangeText={updateSelectedItemQuantity}
                  keyboardType="numeric"
                />
                
                <View style={styles.pagerRow}>
                <TouchableOpacity
                  style={[
                    styles.pagerArrowButton,
                    selectedItemIndex === 0 && styles.pagerArrowButtonDisabled,
                  ]}
                  onPress={() => setSelectedItemIndex((prev) => Math.max(prev - 1, 0))}
                  disabled={selectedItemIndex === 0}
                >
                  <Text style={styles.pagerButton}>‹</Text>
                </TouchableOpacity>

                <Text style={styles.pagerText}>
                  {scannedItems.length === 0
                    ? '0 of 0'
                    : `${selectedItemIndex + 1} of ${scannedItems.length}`}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.pagerArrowButton,
                    selectedItemIndex === scannedItems.length - 1 &&
                      styles.pagerArrowButtonDisabled,
                  ]}
                  onPress={() =>
                    setSelectedItemIndex((prev) =>
                      Math.min(prev + 1, scannedItems.length - 1)
                    )
                  }
                  disabled={selectedItemIndex === scannedItems.length - 1}
                >
                  <Text style={styles.pagerButton}>›</Text>
                </TouchableOpacity>
              </View>
                            
              <Text style={styles.quantityLabel}>Meal Type</Text>
              <TouchableOpacity
                style={styles.dropdownField}
                onPress={() => setMealTypeModalVisible(true)}
              >
                <Text style={styles.dropdownFieldText}>{mealType}</Text>
                <Text style={styles.dropdownChevron}>⌄</Text>
              </TouchableOpacity>

              {mealTypeModalVisible && (
                <View style={styles.dropdownMenu}>
                  {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={styles.dropdownOption}
                      onPress={() => {
                        setMealType(type);
                        setMealTypeModalVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          mealType === type && styles.dropdownOptionTextSelected,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

                    


                <Text style={styles.quantityLabel}>Notes (optional)</Text>
                <TextInput
                  style={[styles.quantityInput, { height: 100, textAlignVertical: 'top' }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add notes about your meal..."
                  multiline
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
  addButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    backgroundColor: '#f2f2f2',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#444',
  },
  pagerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    marginBottom: 20,
  },
  pagerButton: {
    fontSize: 28,
    fontWeight: '600',
    color: '#222',
  },
  pagerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
  },
  pagerArrowButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F2',
  },
  pagerArrowButtonDisabled: {
    opacity: 0.4,
  },
  dropdownField: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  dropdownFieldText: {
    fontSize: 18,
    color: '#222',
  },
  
  dropdownChevron: {
    fontSize: 22,
    color: '#666',
    fontWeight: '600',
  },
  
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  
  dropdownModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  
  dropdownOption: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  
  dropdownOptionText: {
    fontSize: 17,
    color: '#222',
  },
  
  dropdownOptionTextSelected: {
    fontWeight: '700',
    color: '#007AFF',
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    marginTop: -10,
    marginBottom: 20,
    overflow: 'hidden',
  },
  permissionCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 22,
  },
  
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    color: '#222',
  },
  
  permissionMessage: {
    fontSize: 16,
    lineHeight: 22,
    color: '#555',
    marginBottom: 20,
  },
  
  permissionButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  
  permissionSecondaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F2F2F2',
  },
  
  permissionSecondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
  },
  
  permissionPrimaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#007AFF',
  },
  
  permissionPrimaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});