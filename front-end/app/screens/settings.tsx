// code written by Daisy Madera
import {
  ReminderTime,
  disableDailyCheckInReminder,
  loadReminderSettings,
  scheduleDailyCheckInReminder,
} from '@/src/services/ReminderManager';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  CommonActions,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCameraPermissions } from 'expo-camera';

import { useUser } from '../../contexts/UserContext';
import ConfirmDeleteModal from '../components/DeleteConfirmationModal';
import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';
import UpdateEmailModal from '../components/updateEmailModal';
import { openAppSettings } from '@/src/hooks/useHealthKit/healthAuthorization';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { logout, deleteAccount, updateEmail } = useUser();

  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isEditingReminder, setIsEditingReminder] = useState(false);
  const [hasSavedReminder, setHasSavedReminder] = useState(false);
  const [savedTime, setSavedTime] = useState(new Date());
  const [draftTime, setDraftTime] = useState(new Date());

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [showUpdateEmailModal, setShowUpdateEmailModal] = useState(false);
  const [newEmailText, setNewEmailText] = useState('');
  const [confirmNewEmailText, setConfirmNewEmailText] = useState('');

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cameraEnabled, setCameraEnabled] = useState(false);


  useEffect(() => {
    (async () => {
      try {
        const settings = await loadReminderSettings();
        setEnabled(settings.enabled);

        const loadedDate = new Date();
        loadedDate.setHours(settings.time.hour);
        loadedDate.setMinutes(settings.time.minute);
        loadedDate.setSeconds(0);
        loadedDate.setMilliseconds(0);

        setSavedTime(loadedDate);
        setDraftTime(loadedDate);
        setHasSavedReminder(settings.enabled);
        setIsEditingReminder(false);
      } catch (e) {
        console.warn('Failed to load reminder settings', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);


  const refreshCameraStatus = useCallback(() => {
    const granted = !!cameraPermission?.granted;
    setCameraEnabled(granted);
  }, [cameraPermission]);

  useFocusEffect(
    useCallback(() => {
      refreshCameraStatus();
    }, [refreshCameraStatus])
  );

  const formatSelectedTime = (date: Date): string => {
    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const toReminderTime = (date: Date): ReminderTime => {
    return {
      hour: date.getHours(),
      minute: date.getMinutes(),
    };
  };

  const handleToggle = async (value: boolean) => {
    if (value) {
      setEnabled(true);
      setDraftTime(savedTime);

      if (hasSavedReminder) {
        setIsEditingReminder(false);
      } else {
        setIsEditingReminder(true);
      }
      return;
    }

    await disableDailyCheckInReminder();
    setEnabled(false);
    setDraftTime(savedTime);
    setIsEditingReminder(false);

    Alert.alert(
      'Daily reminder off',
      'We will stop sending daily check-in reminders.'
    );
  };

  const handleCancelReminderEdit = async () => {
    setDraftTime(savedTime);

    if (!hasSavedReminder) {
      await disableDailyCheckInReminder();
      setEnabled(false);
    }

    setIsEditingReminder(false);
  };

  const handleSaveReminderTime = async () => {
    const reminderTime = toReminderTime(draftTime);
    const id = await scheduleDailyCheckInReminder(reminderTime);

    if (!id) {
      Alert.alert(
        'Notifications disabled',
        'We could not get permission to send notifications. Please enable notifications in Settings.'
      );
      setEnabled(false);
      setIsEditingReminder(false);
      return;
    }

    setSavedTime(draftTime);
    setHasSavedReminder(true);
    setEnabled(true);
    setIsEditingReminder(false);

    Alert.alert(
      'Reminder set',
      `Daily check-in will happen around ${formatSelectedTime(draftTime)}.`
    );
  };


  const handleCameraToggle = async (value: boolean) => {
    if (value) {
      Alert.alert(
        'Camera Access',
        'Omnia uses your camera to scan food barcodes.',
        [
          {
            text: 'Deny',
            style: 'cancel',
            onPress: () => {
              Alert.alert(
                'Camera access not enabled',
                'Barcode scanning will stay unavailable until camera access is allowed.',
                [{ text: 'OK' }]
              );
            },
          },
          {
            text: 'Allow',
            onPress: async () => {
              if (cameraPermission && cameraPermission.canAskAgain === false) {
                Alert.alert(
                  'Enable Camera in Settings',
                  'Camera access was previously denied. Please enable it in your device Settings to use barcode scanning.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Open Settings',
                      onPress: () => openAppSettings(),
                    },
                  ]
                );
                return;
              }

              const result = await requestCameraPermission();

              if (result.granted) {
                setCameraEnabled(true);
              } else {
                setCameraEnabled(false);
                Alert.alert(
                  'Camera access not enabled',
                  'Barcode scanning will stay unavailable until camera access is allowed.',
                  [{ text: 'OK' }]
                );
              }
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      'Turn Off Camera Access',
      'Turning off camera access will block barcode scanning. To disable it, continue in your device Settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Go to Settings',
          onPress: () => {
            openAppSettings();
          },
        },
      ]
    );
  };

  const goBackToProfile = () => {
    navigation.dispatch(
      CommonActions.navigate({
        name: '(tabs)',
        params: {
          screen: 'Profile',
        },
      })
    );
  };

  const handleLogout = async () => {
    await logout();
    navigation.navigate('(auth)' as never);
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      setShowDeleteModal(false);
      setDeleteConfirmText('');
      navigation.navigate('(auth)' as never);
    } catch (error) {
      console.error('Error deleting account:', error);
      setShowDeleteModal(false);
      setDeleteConfirmText('');
      Alert.alert('Error', 'Failed to delete account. Please try again.');
    }
  };

  const handleUpdateEmail = async () => {
    try {
      await updateEmail(newEmailText);
      setShowUpdateEmailModal(false);
      setNewEmailText('');
      setConfirmNewEmailText('');
      Alert.alert('Email successfully changed');
    } catch (error) {
      console.error('Error changing email', error);
      setShowUpdateEmailModal(false);
      setNewEmailText('');
      setConfirmNewEmailText('');
      Alert.alert('Error, failed to change email, please try again');
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmText('');
  };

  const handleCloseUpdateEmailModal = () => {
    setShowUpdateEmailModal(false);
    setNewEmailText('');
    setConfirmNewEmailText('');
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
        <Stack.Screen
          options={{
            title: 'Settings',
            headerLeft: () => (
              <Pressable onPress={goBackToProfile} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="black" />
                <ThemedText style={styles.backButtonText}>Back</ThemedText>
              </Pressable>
            ),
          }}
        />
        <ThemedView style={styles.container}>
          <ThemedText>Loading settings...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
      <Stack.Screen
        options={{
          title: 'Settings',
          headerLeft: () => (
            <Pressable onPress={goBackToProfile} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="black" />
              <ThemedText style={styles.backButtonText}>Back</ThemedText>
            </Pressable>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ThemedView style={styles.container}>
            <View style={styles.sectionHeaderBlock}>
              <ThemedText style={styles.sectionHeader}>Notifications</ThemedText>
              <View style={styles.sectionLine} />
            </View>

            <View style={styles.switchCard}>
              <ThemedText style={styles.switchTitle}>
                Allow Daily Check-in
              </ThemedText>
              <Switch value={enabled} onValueChange={handleToggle} />
            </View>

            {enabled && isEditingReminder && (
              <View style={styles.reminderCard}>
                <View style={styles.reminderCardHeader}>
                  <Pressable onPress={handleCancelReminderEdit}>
                    <Ionicons name="close" size={24} color="#333" />
                  </Pressable>

                  <ThemedText style={styles.reminderCardTitle}>
                    Add Reminder
                  </ThemedText>

                  <Pressable onPress={handleSaveReminderTime}>
                    <Ionicons name="checkmark" size={26} color="#F5A623" />
                  </Pressable>
                </View>

                <DateTimePicker
                  value={draftTime}
                  mode="time"
                  display="spinner"
                  onChange={(_, date) => {
                    if (date) setDraftTime(date);
                  }}
                  style={styles.picker}
                />
              </View>
            )}

            {enabled && hasSavedReminder && !isEditingReminder && (
              <Pressable
                style={styles.summaryCard}
                onPress={() => {
                  setDraftTime(savedTime);
                  setIsEditingReminder(true);
                }}
              >
                <View>
                  <ThemedText style={styles.summaryTitle}>
                    Daily Check-in
                  </ThemedText>
                  <ThemedText style={styles.summaryTime}>
                    {formatSelectedTime(savedTime)}
                  </ThemedText>
                </View>

                <ThemedText style={styles.editText}>Edit</ThemedText>
              </Pressable>
            )}

            <View style={[styles.sectionHeaderBlock, { marginTop: 18 }]}>
              <ThemedText style={styles.sectionHeader}>
                Data &amp; Privacy
              </ThemedText>
              <View style={styles.sectionLine} />
            </View>

            <View style={styles.switchCard}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <ThemedText style={styles.switchTitle}>Camera Access</ThemedText>
                <ThemedText style={styles.settingDescription}>
                  Allow access to the camera for barcode scanning.
                </ThemedText>
              </View>

              <Switch value={cameraEnabled} onValueChange={handleCameraToggle} />
            </View>

            <View style={[styles.sectionHeaderBlock, { marginTop: 18 }]}>
              <ThemedText style={styles.sectionHeader}>Manage Account</ThemedText>
              <View style={styles.sectionLine} />
            </View>

            <View style={styles.accountButtonGroup}>
              <Pressable style={styles.accountCard} onPress={handleLogout}>
                <ThemedText style={styles.logoutText}>Logout</ThemedText>
              </Pressable>

              <Pressable
                style={styles.accountCard}
                onPress={() => setShowUpdateEmailModal(true)}
              >
                <ThemedText style={styles.updateText}>Update Email</ThemedText>
              </Pressable>

              <Pressable
                style={styles.accountCard}
                onPress={() => setShowDeleteModal(true)}
              >
                <ThemedText style={styles.deleteText}>Delete Account</ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <ConfirmDeleteModal
        isVisible={showDeleteModal}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteAccount}
        confirmText={deleteConfirmText}
        onChangeText={setDeleteConfirmText}
      />

      <UpdateEmailModal
        isVisible={showUpdateEmailModal}
        onClose={handleCloseUpdateEmailModal}
        onConfirm={handleUpdateEmail}
        confirmNewEmailText={confirmNewEmailText}
        newEmailText={newEmailText}
        onChangeText={setNewEmailText}
        onConfirmChangeText={setConfirmNewEmailText}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionHeaderBlock: {
    marginTop: 6,
    marginBottom: 6,
  },

  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },

  sectionLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#CFCFCF',
  },

  accountCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    minHeight: 54,
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E2E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  logoutText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#1677E6',
  },

  updateText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#36AE7C',
  },

  deleteText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#E53935',
  },

  accountButtonGroup: {
    gap: 10,
  },

  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
    gap: 16,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },

  backButtonText: {
    fontSize: 17,
  },

  switchCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  switchTitle: {
    fontSize: 17,
    fontWeight: '500',
  },

  reminderCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECECEC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  reminderCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  reminderCardTitle: {
    fontSize: 20,
    fontWeight: '600',
  },

  picker: {
    alignSelf: 'center',
  },

  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ECECEC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
  },

  summaryTime: {
    marginTop: 6,
    fontSize: 16,
    color: '#777',
  },

  editText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5B5BD6',
  },

  settingDescription: {
    marginTop: 4,
    fontSize: 14,
    color: '#777',
    lineHeight: 20,
  },
});