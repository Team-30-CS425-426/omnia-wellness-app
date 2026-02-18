/**
 * profile.tsx
 * 
 * PROFILE PAGE — the main hub for the Goal system and account management.
 * 
 * This page is responsible for:
 *   1. DISPLAYING GOAL CARDS: Fetches the user's active goals from the database
 *      and renders a card for each one using configurations from goalConfigs.tsx.
 *      Cards are arranged in a 2-column grid (45% width each, centered).
 *   2. ADDING NEW GOALS: Shows a "+" card that opens the SetGoalModal, which
 *      lets the user pick a goal category and navigate to the goal-setting screen.
 *   3. ACCOUNT MANAGEMENT: Provides Logout and Delete Account buttons.
 * 
 * GOAL SYSTEM FLOW (from this file's perspective):
 *   - On mount and every time the screen comes into focus (useFocusEffect),
 *     fetchAllGoals() queries the database for each goal type.
 *   - Currently only nutrition goals are fetched (via getUserNutritionGoals).
 *     To add more goal types, add more fetch calls in fetchAllGoals().
 *   - Each fetched goal is stored as a UserGoal { type, data } in the userGoals array.
 *   - userGoals.map() renders a card for each goal using renderGoalCard(),
 *     which looks up the display config (label, icon, color, renderDetails)
 *     from GOAL_CONFIGS in goalConfigs.tsx.
 *   - When the "+" card is tapped, SetGoalModal opens. When a category is selected,
 *     handleGoalSelect() routes to the appropriate goal-setting screen.
 * 
 * DEPENDENCIES:
 *   - goalConfigs.tsx: GoalType, GOAL_CONFIGS, UserGoal (display configuration)
 *   - nutritionGoalService.ts: getUserNutritionGoals() (data fetching)
 *   - SetGoalModal.tsx: modal UI for goal category selection
 */

//Developed by Johan Ramirez
import React, {useState, useEffect, useCallback} from 'react'
import { useFocusEffect } from "@react-navigation/native";
import { router } from 'expo-router';
import {Alert, StyleSheet, View} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { deleteNutritionGoal, getUserNutritionGoals } from '../../src/services/nutritionGoalService';
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
import EditModal from '../components/editModal';

const ProfilePage = () =>{
    const insets = useSafeAreaInsets();
    const totalTopPadding = insets.top;

    const { logout, user, deleteAccount } = useUser();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<UserGoal | null>(null);

    // Stores all of the user's active goals (nutrition, sleep, etc.)
    // Each entry is a UserGoal { type: GoalType, data: database row }
    const [userGoals, setUserGoals] = useState<UserGoal[]>([]);

    /**
     * fetchAllGoals
     * 
     * Queries the database for each goal type and builds the userGoals array.
     * Currently only fetches nutrition goals. To support new goal types:
     *   1. Import the new service function (e.g. getUserSleepGoals)
     *   2. Add a try/catch block here that pushes { type: 'sleep', data: ... }
     * 
     * Wrapped in useCallback so it can be safely used as a dependency
     * in useEffect and useFocusEffect without causing infinite re-renders.
     */
    const fetchAllGoals = useCallback(async () => {
        if (!user?.id) return;
        
        const goals: UserGoal[] = [];

        // Fetch nutrition goal from the 'nutritiongoals' table
        try {
            const nutritionData = await getUserNutritionGoals(user.id);
            if (nutritionData) {
                goals.push({
                    type: 'nutrition',
                    data: nutritionData  // Raw DB row: { calorie_goal, protein_goal, carb_goal, fat_goal }
                });
            }
        } catch (error) {
            // No nutrition goal exists — that's okay, the card just won't render
        }

        // Future: fetch sleep, activity, mood goals here and push to goals[]

        setUserGoals(goals);
    }, [user?.id]);

    // Fetch goals on initial mount
    useEffect(() => {
        fetchAllGoals();
    }, [fetchAllGoals]);

    // Re-fetch goals every time the profile tab comes into focus
    // This ensures new goals show up immediately after being created on the goal screen
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

    /**
     * handleGoalSelect
     * 
     * Called by SetGoalModal when the user taps a goal category.
     * 
     * 1. Guards against unimplemented goal types (anything other than 'nutrition')
     *    by showing a "Coming Soon" alert.
     * 2. For implemented types, looks up the route from GOAL_CONFIGS and navigates
     *    to the goal-setting screen (e.g. '/screens/nutritionGoal').
     * 3. Closes the modal with a small delay (100ms) so the navigation animation
     *    starts smoothly before the modal dismisses — prevents a visual flicker.
     */
    const handleGoalSelect = (goalType: GoalType) => {

        // Guard: only nutrition is implemented — other types show an alert
        
        if (goalType !== 'nutrition') {
            Alert.alert('coming Soon!', 'Only nutrition goals are currently supported');
            return;
        }

        // Look up the route for this goal type from the centralized config
        const config = GOAL_CONFIGS[goalType];
        router.push(config.route as any);
        
        // Close modal after a brief delay to prevent visual flicker during navigation
        setTimeout(() => {
            setShowGoalModal(false);
        }, 100);
    };

    const handleEditGoal = () => {
        if (!selectedGoal) return;
        const config = GOAL_CONFIGS[selectedGoal.type];
        router.push(`${config.route}?mode=edit` as any);
        
        // Close modal after a brief delay to prevent visual flicker during navigation
        setTimeout(() => {
            setShowEditModal(false);
        }, 100);
    }


    const handleDeleteGoal = async () => {
        if (!user?.id) return;
        try {
            await deleteNutritionGoal(user.id);
            setShowEditModal(false);
            fetchAllGoals();
        } catch (error) {
            console.error("Error:", error);
            alert('Failed to delete goal. Please try again')
        }
    }
    /**
     * renderGoalCard
     * 
     * Dynamically renders a goal card for any goal type using GOAL_CONFIGS.
     * 
     * How it works:
     *   1. Looks up the GoalConfig for this goal's type (label, icon, color, renderDetails)
     *   2. Renders a ThemedCard with the config's styling
     *   3. Calls config.renderDetails(goal.data) to display the goal's specific values
     *      (e.g. for nutrition: calories, protein, carbs, fat)
     * 
     * This design means NO code changes are needed here when adding new goal types —
     * just add the config to GOAL_CONFIGS and the card renders automatically.
     */
    const renderGoalCard = (goal: UserGoal) => {
        const config = GOAL_CONFIGS[goal.type];
        
        return (
            <ThemedCard 
                onPress={() => {setShowEditModal(true); setSelectedGoal(goal);}}
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
                {/* renderDetails is defined in goalConfigs.tsx — it receives the raw DB data */}
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
        
            <EditModal
                isVisible={showEditModal}
                onClose={() => setShowEditModal(false)}
                onConfirm={() => handleEditGoal()}
                onDelete={() => handleDeleteGoal()}
            />
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