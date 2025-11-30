import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { User } from '@supabase/supabase-js'; // Supabase's User type
import { supabase } from '../config/supabaseConfig'; // ⬅️ Import your initialized Supabase client
import * as Linking from 'expo-linking';

// 1. Define what data the Context will hold
interface UserContextType {
  // Supabase's User type is slightly different but serves the same purpose
  user: User | null; 
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  updateUserPassword: (password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

// 2. Create the context with an initial undefined value
const UserContext = createContext<UserContextType | undefined>(undefined);

// 3. Define the props for the Provider (it needs children)
interface UserProviderProps {
  children: ReactNode;
}

// Helper to parse the #access_token=... from the URL
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

  // --- 1. Session & Auth State Listener ---
  useEffect(() => {
    // A. Get the current session on load
    const fetchSession = async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error && error.message !== 'Auth session missing!') {
             console.log("Session fetch error:", error); 
        }
        
        // The user object is within the session
        setUser(session?.user ?? null);
        setLoading(false);
    }
    
    fetchSession();

    // B. Subscribe to auth changes (login, logout, auto-refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null); 
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // --- 2. Deep Link Listener (For Password Reset Flow) ---
  useEffect(() => {
    const handleDeepLink = async (url: string | null) => {
      if (!url) return;

      // Check if the URL contains a Supabase token (reset password flow)
      // Supabase puts tokens in the hash fragment (#)
      if (url.includes('access_token') && url.includes('refresh_token')) {
          console.log("Deep link with tokens detected!");
          const params = extractParamsFromUrl(url);
          
          if (params.access_token && params.refresh_token) {
              // Manually set the session using the tokens from the URL
              const { error } = await supabase.auth.setSession({
                  access_token: params.access_token,
                  refresh_token: params.refresh_token,
              });
              if (error) console.error("Deep Link Session Error:", error);
              
              // Note: If successful, onAuthStateChange above will update the user state automatically
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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error; 
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

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options:{
        emailRedirectTo: redirectUrl,
      }
    });
    if (error) throw error;
  };

  const updateUserPassword = async (password: string) => {
    // This updates the currently logged-in user (who just clicked the email link)
    const { error } = await supabase.auth.updateUser({ password: password });
    if (error) throw error;
  };

  const resetPassword = async (email: string): Promise<void> => {
      // 1. Generate the correct link for your specific device/environment
      const redirectUrl = Linking.createURL('/reset-password');
      console.log('Redirect URL sent to Supabase:', redirectUrl); 

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl, // ⬅️ Use the generated URL
      });
      if (error) throw error;
  };

  return (
    <UserContext.Provider value={{ user, loading, login, logout, register, updateUserPassword, resetPassword }}>
      {!loading && children} 
    </UserContext.Provider>
  );
}

// 4. Create a custom hook to use this context easily
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};