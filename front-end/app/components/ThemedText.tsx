//Developed by Johan Ramirez

import { Text, TextProps, TextStyle, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Colors } from '../../constants/Colors'

// Define the props for ThemedText component
interface ThemedTextProps extends TextProps {
  style?: TextStyle | TextStyle[]; 
  title?: boolean;
  gradient?: boolean;
  gradientColors?: readonly[string, string, ...string[]];
  gradientStart?: {x: number, y:number},
  gradientEnd?: {x: number, y: number}
}

// ThemedText component for consistent text styling
const ThemedText = ({ 
  style, 
  title = false, 
  gradient = false,
  gradientColors = ['#4A90E2', '#8B5CF6'],
  gradientStart = {x: -.6, y:0},
  gradientEnd = {x: 1, y: 0},
  ...props 
}: ThemedTextProps) => {
  const theme = Colors.default;

  const textColor = title ? theme.primaryBlue : theme.darkGray; 
  
  let textStyle = [
      { color: textColor }, 
      style // Custom style always goes last to override
  ];

  if (title) {
      textStyle.unshift(styles.googleTitle);
  }

  // If gradient is requested, wrap in MaskedView
  if (gradient) {
    return (
      <MaskedView
        maskElement={
          <Text 
            style={textStyle}
            {...props} 
          />
        }
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: -0.6, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text 
            style={[textStyle, { opacity: 0 }]}
            {...props} 
          />
        </LinearGradient>
      </MaskedView>
    );
  }

  // Regular text without gradient (default behavior)
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