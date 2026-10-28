import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, FarmerProfile } from '../types.js';
import { apiRequest, getStoredToken, setStoredToken, clearStoredToken } from '../lib/api.js';

interface GoogleSignInResult {
  isNewUser: boolean;
  user: User;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (fullName: string, email: string, password: string, preferredLanguage?: 'en' | 'hi') => Promise<void>;
  signInWithGoogle: () => Promise<GoogleSignInResult>;
  signInWithGoogleCredential: (idToken: string) => Promise<GoogleSignInResult>;
  logout: () => void;
  updateProfile: (updates: Partial<FarmerProfile>) => Promise<FarmerProfile>;
  deleteAccount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await apiRequest<User>('/auth/me');
      setUser(userData);
      setToken(currentToken);
    } catch (err) {
      console.warn('Failed to hydrate user session, clearing token:', err);
      clearStoredToken();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const signup = async (
    fullName: string,
    email: string,
    password: string,
    preferredLanguage: 'en' | 'hi' = 'en'
  ) => {
    const data = await apiRequest<{ token: string; user: User }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password, preferredLanguage }),
    });
    setStoredToken(data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const signInWithGoogle = async (): Promise<GoogleSignInResult> => {
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
      return new Promise<GoogleSignInResult>(() => {});
    }
    throw new Error('Google Sign-In is initializing. Please click Continue with Google.');
  };

  const signInWithGoogleCredential = async (idToken: string): Promise<GoogleSignInResult> => {
    try {
      const data = await apiRequest<{ token: string; user: User; isNewUser: boolean }>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      });

      setStoredToken(data.token);
      setToken(data.token);
      setUser(data.user);

      return {
        isNewUser: data.isNewUser || !data.user.profile.onboardingCompleted,
        user: data.user,
      };
    } catch (error: any) {
      console.error('[AgriTech] Google Sign-In credential error:', error);
      const msg = error.message || 'Google Sign-In failed. Please try again.';
      throw new Error(msg);
    }
  };

  const logout = () => {
    try {
      if (typeof window !== 'undefined' && window.google?.accounts?.id?.disableAutoSelect) {
        window.google.accounts.id.disableAutoSelect();
      }
    } catch {}
    clearStoredToken();
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (updates: Partial<FarmerProfile>): Promise<FarmerProfile> => {
    const data = await apiRequest<{ message: string; profile: FarmerProfile }>('/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    setUser((prev) => (prev ? { ...prev, profile: data.profile } : null));
    return data.profile;
  };

  const deleteAccount = async () => {
    await apiRequest('/profile/data', { method: 'DELETE' });
    logout();
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const userData = await apiRequest<User>('/auth/me');
      setUser(userData);
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        signInWithGoogle,
        signInWithGoogleCredential,
        logout,
        updateProfile,
        deleteAccount,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
