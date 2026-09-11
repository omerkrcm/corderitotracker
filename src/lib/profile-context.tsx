"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { User } from "@/lib/types";

const STORAGE_KEY = "active-profile-user-id";

type ProfileContextValue = {
  users: User[];
  activeUser: User | null;
  loading: boolean;
  setActiveUserId: (id: string) => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [activeUserId, setActiveUserIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/users")
      .then((res) => res.json())
      .then((data: User[]) => {
        if (cancelled) return;
        setUsers(data);
        const stored = window.localStorage.getItem(STORAGE_KEY);
        const initial =
          stored && data.some((u) => u.id === stored) ? stored : data[0]?.id ?? null;
        setActiveUserIdState(initial);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setActiveUserId = useCallback((id: string) => {
    setActiveUserIdState(id);
    window.localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const activeUser = users.find((u) => u.id === activeUserId) ?? null;

  return (
    <ProfileContext.Provider
      value={{ users, activeUser, loading, setActiveUserId }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within a ProfileProvider");
  return ctx;
}
