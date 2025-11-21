import { initializeApp } from "firebase/app";
// 1. Import specific React Native auth functions
// @ts-ignore
import { initializeAuth , getReactNativePersistence } from "firebase/auth/";

import AsyncStorage from "@react-native-async-storage/async-storage";

// Your keys remain the same
const firebaseConfig = {
  apiKey: "AIzaSyCbwkL1aP--uzYBgSpQIRSUVrX-l4FeG58",
  authDomain: "omnia-78c7c.firebaseapp.com",
  projectId: "omnia-78c7c",
  storageBucket: "omnia-78c7c.firebasestorage.app",
  messagingSenderId: "360885782976",
  appId: "1:360885782976:web:ce5cd24da3717312a8a025"
};

const app = initializeApp(firebaseConfig);

// 2. Initialize Auth with Persistence (This is the specific fix for iOS/Android)
// This tells Firebase: "Use AsyncStorage to remember the user"
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});