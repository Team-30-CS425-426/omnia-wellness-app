import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-elements';
import Modal from 'react-native-modal';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router'; 

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const COLORS = {
  primary: '#003cffff',
  tabIconSelected: '#ffffffff',
};

interface Option {
  label: string;
  icon: IoniconName;
}


const OPTIONS: Option[] = [
  { label: 'Workout', icon: 'barbell' },
  { label: 'Mood & Stress', icon: 'happy-outline' },
  { label: 'Sleep', icon: 'bed-outline' },
  { label: 'Nutrition', icon: 'restaurant-outline' },
  { label: 'Habits', icon: 'checkmark-circle-outline'}
];

const AddMenuButton = () => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      {/* Floating circular Add button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setModalVisible(true)}
      >
        <MaterialIcons 
          name="add-circle-outline" 
          size={40} 
          color={COLORS.tabIconSelected} 
        />
      </TouchableOpacity>

      {/* Bottom Sheet Modal */}
      <Modal
        isVisible={modalVisible}
        onBackdropPress={() => setModalVisible(false)}
        style={styles.modalStyle}
      >
        <View style={styles.content}>
          
          <Text style={styles.title}>Choose an Option</Text>

          {/* Grid of options */}
          <View style={styles.grid}>
            {OPTIONS.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.gridItem}
                onPress={() => {
                  setModalVisible(false);

                  setTimeout(() => {
                    if (item.label === 'Workout') {
                      router.push('/screens/workout');
                    } else if (item.label === 'Mood & Stress') {
                      router.push('/screens/moodStress');
                    } else if (item.label === 'Sleep') {
                      router.push('/screens/sleep');
                    } else if (item.label == 'Nutrition') {
                      router.push('/screens/nutrition');
                    } else if (item.label == 'Habits') {
                      router.push('/screens/habit' as any);
                    }
                  }, 200); 
                }}
              >
                <Ionicons name={item.icon} size={32} color="#007AFF" />
                <Text style={styles.gridLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    height: 70,
    width: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  modalStyle: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  content: { 
    backgroundColor: 'white',
    padding: 22,
    borderTopRightRadius: 17,
    borderTopLeftRadius: 17,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    padding: 15,
    backgroundColor: '#F3F3F3',
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  gridLabel: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default AddMenuButton;
