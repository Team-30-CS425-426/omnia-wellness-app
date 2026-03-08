import { useState, useEffect } from "react";
import { supabase } from "@/config/supabaseConfig";
import { useUser } from "@/contexts/UserContext";

interface NutritionStats {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

export function useNutritionStats() {
    const { user } = useUser();
    const [nutrition, setNutrition] = useState<NutritionStats>({
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchNutritionData() {
        if (!user) {
            console.log('No user in context');
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        setError(null);

        try {
            const today = new Date();
            const targetDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            
            const response = await supabase
                .from('NutritionLog')
                .select('calories, protein, carbs, fat')
                .eq('userID', user.id)
                .eq('date', targetDate);

            if (response.error) {
                console.log('Supabase query error:', response.error);
                setError(response.error.message);
                setIsLoading(false);
                return;
            }

            if (response?.data && response.data.length > 0) {
                const total = response.data.reduce((acc, log) => ({
                    calories: acc.calories + (Number(log.calories) || 0),
                    protein: acc.protein + (Number(log.protein) || 0),
                    carbs: acc.carbs + (Number(log.carbs) || 0),
                    fat: acc.fat + (Number(log.fat) || 0),
                }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
                
                setNutrition(total);
            } else {
                setNutrition({ calories: 0, protein: 0, carbs: 0, fat: 0 });
            }
        } catch (err) {
            console.error('Error fetching nutrition:', err);
            setError('Failed to fetch nutrition data');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (!user) {
            console.log('No user found');
            return;
        }

        fetchNutritionData();

        // Set up real-time subscription
        console.log('Setting up subscription for user:', user.id);
        const channel = supabase
            .channel('nutrition-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'NutritionLog',
                    filter: `userID=eq.${user.id}`
                },
                (payload) => {
                    console.log('🔥 Nutrition update received:', payload);
                    fetchNutritionData();
                }
            )
            .subscribe((status) => {
                console.log('Subscription status:', status);
            });

        return () => {
            console.log('Cleaning up subscription');
            supabase.removeChannel(channel);
        };
    }, [user]);

    return {
        nutrition,
        isLoading,
        error,
        refetch: fetchNutritionData
    };
}