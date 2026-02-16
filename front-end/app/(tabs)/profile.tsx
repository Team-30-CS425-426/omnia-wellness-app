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
import SetGoalModal from '../components/SetGoalModal';
import ThemedCard from '../components/ThemedCard';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';


const ProfilePage = () =>{
    const insets = useSafeAreaInsets();
    const totalTopPadding = insets.top;

    const { logout, user, deleteAccount } = useUser();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [showGoalModal, setShowGoalModal] = useState(false);

    const handleLogout = async () => {
        await logout();
        router.replace('/');
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

    // profile.tsx - Update handleGoalSelect
const handleGoalSelect = (goalType: 'nutrition' | 'sleep' | 'physical-activity' | 'mood') => {
    // Navigate FIRST - new screen will cover the modal
    if (goalType === 'nutrition'){
      router.push('/screens/nutritionGoal');
    }
    
    // Close modal after navigation starts (it will be hidden by new screen)
    setTimeout(() => {
      setShowGoalModal(false);
    }, 100);
  };

    return (
        <ThemedView style = {[styles.container, { backgroundColor: Colors.default.lightGray }]}>

            <ThemedView style = {[styles.headerBar, {paddingTop : totalTopPadding + 20}]}>
                <ThemedText title={true} 
                    style = {{color: Colors.default.darkBlue}}> 
                    Your Profile 
                </ThemedText>
            </ThemedView>

            <Spacer height={15} />

            <ThemedCard color = {Colors.default.white} style = {{height: 50, width: '90%', 
                justifyContent: 'center',
                 alignItems: 'center', 
                 shadowColor: Colors.default.lightGray,
                 borderColor: Colors.default.berryBlue,
                 
                 padding: 0}}>
                <ThemedText style = {[styles.subHeader, {color: Colors.default.berryBlue}]}> Goals </ThemedText>
            </ThemedCard>

            <Spacer height={15} />

            <ThemedCard style={{
            height: 200,
            width: '45%',
            justifyContent: 'center', 
            alignItems: 'center',
            padding: 10}}
            onPress={() => setShowGoalModal(true)}>
                
            <Ionicons 
                name="add" 
                size={48} 
                color={Colors.default.berryBlue}/>
            </ThemedCard>

            <Spacer height={10} />

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

            <SetGoalModal
                isVisible={showGoalModal}
                onClose={() => setShowGoalModal(false)}
                onSelect={handleGoalSelect}
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
        fontSize : 26
    },    
    leftAlignedView: {
        justifyContent: 'flex-start',
        width: '100%',
        paddingHorizontal: 20,
    },
    headerBar: {
        width: '100%',
        backgroundColor: Colors.default.white,  // Or any color you want,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        // Optional: Add border or shadow
        borderBottomWidth: 1,
        borderBottomColor: Colors.default.lightGray,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        // elevation: 3, // For Android shadow
    },
})
