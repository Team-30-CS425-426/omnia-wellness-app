import { Text, Button, View } from 'react-native'
import { useRouter } from 'expo-router'

export default function WorkoutPage() {
    const router = useRouter()
    return (
        <View>
            <Text>This is a placeholder Workout page</Text>
            <Button title='Save Entry' onPress={() => {router.replace('../(tabs)/home')}}/>
        </View>
    )
}
