"use client";

import { onAuthStateChanged, User } from "firebase/auth";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase/client";
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

function resolveAdmin(email: string | null): boolean {
  if (!email) {
    return false;
  }

  const adminList = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return adminList.includes(email.toLowerCase());
}

export function AuthProvider({ children }: { children: ReactNode }): ReactNode {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const profile = useMemo<UserProfile | null>(() => {
    if (!user) {
      return null;
    }

    return {
      uid: user.uid,
      email: user.email,
      isAdmin: resolveAdmin(user.email)
    };
  }, [user]);

  return <AuthContext.Provider value={{ user, profile, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextShape {
  return useContext(AuthContext);
}
