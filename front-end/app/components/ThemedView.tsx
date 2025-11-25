import { View, ViewProps, StyleSheet} from 'react-native'
import { Colors } from "../../constants/Colors"

interface ThemedViewProps extends ViewProps {
}

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