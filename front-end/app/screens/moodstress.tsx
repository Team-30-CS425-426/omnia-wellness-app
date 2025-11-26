import { Text, Button, View } from 'react-native'
import { useRouter } from 'expo-router'

export default function MoodStressPage() {
    const router = useRouter()
    return (
        <View>
            <Text>This is a placeholder Mood/Stress page</Text>
            <Button title='Save Entry' onPress={() => {router.replace('../(tabs)/home')}}/>
        </View>
    )
}