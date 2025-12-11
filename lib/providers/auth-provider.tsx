"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  user_type: "customer" | "provider" | "admin";
  location: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateProfile: (
    updates: Partial<Profile>
  ) => Promise<{ data: Profile | null; error: any }>;
  isProvider: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Singleton Supabase client
const supabase = createClient();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log("🔵 AuthProvider render");

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Fetch profile helper
  const fetchProfile = async (userId: string) => {
    try {
      console.log("[AuthProvider] Fetching profile for:", userId);
      const { data, error } = await (supabase as any)
      .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("[AuthProvider] Profile fetch error:", error);
        return null;
      }

      console.log(
        "[AuthProvider] ✅ Profile loaded successfully:",
        (data as any)?.user_type
      );
      console.log("[AuthProvider] Full profile data:", data); // ADD THIS
      return data as any as Profile;
    } catch (error) {
      console.error("[AuthProvider] Profile fetch exception:", error);
      return null;
    }
  };
  useEffect(() => {
    // Initialize auth state ONCE
    const initializeAuth = async () => {
      if (initialized) return; // Prevent re-initialization

      console.log("[AuthProvider] Initializing...");

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          console.log("[AuthProvider] Session found:", session.user.id);
          setUser(session.user);

          const profileData = await fetchProfile(session.user.id);
          if (profileData) {
            setProfile(profileData);
          }
        } else {
          console.log("[AuthProvider] No session found");
        }
      } catch (error) {
        console.error("[AuthProvider] Initialization error:", error);
      } finally {
        setLoading(false);
        setInitialized(true);
        console.log("[AuthProvider] Initialization complete");
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      console.log("[AuthProvider] Auth event:", event);

      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        return;
      }

      if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const profileData = await fetchProfile(currentUser.id);
          if (profileData) {
            setProfile(profileData);
          }
        } else {
          setProfile(null);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Only run once

  // NOTE: Onboarding redirects are handled by middleware.ts
  // No need to handle them here - middleware checks profile.onboarding_completed
  // and redirects appropriately for each user_type

  const signOut = async () => {
    console.log("[AuthProvider] Signing out...");

    supabase.auth.signOut({ scope: "local" });

    // Clear cookies
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }

    localStorage.clear();
    sessionStorage.clear();

    window.location.replace("/");
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { data: null, error: "No user logged in" };
    }

    const { data, error } = await (supabase
      .from("profiles") as any)
      .update(updates as any)
      .eq("id", user.id)
      .select()
      .single() as any as { data: any; error: any };

    if (data) {
      setProfile(data as Profile);
    }

    return { data: data as Profile | null, error };
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signOut,
    updateProfile,
    isProvider: profile?.user_type === "provider",
    isAdmin: profile?.user_type === "admin",
    isCustomer: profile?.user_type === "customer",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
