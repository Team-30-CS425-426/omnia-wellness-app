import React, { useState } from 'react'; //bring in React to build UI and useState to keep track of changing data
import { StyleSheet, View, TouchableOpacity } from 'react-native'; //import React Native tools: StyleSheet for styles, View for Layout, and TouchableOpacity for clickable buttons 
import { Text } from 'react-native-elements'; //import the Text component from React Native Elements to display styled text
import Modal from 'react-native-modal'; //Import Modal component to show pop-up windows
import { MaterialIcons, Ionicons } from '@expo/vector-icons'; //bring in icons from Expo to show symbols in the UI
import {Colors} from '../../constants/Colors'; //import color constants for consistent theming
//create a TypeScript type (label) for the names of Ionicons icons
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const COLORS = {
  primary: Colors.default.primaryBlue, //used for floating button
  tabIconSelected: Colors.default.white, //used for the icon inside the button
};

//defines a typescript interface for the options displayed in the modal
interface Option {
  label: string;
  icon: IoniconName;
}

//defines an array of options for the modal, and typescript ensures each object matches the Option interface
const OPTIONS: Option[] = [
  { label: 'Workout', icon: 'barbell' },
  { label: 'Mood & Stress', icon: 'happy-outline' },
];

//define a functional component called AddMenuButton
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
                onPress={() => console.log(item.label)}
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
