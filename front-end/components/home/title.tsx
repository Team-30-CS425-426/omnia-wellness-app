import { StyleProp, View, ViewStyle, Text } from "react-native"
import ThemedView from '../../app/components/ThemedView'
import ThemedText from '../../app/components/ThemedText'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {StyleSheet} from 'react-native'

interface TitleProps {
    style?: StyleProp<ViewStyle>
}

export default function Title({ style }: TitleProps) {
    const insets = useSafeAreaInsets();
    
    return (
        <ThemedView style={[
            styles.container, 
            { 
                paddingBottom: insets.bottom // Use the actual inset, don't subtract 150
            }, 
            style
        ]}>
           <ThemedText title={true}>Omnia</ThemedText>
        </ThemedView>
    )
}
const styles = StyleSheet.create({
    container: {
        flex:1,
        alignItems:'center',
        justifyContent:'center'
    },
    subHeader:{ 
        fontWeight : '600',
        fontSize : 24,
    },
    
})
