//Developed by Johan Ramirez
import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import ThemedText from './ThemedText';
import Spacer from './Spacer';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface SetGoalModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (goalType: 'nutrition' | 'sleep' | 'physical-activity' | 'mood') => void;
}

interface GoalOption {
  type: 'nutrition' | 'sleep' | 'physical-activity' | 'mood';
  label: string;
  icon: IoniconName;
}

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
  const handleSelect = (goalType: 'nutrition' | 'sleep' | 'physical-activity' | 'mood') => {
    onSelect(goalType);
  };

  const getIconColor = (goalType: 'nutrition' | 'sleep' | 'physical-activity' | 'mood') => {
    switch (goalType) {
      case 'nutrition':
        return Colors.default.strongGreen;
      case 'sleep':
        return Colors.default.berryBlue;
      case 'physical-activity':
        return Colors.default.darkBlue;
      case 'mood':
        return Colors.default.mustardYellow;
      default:
        return Colors.default.berryBlue;
    }
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
