/**
 * SetGoalModal.tsx
 * 
 * MODAL COMPONENT for the Goal system.
 * Displays a popup with a 2x2 grid of goal categories (Nutrition, Sleep, Activity, Mood)
 * that the user can tap to begin creating a new goal.
 * 
 * FLOW:
 *   1. User taps the "+" card on the Profile page
 *   2. This modal appears with animated fade-in
 *   3. User taps a goal category (e.g. "Nutrition")
 *   4. handleSelect fires, which calls onSelect(goalType) — passed down from profile.tsx
 *   5. profile.tsx's handleGoalSelect receives the GoalType, looks up the route
 *      in GOAL_CONFIGS, and navigates to the appropriate goal-setting screen
 *   6. The modal closes after navigation begins
 * 
 * Currently, only "Nutrition" is fully implemented — the other categories
 * show a "Coming Soon" alert (handled in profile.tsx's handleGoalSelect).
 */

//Developed by Johan Ramirez
import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import ThemedText from './ThemedText';
import Spacer from './Spacer';
import { GoalType, getIconColor } from '@/constants/goalConfigs';


/**
 * GOAL_OPTIONS
 * The list of goal categories displayed in the modal grid.
 * Each option maps to a GoalType and provides a label + icon for the UI.
 * When a new goal type is added, add a new entry here to make it appear in the modal.
 */

interface EditModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onDelete: () => void;
}

const EditModal: React.FC<EditModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  onDelete
}) => {
    const handleYes = () => {
        onConfirm();
    };

    const handleDelete = () => {
        onDelete();
    };
  // Passes the selected goal type back up to profile.tsx for routing
  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      style={styles.modalStyle}
      animationIn="fadeInUp"      // Smooth fade + slide up on open
      animationOut="fadeOutDown"  // Smooth fade + slide down on close
      animationInTiming={300}     // Duration for opening animation (ms)
      animationOutTiming={300}    // Duration for closing animation (ms)
      backdropTransitionInTiming={300}   // Backdrop fade in
      backdropTransitionOutTiming={300}  // Backdrop fade out
      useNativeDriver={true} 
    >
      <View style={styles.content}>
        <ThemedText style={styles.title}>What would you like to do?</ThemedText>
        <Spacer height={20} />
        
        <View style={[styles.grid, { marginHorizontal: 20, gap: 10 }]}>
            <TouchableOpacity style={styles.yesButton} onPress={handleYes}>
            <ThemedText style={styles.buttonText}>Edit Goal</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.noButton} onPress={handleDelete}>
            <ThemedText style={styles.buttonText}>Delete Goal</ThemedText>
            </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalStyle: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
  },
  content: {
    backgroundColor: Colors.default.white,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginHorizontal: 20,
  },
  gridItem: {
    width: '48%',
    padding: 20,
    backgroundColor: Colors.default.lightGray,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  gridLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  yesButton: {
    flex: 1,
    backgroundColor: Colors.default.primaryBlue,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  noButton: {
    flex: 1,
    backgroundColor: Colors.default.errorRed,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.default.white,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default EditModal;
