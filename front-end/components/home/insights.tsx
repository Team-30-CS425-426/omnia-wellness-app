import { StyleProp, Text, View, ViewStyle } from "react-native"

interface InsightsProps {
    style?: StyleProp<ViewStyle>
}


export function Insights({ style }: InsightsProps) {
    return (
        <View style={style}>
            {/* Insights Title */}
            <Text style={{
                fontSize: 20,
                fontFamily: 'times'
            }}>
                Insights
            </Text>

            {/* Body */}
            <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 20
            }}>
                <InsightsItem content="Protein Intake is very low - Try adding a high protein snack"/>
                <InsightsItem content="Reduced deep sleep last night may affect your endurance today. Consider lighter training."/>        
            </View>
        </View>
    )
}


interface InsightsItemProps {
    content?: string
}


function InsightsItem({ content }: InsightsItemProps) {
    return (
        <View style={{
            borderWidth: 1,
            backgroundColor: 'lightgrey',
            width: 200,
            padding: 10
        }}>
            <Text style={{ fontSize: 16 }}>{content}</Text>
        </View>
    )
}
