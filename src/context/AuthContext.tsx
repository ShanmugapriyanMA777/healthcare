'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, Profile } from '@/lib/supabaseClient';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: Partial<Profile> & { blood_group?: string; allergies?: string; medical_history?: string; specialization?: string; qualification?: string; experience?: number; consultation_fee?: number }) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch the public profile associated with the user ID
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error.message);
        return null;
      }
      return data;
    } catch (e) {
      console.error('Exception fetching profile:', e);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      const prof = await fetchProfile(user.id);
      setProfile(prof);
    }
  };

  // Sync session on mount and on auth state change
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
          setUser(session.user);
          const prof = await fetchProfile(session.user.id);
          if (mounted) setProfile(prof);
        }
      } catch (e) {
        console.error('Auth initialization error:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        if (!mounted) return;
        setLoading(true);
        if (session) {
          setUser(session.user);
          const prof = await fetchProfile(session.user.id);
          setProfile(prof);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (e: any) {
      return { error: e };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userData: Partial<Profile> & { 
      blood_group?: string; 
      allergies?: string; 
      medical_history?: string;
      specialization?: string;
      qualification?: string;
      experience?: number;
      consultation_fee?: number;
    }
  ) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            role: userData.role,
            phone: userData.phone,
            profile_image: userData.profile_image,
            blood_group: userData.blood_group,
            allergies: userData.allergies,
            medical_history: userData.medical_history,
            specialization: userData.specialization,
            qualification: userData.qualification,
            experience: userData.experience,
            consultation_fee: userData.consultation_fee
          },
        },
      });
      return { error };
    } catch (e: any) {
      return { error: e };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      return { error };
    } catch (e: any) {
      return { error: e };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
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
