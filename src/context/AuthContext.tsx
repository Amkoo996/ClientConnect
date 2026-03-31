import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user role from Firestore or default to CLIENT
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        let userData: User;
        
        if (userDoc.exists()) {
          userData = userDoc.data() as User;
        } else {
          // Create new user document
          const isAdmin = firebaseUser.email === 'reddemption19@gmail.com';
          userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: isAdmin ? 'ADMIN' : 'CLIENT',
            displayName: firebaseUser.displayName || 'User',
            createdAt: new Date(),
            isActive: true,
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), userData);
        }
        setCurrentUser(userData);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
