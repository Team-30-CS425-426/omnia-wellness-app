// ThemedText.tsx (Modified)
// Developed by Johan Ramirez
import { Text, TextProps, TextStyle, StyleSheet } from 'react-native'
import { Colors } from '../../constants/Colors'

// Define the props for ThemedText component
interface ThemedTextProps extends TextProps {
  style?: TextStyle | TextStyle[]; 
  title?: boolean;
}
// ThemedText component for consistent text styling
const ThemedText = ({ style, title = false, ...props }: ThemedTextProps) => {
  const theme = Colors.default;

  const textColor = title ? theme.primaryBlue : theme.darkGray; 
  
  let textStyle = [
      { color: textColor }, 
      style // Custom style always goes last to override
  ];

  if (title) {
      textStyle.unshift(styles.googleTitle);
  }

  return (
    <Text 
      style={textStyle}
      {...props}
    />
  )
}

// Create a StyleSheet for the Title
const styles = StyleSheet.create({
    googleTitle: {
        textAlign: 'center',
        textAlignVertical: 'top',
        fontSize: 36, 
        fontWeight: '700',
        lineHeight: 40, 
        marginBottom: 16, 
    }
});

export default ThemedText