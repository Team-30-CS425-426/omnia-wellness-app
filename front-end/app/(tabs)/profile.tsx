
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
 **/

//Developed by Johan Ramirez
import React, {useState, useEffect, useCallback} from 'react'
import { useFocusEffect } from "@react-navigation/native";
import { router } from 'expo-router';
import { Alert, StyleSheet, View, Pressable, ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { deleteNutritionGoal, getUserNutritionGoals } from '../../src/services/nutritionGoalService';
import { getSleepGoal, deleteSleepGoal } from '../../src/services/sleepGoalService';
import { getStepsGoal, deleteStepsGoal } from '../../src/services/stepsGoalService';
import { useUser } from '../../contexts/UserContext';
import ThemedView from '../components/ThemedView'
import ThemedText from '../components/ThemedText'
import Spacer from '../components/Spacer'
import { Colors } from '../../constants/Colors';
import SetGoalModal from '../components/SetGoalModal';
import ThemedCard from '../components/ThemedCard';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { GoalType, GOAL_CONFIGS, UserGoal } from '../../constants/goalConfigs';
import EditModal from '../components/editModal';
import { deleteActivityGoal, getUserActivityGoals } from '../../src/services/activityGoalService';
import { deleteMoodGoal, getUserMoodGoals } from '../../src/services/moodGoalService';

// ADDED: imports for category streaks
import { getCategoryStreak } from "../../src/services/categoryStreakService";
import CategoryStreakCard from "../components/CategoryStreakCard";

// ADDED: imports for badges
import { getUserBadges, UserBadgeRow } from "../../src/services/badgeService";
import BadgeCard from "../components/BadgeCard";

// ADDED: temporary backfill import for workout badges
import { checkAndAwardWorkoutBadges } from "../../src/services/badgeAwardService";



const ProfilePage = () =>{
    const insets = useSafeAreaInsets();
    const totalTopPadding = insets.top;

    const { user } = useUser();
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<UserGoal | null>(null);

    // Stores all of the user's active goals (nutrition, sleep, etc.)
    // Each entry is a UserGoal { type: GoalType, data: database row }
    const [userGoals, setUserGoals] = useState<UserGoal[]>([]);

    // ADDED: state for category streaks shown in Profile tab
    const [moodStreak, setMoodStreak] = useState(0);
    const [workoutStreak, setWorkoutStreak] = useState(0);
    const [nutritionStreak, setNutritionStreak] = useState(0);

    // ADDED: state for earned badges shown in Profile tab
    const [userBadges, setUserBadges] = useState<UserBadgeRow[]>([]);


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
    **/
    const fetchAllGoals = useCallback(async () => {
        if (!user?.id) return;
        
        const goals: UserGoal[] = [];
    
        // Nutrition
        try {
            const nutritionData = await getUserNutritionGoals(user.id);
            if (nutritionData) {
                goals.push({
                    type: 'nutrition',
                    data: nutritionData
                });
            }
        } catch (error) {
            // no nutrition goal
        }
    
        // Sleep
        try {
            const sleepData = await getSleepGoal(user.id);
            if (sleepData) {
                goals.push({
                    type: 'sleep',
                    data: sleepData
                });
            }
        } catch (error) {
            // no sleep goal
        }
    
        // Steps
        try {
            const stepsData = await getStepsGoal(user.id);
            if (stepsData) {
                goals.push({
                    type: 'steps',
                    data: stepsData
                });
            }
        } catch (error) {
            // no steps goal
        }
    
        // Activity
        try {
            const activityData = await getUserActivityGoals(user.id);
            if (activityData) {
                goals.push({
                    type: 'physical-activity',
                    data: activityData
                });
            }
        } catch (error) {
            // no activity goal
        }

        // for Mood and Stress Goal
        try {
            const moodData = await getUserMoodGoals(user.id);
            if (moodData) {
                goals.push({
                    type: 'mood',
                    data: moodData
                });
            }
        } catch (error) {
            // No mood goal exists
        }

        setUserGoals(goals);
    }, [user?.id]);

    // ADDED: fetch category streaks for Profile tab
    const fetchCategoryStreaks = useCallback(async () => {
        if (!user?.id) return;

        try {
            const [mood, workout, nutrition] = await Promise.all([
                getCategoryStreak(user.id, "mood"),
                getCategoryStreak(user.id, "workout"),
                getCategoryStreak(user.id, "nutrition"),
            ]);

            setMoodStreak(mood?.current_streak ?? 0);
            setWorkoutStreak(workout?.current_streak ?? 0);
            setNutritionStreak(nutrition?.current_streak ?? 0);
          } catch (error) {
            console.error("Failed to fetch category streaks:", error);
          }
        }, [user?.id]);



    // ADDED: fetch earned badges for Profile tab
    const fetchUserBadges = useCallback(async () => {
        if (!user?.id) return;

        try {
            const badges = await getUserBadges(user.id);
            setUserBadges(badges);
        } catch (error) {
            console.error("Failed to fetch user badges:", error);
        }
    }, [user?.id]);
    


    // Fetch goals + streaks on initial mount
    useEffect(() => {
        fetchAllGoals();
        fetchCategoryStreaks(); // ADDED
        fetchUserBadges(); // ADDED


        // ADDED: temporary workout badge backfill
        if (user?.id) {
            checkAndAwardWorkoutBadges(user.id)
                .then(() => fetchUserBadges())
                .catch((error) => {
                    console.error("Failed to backfill workout badges:", error);
                });
        }


    }, [fetchAllGoals, fetchCategoryStreaks, fetchUserBadges]); // ADDED





    // Re-fetch goals + streaks every time the profile tab comes into focus
    // This ensures new goals show up immediately after being created on the goal screen
    useFocusEffect(
        useCallback(() => {
            fetchAllGoals();
            fetchCategoryStreaks(); // ADDED
            fetchUserBadges(); // ADDED


            // ADDED: temporary workout badge backfill
            if (user?.id) {
                checkAndAwardWorkoutBadges(user.id)
                    .then(() => fetchUserBadges())
                    .catch((error) => {
                        console.error("Failed to backfill workout badges:", error);
                    });
            }


        }, [fetchAllGoals, fetchCategoryStreaks, fetchUserBadges]) // ADDED
    );



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
    **/
    const handleGoalSelect = (goalType: GoalType) => {
        if (
            goalType !== 'nutrition' &&
            goalType !== 'sleep' &&
            goalType !== 'steps' &&
            goalType !== 'physical-activity' &&
            goalType !== 'mood'
        ) {
            Alert.alert(
                'Coming Soon!',
                'This goal type is not currently supported'
            );
            return;
        }
    
        const config = GOAL_CONFIGS[goalType];
        router.push(config.route as any);
    
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
        if (!user?.id || !selectedGoal) return;
    
        try {
            if (selectedGoal.type === 'nutrition') {
                await deleteNutritionGoal(user.id);
            } else if (selectedGoal.type === 'sleep') {
                await deleteSleepGoal(user.id);
            } else if (selectedGoal.type === 'steps') {
                await deleteStepsGoal(user.id);
            } else if (selectedGoal.type === 'physical-activity') {
                await deleteActivityGoal(user.id);
            } else if (selectedGoal.type == 'mood') {
                await deleteMoodGoal(user.id)
            }
    
            setShowEditModal(false);
            setSelectedGoal(null);
            fetchAllGoals();
        } catch (error) {
            console.error("Error deleting goal:", error);
            Alert.alert('Error', 'Failed to delete goal. Please try again.');
        }
    };

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
    **/
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

            <ThemedView style = {[styles.headerBar, { paddingTop : totalTopPadding + 12 }]}>
                <View style={styles.headerRow}>
                    <View style={styles.headerSide} /> 
                    <View style={styles.headerCenter}>
                        <ThemedText style = {[styles.headerTitle, {color: Colors.default.darkBlue}]}> 
                            Your Profile 
                        </ThemedText>
                    </View>
                    <View style={[styles.headerSide, { alignItems: "flex-end" }]}>
                        <Pressable onPress = {() => router.navigate("/screens/settings")} hitSlop={12} >
                            <MaterialIcons name="settings" size={26} color={Colors.default.darkBlue} />
                    </Pressable>
                 </View> 
                 </View>
            </ThemedView>
            <Spacer height={15} />

            {/* ADDED: ScrollView so goals + streaks all fit nicely */}
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
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


                {/* ADDED: New Streaks section */}
                <View style={styles.sectionTitleContainer}>
                    <Text style={styles.sectionTitle}>
                        Streaks
                    </Text>
                </View>

                {/* ADDED: Streak cards */}
                <View style={styles.streaksContainer}>
                    <CategoryStreakCard
                        title="Mood"
                        streakCount={moodStreak}
                        subtitle="Daily mood check-in streak"
                    />

                    <CategoryStreakCard
                        title="Workout"
                        streakCount={workoutStreak}
                        subtitle="Workout weekly streak"
                        unit="week"
                    />

                    <CategoryStreakCard
                        title="Nutrition"
                        streakCount={nutritionStreak}
                        subtitle="Nutrition goal streak"
                    />
                </View>

                <Spacer height={10} />

                {/* ADDED: New Badges section */}
                <View style={styles.sectionTitleContainer}>
                    <Text style={styles.sectionTitle}>
                        Badges
                    </Text>
                </View>

                {/* ADDED: Badge cards */}
                <View style={styles.badgesContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.badgesScrollContent}
                    >
                        {userBadges.length > 0 ? (
                            userBadges.map((badge) => (
                                <BadgeCard
                                    key={badge.id}
                                    icon={badge.badge_definitions?.icon}
                                    title={badge.badge_definitions?.title ?? "Badge"}
                                    subtitle={
                                        badge.earned_at
                                            ? `Earned ${new Date(badge.earned_at).toLocaleDateString()}`
                                            : undefined
                                    }
                                />
                            ))
                        ) : (
                            <BadgeCard
                                icon="🏅"
                                title="No badges yet"
                                subtitle="Complete goals to earn badges"
                            />
                        )}
                    </ScrollView>
                </View>

                <Spacer height={10} />
            
            </ScrollView>
        
            <EditModal
                isVisible={showEditModal}
                onClose={() => setShowEditModal(false)}
                onConfirm={() => handleEditGoal()}
                onDelete={() => handleDeleteGoal()}
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
        //alignItems:'center',
        justifyContent:'flex-start'
    }, 
    headerBar: {
        width: '100%',
        backgroundColor: Colors.default.white,
        paddingHorizontal: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.default.lightGray,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,

    },
    headerTitle: {
        fontSize: 36,
        fontWeight: '700',
        lineHeight: 40,
        textAlign: 'center',
    },
    headerRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
      },
      headerSide: {
        width: 40,
      },
      headerCenter: {
        flex: 1,
        alignItems: 'center',
      },

    // ADDED: lets the whole profile page scroll
    scrollContent: {
        width: "100%",
        alignItems: "center",
        paddingBottom: 20,
    },

    // ADDED: reusable section title wrapper
    sectionTitleContainer: {
        width: "100%",
        paddingHorizontal: "5%",
        marginBottom: 10,  
    },

    // ADDED: section title style for "Streaks"
    sectionTitle: {
        //width: "100%",
        fontSize: 22,
        fontWeight: "700",
        color: Colors.default.darkBlue,
        //marginBottom: 10,
        textAlign: "left"
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

    // ADDED: container for the new streak cards section
    streaksContainer: {
        width: "90%",
        marginBottom: 16,
    },

    // ADDED: container for the badges section
    badgesContainer: {
        width: "90%",
        marginBottom: 16,
    },

    // ADDED: horizontal badge scroll content
    badgesScrollContent: {
        paddingRight: 8,
    },
})
