//Developed by Johan Ramirez
import React, {useState, useEffect, useCallback} from 'react'
import { useFocusEffect } from "@react-navigation/native";
import { router } from 'expo-router';
import {Alert, StyleSheet, View} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getUserNutritionGoals } from '../../src/services/nutritionGoalService';
import { useUser } from '../../contexts/UserContext';
import ThemedView from '../components/ThemedView'
import ThemedText from '../components/ThemedText'
import Spacer from '../components/Spacer'
import ThemedButton from '../components/ThemedButton'
import { Colors } from '../../constants/Colors';
import ConfirmDeleteModal from '../components/DeleteConfirmationModal';
import SetGoalModal from '../components/SetGoalModal';
import ThemedCard from '../components/ThemedCard';
import { Ionicons } from '@expo/vector-icons';
import { GoalType, GOAL_CONFIGS, UserGoal } from '../../constants/goalConfigs';

const ProfilePage = () =>{
    const insets = useSafeAreaInsets();
    const totalTopPadding = insets.top;

    const { logout, user, deleteAccount } = useUser();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [showGoalModal, setShowGoalModal] = useState(false);

    // Generic goals array - can hold any goal type
    const [userGoals, setUserGoals] = useState<UserGoal[]>([]);

    // Fetch all goals
    const fetchAllGoals = useCallback(async () => {
        if (!user?.id) return;
        
        const goals: UserGoal[] = [];

        // Fetch nutrition goal
        try {
            const nutritionData = await getUserNutritionGoals(user.id);
            if (nutritionData) {
                goals.push({
                    type: 'nutrition',
                    data: nutritionData
                });
            }
        } catch (error) {
            // No nutrition goal exists - that's okay
        }

        setUserGoals(goals);
    }, [user?.id]);

    // Fetch on mount
    useEffect(() => {
        fetchAllGoals();
    }, [fetchAllGoals]);

    // Refetch when screen comes into focus (after creating a new goal)
    useFocusEffect(
        useCallback(() => {
            fetchAllGoals();
        }, [fetchAllGoals])
    );

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

    const handleGoalSelect = (goalType: GoalType) => {

        if (goalType !== 'nutrition') {
            Alert.alert('coming Soon!', 'Only nutrition goals are currently supported');
            return;
        }

        const config = GOAL_CONFIGS[goalType];
        router.push(config.route as any);
        
        // Close modal after navigation starts
        setTimeout(() => {
            setShowGoalModal(false);
        }, 100);
    };

    // Render a goal card dynamically
    const renderGoalCard = (goal: UserGoal) => {
        const config = GOAL_CONFIGS[goal.type];
        
        return (
            <ThemedCard 
                key={goal.type}
                color={config.color}
                style={[
                    styles.goalCard,
                    { borderWidth: 2, borderColor: config.textColor }
                ]}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <Ionicons name={config.icon} size={20} color={config.textColor} style={{ marginRight: 10 }} />
                    <ThemedText style={{ fontSize: 16, fontWeight: 'bold', color: config.textColor }}>
                        {config.label}
                    </ThemedText>
                </View>
                {config.renderDetails(goal.data)}
            </ThemedCard>
        );
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

            {/* Container for goal cards - allows 2 cards per row */}
            <View style={styles.goalsContainer}>
                {/* Display all existing goals dynamically */}
                {userGoals.map(goal => renderGoalCard(goal))}

                {/* Add Goal Card */}
                <ThemedCard 
                    style={styles.addGoalCard}
                    onPress={() => setShowGoalModal(true)}
                >
                    <Ionicons 
                        name="add" 
                        size={48} 
                        color={Colors.default.berryBlue}
                    />
                </ThemedCard>
            </View>

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
    headerBar: {
        width: '100%',
        backgroundColor: Colors.default.white,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 1,
        borderBottomColor: Colors.default.lightGray,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    goalsContainer: {
        width: '90%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
    },
    goalCard: {
        height: 200,
        width: '45%',
        padding: 10,
        marginBottom: 10,
    },
    addGoalCard: {
        height: 200,
        width: '45%',
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 10,
        marginBottom: 10,
    },
})