import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebaseConfig'; // Import your auth object

// 1. Define what data the Context will hold
interface UserContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
}

// 2. Create the context with an initial undefined value
const UserContext = createContext<UserContextType | undefined>(undefined);

// 3. Define the props for the Provider (it needs children)
interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for an existing user session when the app starts
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // You can implement the actual Firebase logic here later, 
  // or keep them as placeholders for now.
  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // No need to setUser manually; onAuthStateChanged handles it
    } catch (error) {
      // We throw the error so the Login Screen can catch it and show an Alert
      throw error; 
    }
  };

  const logout = async () => {
      await auth.signOut();
      setUser(null)
      
  }

  const register = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  };

  return (
    <UserContext.Provider value={{ user, loading, login, logout, register }}>
      {!loading && children} 
    </UserContext.Provider>
  );
}


// 4. Create a custom hook to use this context easily
// This prevents you from having to check for "undefined" in every component
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};