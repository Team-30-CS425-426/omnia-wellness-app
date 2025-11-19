// ThemedText.tsx (Modified)

import { Text, TextProps, TextStyle, StyleSheet } from 'react-native'
import { Colors } from '../../constants/Colors'

interface ThemedTextProps extends TextProps {
  style?: TextStyle | TextStyle[]; 
  title?: boolean;
}

const ThemedText = ({ style, title = false, ...props }: ThemedTextProps) => {
  const theme = Colors.default;

  const textColor = title ? theme.primaryBlue : theme.darkGray; 
  
  // 3. Define the style array
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

// 5. Create a StyleSheet for the Title
const styles = StyleSheet.create({
    googleTitle: {
        textAlign: 'center',
        textAlignVertical: 'top',
        // Size: Large size for prominence (typical for screen titles)
        fontSize: 36, 
        
        // Weight: Bold or Semi-Bold for emphasis and presence
        fontWeight: '700', // On iOS/Android, '700' usually maps to Bold

        lineHeight: 40, // Can be slightly larger than fontSize for better readability

        // Spacing: A little margin at the bottom often helps titles breathe
        marginBottom: 16, 
    }
});

export default ThemedText