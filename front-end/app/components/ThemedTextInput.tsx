// Developed by Johan Ramirez
import { TextInput, TextInputProps, StyleSheet } from 'react-native'
import { Colors } from '../../constants/Colors'

// Define the props for ThemedTextInput component
interface ThemedTextInputProps extends TextInputProps {
    styleProp?: object;
}
// ThemedTextInput component for consistent text input styling
const ThemedTextInput = ({style, ...restProps} : ThemedTextInputProps) => {
    const theme = Colors.default;
    const defaultStyle = StyleSheet.create({
        input: {
            width: '80%',
            height: 40, 
           
            backgroundColor: theme.lightGray, 
            color: theme.darkGray, 
            
            paddingHorizontal: 15,
            paddingVertical: 10,

            borderRadius: 6,
            borderColor: theme.mediumGray,
            borderWidth: 1,
            fontSize: 16, 
        }
    });
  return (
    <TextInput
        style={[
                defaultStyle.input,
                style
            ]}
            placeholderTextColor={theme.mediumGray} 
            {...restProps}
    />
  )
}

export default ThemedTextInput

