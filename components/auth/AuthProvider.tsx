"use client";

import { onAuthStateChanged, User } from "firebase/auth";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase/client";
import { getCurrentUserProfile, upsertUserProfileFromAuth } from "@/lib/firebase/data";
import { UserProfile } from "@/lib/types";

interface AuthContextShape {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextShape>({
  user: null,
  profile: null,
  loading: true
});

const DEFAULT_ADMIN_EMAILS = ["webappewm@gmail.com"];

function resolveAdmin(email: string | null): boolean {
  if (!email) {
    return false;
  }

  const configuredAdmins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  const normalized = email.toLowerCase();
  const adminSet = new Set([...DEFAULT_ADMIN_EMAILS, ...configuredAdmins]);
  return adminSet.has(normalized);
}

export function AuthProvider({ children }: { children: ReactNode }): ReactNode {
  const [user, setUser] = useState<User | null>(null);
  const [profileDoc, setProfileDoc] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    let active = true;

    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);

      if (!nextUser) {
        setProfileDoc(null);
        return;
      }

      const isAdmin = resolveAdmin(nextUser.email);

      void (async () => {
        try {
          if (nextUser.email) {
            await upsertUserProfileFromAuth({
              uid: nextUser.uid,
              email: nextUser.email,
              isAdmin,
              displayName: nextUser.displayName ?? ""
            });
          }

          const saved = await getCurrentUserProfile(nextUser.uid);
          if (active) {
            setProfileDoc(saved);
          }
        } catch {
          if (active) {
            setProfileDoc(null);
          }
        }
      })();
    });

    return () => {
      active = false;
      unsub();
    };
  }, []);

  const profile = useMemo<UserProfile | null>(() => {
    if (!user) {
      return null;
    }

    const isAdmin = resolveAdmin(user.email) || profileDoc?.isAdmin === true;

    return {
      uid: user.uid,
      email: user.email,
      isAdmin,
      role: isAdmin ? "admin" : profileDoc?.role ?? "user",
      displayName: profileDoc?.displayName || user.displayName || "",
      dateOfBirth: profileDoc?.dateOfBirth || "",
      city: profileDoc?.city || "",
      createdAt: profileDoc?.createdAt,
      updatedAt: profileDoc?.updatedAt,
      lastLoginAt: profileDoc?.lastLoginAt
    };
  }, [user, profileDoc]);

  return <AuthContext.Provider value={{ user, profile, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextShape {
  return useContext(AuthContext);
}
