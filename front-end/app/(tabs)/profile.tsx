import { View, Text, Button } from 'react-native'
import { useRouter } from 'expo-router'

export default function ProfilePage(){
    const router = useRouter()
    return(
        <View>
            <Button
                title='Log Out'
                onPress={() => router.replace('/')}
            />
        </View>
    )
}