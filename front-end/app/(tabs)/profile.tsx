import { View, Text, Button } from 'react-native'
import { useRouter } from 'expo-router'

export default function ProfilePage(){
    const router = useRouter()
    return(
        <View>
            <Text>Hello Profile Page</Text>
            <Button
                title='Log Out'
                onPress={() => router.push('./..')}
            />
        </View>
    )
}