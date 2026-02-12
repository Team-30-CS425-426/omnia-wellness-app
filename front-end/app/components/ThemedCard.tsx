//Developed by Johan Ramirez
import { Pressable, StyleSheet , PressableProps, ViewStyle, Platform} from 'react-native'
import { Colors } from '../../constants/Colors'

// Define the props for ThemedButton component
interface ThemedCardProps extends PressableProps {
    style?: object;
    color?: string;
    children?: React.ReactNode;
}
// ThemedButton component for consistent button styling
function ThemedCard({ style, color, children, ...props } : ThemedCardProps) {

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.cardBase, 
        color && { backgroundColor: color }, 
        pressed && styles.pressed, 
        style
      ]} 
      {...props}
    />
  )
}
const styles = StyleSheet.create({
  cardBase: {
    backgroundColor: Colors.default.primaryBlue,
    padding: 20,
    borderRadius: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  pressed: {
    opacity: 0.5
  },
})

export default ThemedCard
