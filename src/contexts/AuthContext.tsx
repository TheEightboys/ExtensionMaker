import React, { createContext, useState, useEffect, useContext } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { auth } from "../firebase/config";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signup = (email: string, password: string) =>
    createUserWithEmailAndPassword(auth, email, password).then(() => {});

  const login = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password).then(() => {});

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
