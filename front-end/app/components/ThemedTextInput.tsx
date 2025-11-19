import { TextInput, TextInputProps, StyleSheet } from 'react-native'
import { Colors } from '../../constants/Colors'

interface ThemedTextInputProps extends TextInputProps {
    styleProp?: object;
}
const ThemedTextInput = ({style, ...restProps} : ThemedTextInputProps) => {
    const theme = Colors.default;
    const defaultStyle = StyleSheet.create({
        input: {
            width: '80%',
            height: 40, 
            // FIX: Use pure white for input background for maximum brightness and clarity
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
                style // Custom style passed in props will override defaults
            ]}
            placeholderTextColor={theme.mediumGray} 
            {...restProps}
    />
  )
}

export default ThemedTextInput

