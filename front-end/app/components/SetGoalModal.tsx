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

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface SetGoalModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (goalType: GoalType) => void; // Callback to profile.tsx with the selected goal type
}

interface GoalOption {
  type: GoalType;
  label: string;
  icon: IoniconName;
}

/**
 * GOAL_OPTIONS
 * The list of goal categories displayed in the modal grid.
 * Each option maps to a GoalType and provides a label + icon for the UI.
 * When a new goal type is added, add a new entry here to make it appear in the modal.
 */
const GOAL_OPTIONS: GoalOption[] = [
  { type: 'nutrition', label: 'Nutrition', icon: 'restaurant-outline' },
  { type: 'sleep', label: 'Sleep', icon: 'bed-outline' },
  { type: 'physical-activity', label: 'Physical Activity', icon: 'barbell-outline' },
  { type: 'mood', label: 'Mood', icon: 'happy-outline' },
];

const SetGoalModal: React.FC<SetGoalModalProps> = ({
  isVisible,
  onClose,
  onSelect,
}) => {
  // Passes the selected goal type back up to profile.tsx for routing
  const handleSelect = (goalType: GoalType) => {
    onSelect(goalType);
  };

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
        <ThemedText style={styles.title}>What goal would you like to add?</ThemedText>
        <Spacer height={20} />
        
        <View style={styles.grid}>
          {GOAL_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.type}
              style={styles.gridItem}
              onPress={() => handleSelect(option.type)}
            >
              <Ionicons 
                name={option.icon} 
                size={40} 
                color={getIconColor(option.type)} 
              />
              <Spacer height={8} />
              <ThemedText style={styles.gridLabel}>{option.label}</ThemedText>
            </TouchableOpacity>
          ))}
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
});

export default SetGoalModal;
