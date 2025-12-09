//Developed by Johan Ramirez
import { Pressable, StyleSheet , PressableProps} from 'react-native'
import { Colors } from '../../constants/Colors'

// Define the props for ThemedButton component
interface ThemedButtonProps extends PressableProps {
    style?: object;
    color?: string;
}
// ThemedButton component for consistent button styling
function ThemedButton({ style, color, ...props } : ThemedButtonProps) {

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.btn, 
        color && { backgroundColor: color }, 
        pressed && styles.pressed, 
        style
      ]} 
      {...props}
    />
  )
}
const styles = StyleSheet.create({
  btn: {
    fontSize: 14,
    backgroundColor: Colors.default.primaryBlue,
    padding: 18,
    borderRadius: 6,
    marginVertical: 10
  },
  pressed: {
    opacity: 0.5
  },
})

export default ThemedButton
