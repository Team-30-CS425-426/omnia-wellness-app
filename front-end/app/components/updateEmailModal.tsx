//Developed by Johan Ramirez
import React from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, Keyboard, TouchableWithoutFeedback } from 'react-native';
import Modal from 'react-native-modal';
import { Colors } from '../../constants/Colors';
import ThemedText from './ThemedText';
import Spacer from './Spacer';

interface UpdateEmailModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  newEmailText:string
  confirmNewEmailText: string;
  onChangeText: (text: string) => void;
  onConfirmChangeText: (text: string) => void;
}


const UpdateEmailModal: React.FC<UpdateEmailModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  newEmailText,
  confirmNewEmailText,
  onChangeText,
  onConfirmChangeText
}) => {
    const isConfirmEnabled = newEmailText.length > 0 && confirmNewEmailText.length > 0 && newEmailText == confirmNewEmailText;
    return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      style={styles.modalStyle}
    >
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.content}>
        <ThemedText style={styles.title}>Update Email</ThemedText>
        <Spacer height={15} />
        
        
        <ThemedText style={styles.boldText}>Enter New Email</ThemedText>
        <Spacer height={10} />

        <TextInput
          value={newEmailText}
          onChangeText={onChangeText}
          placeholder="user@xyz.com"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Spacer height={20} />

        <ThemedText style={styles.boldText}>Confirm New Email</ThemedText>
        <Spacer height={10} />

        <TextInput
          value={confirmNewEmailText}
          onChangeText={onConfirmChangeText}
          placeholder="user@xyz.com"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Spacer height={20} />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.changeButton,
              !isConfirmEnabled && styles.changeButtonDisabled
            ]}
            onPress={onConfirm}
            disabled={!isConfirmEnabled}
          >
            <ThemedText style={styles.deleteButtonText}>Change Email</ThemedText>
          </TouchableOpacity>
        </View>
        
        </View>
      </TouchableWithoutFeedback>
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
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.default.strongGreen,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  boldText: {
    fontWeight: 'bold',
    color: Colors.default.strongGreen,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#e5e5e5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
  changeButton: {
    flex: 1,
    backgroundColor: Colors.default.strongGreen,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  changeButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default UpdateEmailModal;
