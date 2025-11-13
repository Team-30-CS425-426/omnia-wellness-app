import { View, Text, Button } from 'react-native'
import { useRouter } from 'expo-router'

export default function Index(){
    const router = useRouter()
    return (
        <View>
            <Button
                title='Log In'
                onPress={() => router.replace('/(tabs)/home')}
            />
        </View>
    )
}