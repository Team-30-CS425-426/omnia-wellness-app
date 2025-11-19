import { Pressable, StyleSheet , PressableProps} from 'react-native'
import { Colors } from '../../constants/Colors'

interface ThemedButtonProps extends PressableProps {
    style?: object;
}
function ThemedButton({ style, ...props } : ThemedButtonProps) {

  return (
    <Pressable 
      style={({ pressed }) => [styles.btn, pressed && styles.pressed, style]} 
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