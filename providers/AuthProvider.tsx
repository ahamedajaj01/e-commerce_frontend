"use client";

import { createContext, useEffect, useMemo, useState, useRef } from "react";
import { login as loginApi, fetchProfile } from "@/lib/api/auth";
import type { AuthCredentials, AuthContextValue, UserProfile } from "@/types/auth";

const AUTH_TOKEN_KEY = "fashion_ecom_auth_token";
const AUTH_USER_KEY = "fashion_ecom_auth_user";

const initialAuthState: AuthContextValue = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {
    throw new Error("AuthProvider not initialized");
  },
  logout: () => { },
};

export const AuthContext = createContext<AuthContextValue>(initialAuthState);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initial load from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const savedUser = localStorage.getItem(AUTH_USER_KEY);

    if (savedToken) {
      setToken(savedToken);
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
        } catch (e) {
          localStorage.removeItem(AUTH_USER_KEY);
        }
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    const init = async () => {
      try {
        const profile = await fetchProfile(token);
        updateSession(token, profile);
      } catch (err: any) {
        if (err.status === 401) {
          logout();
        }
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [token]);

  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener("auth-unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth-unauthorized", handleUnauthorized);
  }, []);

  const updateSession = (sessionToken: string, profile: UserProfile) => {
    // Normalize roles (handle both plural and singular from backend)
    const normalizedProfile = {
      ...profile,
      roles: profile.roles || (profile.role ? [profile.role] : []),
    };

    setToken(sessionToken);
    setUser(normalizedProfile);
    localStorage.setItem(AUTH_TOKEN_KEY, sessionToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(normalizedProfile));

    return normalizedProfile;
  };

  const login = async (credentials: AuthCredentials) => {
    const response = await loginApi(credentials.email, credentials.password);
    const sessionToken = response.access || response.token || "";

    const rawProfile = response.user;

    if (!rawProfile) {
      const fetchedProfile = await fetchProfile(sessionToken);
      return updateSession(sessionToken, fetchedProfile);
    }

    return updateSession(sessionToken, rawProfile);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsLoading(false);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
    }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
