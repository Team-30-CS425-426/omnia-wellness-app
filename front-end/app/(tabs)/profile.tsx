//Developed by Johan Ramirez
import React, {useState, useEffect, useCallback} from 'react'
import { useFocusEffect } from "@react-navigation/native";
import { router } from 'expo-router';
import {StyleSheet, View} from 'react-native'
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
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';

// Define goal types
type GoalType = 'nutrition' | 'sleep' | 'physical-activity' | 'mood';

// Configuration for each goal type's display
interface GoalDisplayConfig {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    renderDetails: (goal: any) => React.ReactNode;
}

// Configuration map - add new goal types here
const GOAL_CONFIGS: Record<GoalType, GoalDisplayConfig> = {
    'nutrition': {
        label: 'Nutrition Goal',
        icon: 'restaurant',
        color: Colors.default.white,
        renderDetails: (goal) => (
            <View style={styles.goalDetails}>
                <ThemedText style={[styles.goalText, { color: Colors.default.strongGreen }]}>
                    Calories: {goal.calorie_goal}
                </ThemedText>
                <ThemedText style={[styles.goalText, { color: Colors.default.strongGreen }]}>
                    Protein: {goal.protein_goal}g
                </ThemedText>
                <ThemedText style={[styles.goalText, { color: Colors.default.strongGreen }]}>
                    Carbs: {goal.carb_goal}g
                </ThemedText>
                <ThemedText style={[styles.goalText, { color: Colors.default.strongGreen }]}>
                    Fat: {goal.fat_goal}g
                </ThemedText>
            </View>
        )
    },
    'sleep': {
        label: 'Sleep Goal',
        icon: 'bed',
        color: Colors.default.berryBlue,
        renderDetails: (goal) => (
            <View style={styles.goalDetails}>
                <ThemedText style={styles.goalText}>
                    Target Hours: {goal.target_hours}h
                </ThemedText>
                <ThemedText style={styles.goalText}>
                    Bedtime: {goal.bedtime || 'Not set'}
                </ThemedText>
            </View>
        )
    },
    'physical-activity': {
        label: 'Activity Goal',
        icon: 'barbell',
        color: Colors.default.darkBlue,
        renderDetails: (goal) => (
            <View style={styles.goalDetails}>
                <ThemedText style={styles.goalText}>
                    Weekly: {goal.weekly_minutes || 0} min
                </ThemedText>
                <ThemedText style={styles.goalText}>
                    Days/Week: {goal.days_per_week || 0}
                </ThemedText>
            </View>
        )
    },
    'mood': {
        label: 'Mood Goal',
        icon: 'happy',
        color: Colors.default.mustardYellow,
        renderDetails: (goal) => (
            <View style={styles.goalDetails}>
                <ThemedText style={styles.goalText}>
                    Target: {goal.target_mood || 'Not set'}
                </ThemedText>
                <ThemedText style={styles.goalText}>
                    Check-ins: {goal.daily_checkins || 0}
                </ThemedText>
            </View>
        )
    }
};

// Generic goal structure
interface UserGoal {
    type: GoalType;
    data: any; // The actual goal data (varies by type)
}

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

        // TODO: Add fetchers for other goal types as you implement them
        // Example for sleep goals:
        // try {
        //     const sleepData = await getUserSleepGoals(user.id);
        //     if (sleepData) {
        //         goals.push({ type: 'sleep', data: sleepData });
        //     }
        // } catch (error) {
        //     // No sleep goal exists
        // }

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

    const handleGoalSelect = (goalType: 'nutrition' | 'sleep' | 'physical-activity' | 'mood') => {
        // Navigate to appropriate screen
        if (goalType === 'nutrition'){
            router.push('/screens/nutritionGoal');
        } else if (goalType === 'sleep'){
            router.push('/screens/sleepGoal');
        } else if (goalType === 'physical-activity'){
            router.push('/screens/workoutGoal');
        } else if (goalType === 'mood'){
            router.push('/screens/moodStressGoal');
        }
        
        // Close modal after navigation starts
        setTimeout(() => {
            setShowGoalModal(false);
        }, 100);
    };

    // Render a goal card dynamically
    const renderGoalCard = (goal: UserGoal) => {
        const config = GOAL_CONFIGS[goal.type];
        const isNutrition = goal.type === 'nutrition';
        const textColor = isNutrition ? Colors.default.strongGreen : Colors.default.white;
        const iconColor = isNutrition ? Colors.default.strongGreen : Colors.default.white;
        const borderColor = isNutrition ? Colors.default.strongGreen : undefined;
        
        return (
            <ThemedCard 
                key={goal.type}
                color={config.color}
                style={[
                    styles.goalCard,
                    borderColor && { borderWidth: 2, borderColor: borderColor }
                ]}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <Ionicons 
                        name={config.icon} 
                        size={20} 
                        color={iconColor}
                        style={{ marginRight: 10 }}
                    />
                    <ThemedText style={{ 
                        fontSize: 16, 
                        fontWeight: 'bold',
                        color: textColor 
                    }}>
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
    goalDetails: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    goalText: {
        fontSize: 16,
        color: Colors.default.white,
        marginVertical: 4,
        width: '48%',
    },
})