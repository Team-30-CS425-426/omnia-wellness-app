//Developed by Johan Ramirez
import React, {useState} from 'react'
import { router } from 'expo-router';
import {StyleSheet} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUser } from '../../contexts/UserContext';

import ThemedView from '../components/ThemedView'
import ThemedText from '../components/ThemedText'
import Spacer from '../components/Spacer'
import ThemedButton from '../components/ThemedButton'
import { Colors } from '../../constants/Colors';
import ConfirmDeleteModal from '../components/DeleteConfirmationModal';


const ProfilePage = () =>{
    const insets = useSafeAreaInsets();
    const totalTopPadding = insets.top;

    const { logout, user, deleteAccount } = useUser();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const handleLogout = async () => {
        await logout();
        router.replace('/');
    }

    const handleSetGoals = () => {
        router.push('/screens/goals')
    }

    const handleDeleteAccount = async () =>{
        try{
            await deleteAccount();
            setShowDeleteModal(false);
            router.replace('/');
        } catch (error) {
            console.error("Error:", error);
            alert('Failed to delete account. Please try again')
        }
    }

    const handleCloseModal = () => {
        setShowDeleteModal(false);
        setDeleteConfirmText('');
    }

    return (
        <ThemedView style = {[styles.container, {paddingTop : totalTopPadding + 25}]}>
            
            <ThemedText title={true} gradient={true} gradientStart={{x:0, y: 0}} gradientEnd={{x:1, y:0}} gradientColors={[Colors.default.primaryBlue, Colors.default.berryPurple]}> Profile </ThemedText>
            <Spacer height={30} />

            <ThemedText style = {[styles.subHeader]}> Email: </ThemedText>
            <Spacer height={10} />

            <ThemedText> {user?.email} </ThemedText>
            <Spacer height={40} />

            <ThemedButton color = {Colors.default.strongGreen} onPress={handleSetGoals}>  
                <ThemedText style={{color: Colors.default.white}} > Set Goals </ThemedText>
            </ThemedButton>    
            <Spacer height={30} />

            <ThemedButton onPress={handleLogout}>  
                <ThemedText style={{color: Colors.default.white}} > Logout </ThemedText>
            </ThemedButton>    
            <Spacer height={30} />

            <ThemedButton color={Colors.default.errorRed} onPress = {() => setShowDeleteModal(true)}>  
                <ThemedText style={{color: Colors.default.white}} > Delete Account </ThemedText>
            </ThemedButton>    
            <Spacer height={30} />
        
            <ConfirmDeleteModal
                isVisible={showDeleteModal}
                onClose={handleCloseModal}
                onConfirm={handleDeleteAccount}
                confirmText={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
            />
        
        </ThemedView>
    )
}

export default ProfilePage

const styles = StyleSheet.create({
    container: {
        flex:1,
        alignItems:'center',
        justifyContent:'flex-start'
    },
    subHeader:{ 
        fontWeight : '600',
        fontSize : 24,
    },    
})
