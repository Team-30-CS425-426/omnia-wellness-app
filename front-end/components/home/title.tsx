import { StyleProp, View, ViewStyle, Text } from "react-native"


interface TitleProps {
    style?: StyleProp<ViewStyle>
}


export default function Title({ style }: TitleProps) {
    return (
        <View style={style}>
            <Text style={{
                fontSize: 30,
                fontFamily: 'serif'
            }}>O M N I A</Text>
        </View>
    )
}