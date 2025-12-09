//Developed by Johan Ramirez
import React from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput } from 'react-native';
import Modal from 'react-native-modal';
import { Colors } from '../../constants/Colors';
import ThemedText from './ThemedText';
import Spacer from './Spacer';

interface ConfirmDeleteModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  confirmText: string;
  onChangeText: (text: string) => void;
}

const CONFIRMATION = "delete";

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  confirmText,
  onChangeText,
}) => {
  const isConfirmEnabled = confirmText.toLowerCase() === CONFIRMATION;

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      style={styles.modalStyle}
    >
      <View style={styles.content}>
        <ThemedText style={styles.title}>Delete Account</ThemedText>
        <Spacer height={15} />
        
        <ThemedText style={styles.warningText}>
          Warning: This action cannot be undone.
        </ThemedText>
        <Spacer height={10} />
        
        <ThemedText style={styles.descriptionText}>
          All your data will be permanently deleted, including your profile, saved items, and account history.
        </ThemedText>
        <Spacer height={20} />
        
        <ThemedText style={styles.labelText}>
          Type <ThemedText style={styles.boldText}>delete</ThemedText> to confirm:
        </ThemedText>
        <Spacer height={10} />
        
        <TextInput
          value={confirmText}
          onChangeText={onChangeText}
          placeholder="delete"
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
              styles.deleteButton,
              !isConfirmEnabled && styles.deleteButtonDisabled
            ]}
            onPress={onConfirm}
            disabled={!isConfirmEnabled}
          >
            <ThemedText style={styles.deleteButtonText}>Delete Account</ThemedText>
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
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.default.errorRed,
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
    color: Colors.default.errorRed,
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
  deleteButton: {
    flex: 1,
    backgroundColor: Colors.default.errorRed,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ConfirmDeleteModal;
