'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, getCurrentUser } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => void;
  isAdmin: boolean;
  isLecturer: boolean;
  isExamOfficer: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    getCurrentUser()
      .then((currentUser) => {
        if (mountedRef.current) setUser(currentUser);
      })
      .catch(() => {
        if (mountedRef.current) setUser(null);
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });
    return () => { mountedRef.current = false; };
  }, []);

  const refreshUser = () => {
    getCurrentUser()
      .then((currentUser) => {
        if (mountedRef.current) setUser(currentUser);
      })
      .catch(() => {
        if (mountedRef.current) setUser(null);
      });
  };

  const isAdmin = user?.roles?.includes('Admin') ?? false;
  const isLecturer = user?.roles?.includes('Lecturer') ?? false;
  const isExamOfficer = user?.roles?.includes('ExamOfficer') ?? false;
  const isStudent = user?.roles?.includes('Student') ?? false;

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, isAdmin, isLecturer, isExamOfficer, isStudent }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
