<<<<<<< HEAD
// Developed by Johan Ramirez
=======
//Developed by Johan Ramirez
>>>>>>> main
import { View, ViewProps, StyleSheet} from 'react-native'
import { Colors } from "../../constants/Colors"

// Define the props for ThemedView component
interface ThemedViewProps extends ViewProps {
}
// ThemedView component for consistent view styling
const ThemedView = ({ style, ...props } : ThemedViewProps) => {
    const theme = Colors.default

  return (
    <View  
        style={[{backgroundColor: theme.white}, style]}
        {...props}
    />
  )
}
export default ThemedView
