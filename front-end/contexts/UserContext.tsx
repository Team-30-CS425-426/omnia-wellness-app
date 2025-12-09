//Developed by Johan Ramirez
import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../config/supabaseConfig';
import * as Linking from 'expo-linking';
import { SUPABASE_URL } from '../config/supabaseConfig'

//  Define what data the Context will hold
interface UserContextType {
  user: User | null; 
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  updateUserPassword: (password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  hasOnboarded: boolean | null;
  initialLoadFinished: boolean | null;
  setOnboardedStatus: (status: boolean) => void;
  deleteAccount: () => void;
}

// 2. Create the context with an initial undefined value
const UserContext = createContext<UserContextType | undefined>(undefined);

// 3. Define the props for the Provider (it needs children)
interface UserProviderProps {
  children: ReactNode;
}

const extractParamsFromUrl = (url: string) => {
  const params: { [key: string]: string } = {};
  // Supabase sends tokens after the '#' symbol
  const parts = url.split('#');
  // Safety check in case url is malformed
  if (parts.length < 2) return params;

  const queryString = parts[1]; 
  queryString.split('&').forEach((param) => {
    const [key, value] = param.split('=');
    if (key && value) {
        params[key] = decodeURIComponent(value);
    }
  });
  return params;
};

export function UserProvider({ children }: UserProviderProps) {
  // State now holds the Supabase User object
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);
  const [initialLoadFinished, setInitialLoadFinished] = useState(false);

  const setOnboardedStatus = (status: boolean) => {
    setHasOnboarded(status);
  };

  const fetchProfileData = async (userID: string) => {
    setLoading(true);
    try{
      const {data: profile, error} = await supabase
        .from('User')
        .select('onboarded')
        .eq('id', userID)
        .single()

      if (error && error.code !== 'PGRST116'){
        console.error('Error fetching profile onboarding status:', error);
        setHasOnboarded(false);
      } else if (profile){
        setHasOnboarded(profile.onboarded);
      } else {
        setHasOnboarded(false);
      }
    } catch (e) {
      console.error('Exception:', e);
      setHasOnboarded(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(() => {
      setInitialLoadFinished(true);
    });
  }, []);


  // --- 1. Session & Auth State Listener ---
  useEffect(() => {
    // Get the current session on load
    const fetchSession = async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error && error.message !== 'Auth session missing!') {
        }
        
        const currentUser = session?.user ?? null;
        setUser(currentUser)

        if (currentUser){
          fetchProfileData(currentUser.id)
        } else{
          setHasOnboarded(null);
          setLoading(false);
        }
    }
    
    fetchSession();

    // Subscribe to auth changes (login, logout, auto-refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser);

        if (currentUser){
          fetchProfileData(currentUser.id);
        } else {
          setHasOnboarded(null);
          setLoading(false)
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ---  Deep Link Listener (For Password Reset Flow) ---
  useEffect(() => {
    const handleDeepLink = async (url: string | null) => {
      if (!url) return;

      if (url.includes('access_token') && url.includes('refresh_token')) {
          const params = extractParamsFromUrl(url);
          
          if (params.access_token && params.refresh_token) {

              const { error } = await supabase.auth.setSession({
                  access_token: params.access_token,
                  refresh_token: params.refresh_token,
              });
              if (error) console.error("Deep Link Session Error:", error);
          }
      }
    };

    // Handle App Cold Start (if app was closed when link clicked)
    Linking.getInitialURL().then(handleDeepLink);

    // Handle App Warm Start (if app was in background when link clicked)
    const sub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));

    return () => {
      sub.remove();
    };
  }, []);

  // --- Supabase Authentication Functions ---

  const login = async (email: string, password: string): Promise<void> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error){
      console.log('Supabase login error:', error);
      throw new Error(error.message || 'Login failed. Please try again.'); 
    } 
  };



  const logout = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };



  const register = async (email: string, password: string): Promise<void> => {
    if (!email || !password) {
      throw new Error('Email and password are required for registration.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const redirectUrl = Linking.createURL('/email-verified');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options:{
        emailRedirectTo: redirectUrl,
        data: {}
      }
    });

    if (error) throw error;

    if (data.user){
      const {error: userError} = await supabase
      .from('User')
      .insert({
        id: data.user.id,
        onboarded: false,
        name: null,
        email: data.user.email
      })
    if (userError){
        console.error('User record creation error:', userError);
        throw new Error('Failed to create user profile.');
      }
     
    }
  };

  const updateUserPassword = async (password: string) => {
    // This updates the currently logged-in user (who just clicked the email link)
    const { error } = await supabase.auth.updateUser({ password: password });
    if (error) throw error;
  };



  const resetPassword = async (email: string): Promise<void> => {
      // Generate the correct link for your specific device/environment
      const redirectUrl = Linking.createURL('/reset-password');

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl, // Use the generated URL
      });
      if (error) throw error;
  };



  const deleteAccount = async () => {
    if (!user) throw new Error('No user logged in');
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No active session');
        const response = await fetch(
            `${SUPABASE_URL}/functions/v1/delete-account`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to delete account');
        }

        await logout();
    } catch (error) {
        console.error('Error deleting account:', error);
        throw error;
    }
  }

  return (
    <UserContext.Provider value={{ user, loading, login, logout, register, updateUserPassword, resetPassword, hasOnboarded, initialLoadFinished, setOnboardedStatus, deleteAccount }}>
      {initialLoadFinished ? children: null} 
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
