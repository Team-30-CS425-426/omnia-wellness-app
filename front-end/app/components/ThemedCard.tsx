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
    >
      {children}
    </Pressable>
  )
}
const styles = StyleSheet.create({
  cardBase: {
    backgroundColor: Colors.default.white,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.default.mediumGray,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  pressed: {
    opacity: 0.5
  },
})

export default ThemedCard
