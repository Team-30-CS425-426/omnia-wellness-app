import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants'; // ⬅️ IMPORTANT
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. debug log to see what is actually happening
console.log("Supabase URL from Constants:", Constants.expoConfig?.extra?.supabaseUrl);

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseKey = Constants.expoConfig?.extra?.supabaseKey;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

if (!supabaseUrl || !supabaseKey) {
  // If this throws, check your console logs above to see if it printed "undefined"
  throw new Error('Supabase URL or Key not found in environment variables.');
}

export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseKey;
export const SUPABASE_ANON_KEY_ALT = supabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage, // ⬅️ Save session to phone storage
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // ⬅️ We will handle this manually in Context
  }
});