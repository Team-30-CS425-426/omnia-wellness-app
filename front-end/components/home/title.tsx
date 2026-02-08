import { StyleProp, View, ViewStyle, Text } from "react-native"
import ThemedView from '../../app/components/ThemedView'
import ThemedText from '../../app/components/ThemedText'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {StyleSheet} from 'react-native'
import { useUser } from '../../contexts/UserContext';
import { useEffect, useState } from 'react';
import { supabase } from '../../config/supabaseConfig';
import {Colors} from '../../constants/Colors'

interface TitleProps {
    style?: StyleProp<ViewStyle>
}

export default function Title({ style }: TitleProps) {
    const insets = useSafeAreaInsets();
    const { user } = useUser();
    const [name, setName] = useState('');
    
    useEffect(() => {
        if(user?.id){
            const fetchName = async () => {
                const { data, error } = await supabase
                    .from('User')
                    .select('name')
                    .eq('id', user.id)
                    .single();
                if (data?.name){
                    setName(data.name);
                }
        }
        fetchName();
    }
}, [user?.id]);
    return (
        <ThemedView>
           <ThemedText title={true} gradient={true} gradientColors={[Colors.default.primaryBlue, Colors.default.berryPurple]}>Hey, {name} </ThemedText>
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