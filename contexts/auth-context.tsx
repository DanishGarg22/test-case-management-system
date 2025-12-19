"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  email: string;
  full_name: string;
  role: "admin" | "test-lead" | "tester" | "read-only";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /* ---------------- FETCH CURRENT USER ---------------- */
  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
      });

      // 401 = not logged in
      if (res.status === 401) {
        setUser(null);
        return;
      }

      if (!res.ok) {
        console.error("ME error status", res.status);
        throw new Error("Failed to fetch user");
      }

      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      console.error("ME error", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  /* ---------------- LOGIN ---------------- */
  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const text = await res.text();
      console.log("LOGIN status", res.status, "body:", text);

      if (!res.ok) {
        let message = "Login failed";
        try {
          message = JSON.parse(text).error || message;
        } catch {
          // ignore JSON parse error, keep default
        }
        throw new Error(message);
      }

      const data = JSON.parse(text);
      setUser(data.user);
      router.push("/dashboard");
    },
    [router],
  );

  /* ---------------- REGISTER ---------------- */
  const register = useCallback(
    async (email: string, password: string, fullName: string) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName }),
        credentials: "include",
      });

      const text = await res.text();
      console.log("REGISTER status", res.status, "body:", text);

      if (!res.ok) {
        let message = "Registration failed";
        try {
          message = JSON.parse(text).error || message;
        } catch {
          // ignore JSON parse error, keep default
        }
        throw new Error(message);
      }

      const data = JSON.parse(text);
      setUser(data.user);
      router.push("/dashboard");
    },
    [router],
  );

  /* ---------------- LOGOUT ---------------- */
  const logout = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        console.error("Logout failed", res.status);
      }
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  /* ---------------- ROLE CHECK ---------------- */
  const hasRole = useCallback(
    (roles: string[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, hasRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
