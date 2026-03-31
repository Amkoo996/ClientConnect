import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { User, AuthContextType } from '../types';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('cachedUser');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return {
          ...parsed,
          createdAt: new Date(parsed.createdAt)
        };
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'createdAt'> & { createdAt: Timestamp };
            const user: User = {
              ...userData,
              createdAt: userData.createdAt.toDate(),
            };
            setCurrentUser(user);
            localStorage.setItem('cachedUser', JSON.stringify(user));
          } else {
            setCurrentUser(null);
            localStorage.removeItem('cachedUser');
          }
        } else {
          setCurrentUser(null);
          localStorage.removeItem('cachedUser');
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(err instanceof Error ? err.message : "Failed to load user data");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg);
      throw new Error(msg);
    }
  };

  const registerWithEmail = async (email: string, password: string, displayName: string, companyName?: string) => {
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser: User = {
        uid: userCredential.user.uid,
        email,
        role: "CLIENT", // Defaulting to CLIENT, admin can be set manually in DB
        displayName,
        companyName,
        createdAt: new Date(),
        isActive: true,
      };
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        ...newUser,
        createdAt: Timestamp.fromDate(newUser.createdAt)
      });
      
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
      setCurrentUser(null);
      localStorage.removeItem('cachedUser');
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Logout failed";
      setError(msg);
      throw new Error(msg);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, error, login, registerWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
