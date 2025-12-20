"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter, usePathname } from "next/navigation";

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
  const pathname = usePathname();

  /* ---------------- FETCH CURRENT USER ---------------- */
  const fetchUser = useCallback(async () => {
    // Skip auth check on public pages
    if (pathname === "/login" || pathname === "/register" || pathname === "/") {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      console.log("Auth check response:", res.status);

      if (res.status === 401) {
        console.log("Not authenticated, redirecting to login");
        setUser(null);
        setLoading(false);
        if (pathname !== "/login" && pathname !== "/register" && pathname !== "/") {
          router.push("/login");
        }
        return;
      }

      if (!res.ok) {
        console.error("Auth check failed:", res.status);
        throw new Error("Failed to fetch user");
      }

      const data = await res.json();
      console.log("User data received:", data.user);
      setUser(data.user);
    } catch (err) {
      console.error("Auth error:", err);
      setUser(null);
      if (pathname !== "/login" && pathname !== "/register" && pathname !== "/") {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [pathname, router]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  /* ---------------- LOGIN ---------------- */
  const login = useCallback(
    async (email: string, password: string) => {
      try {
        console.log("Attempting login...");
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          credentials: "include",
        });

        const data = await res.json();
        console.log("Login response:", res.status, data);

        if (!res.ok) {
          throw new Error(data.error || "Login failed");
        }

        setUser(data.user);
        console.log("Login successful, redirecting to dashboard");
        router.push("/dashboard");
        router.refresh();
      } catch (error: any) {
        console.error("Login error:", error);
        throw error;
      }
    },
    [router],
  );

  /* ---------------- REGISTER ---------------- */
  const register = useCallback(
    async (email: string, password: string, fullName: string) => {
      try {
        console.log("Attempting registration...");
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, fullName }),
          credentials: "include",
        });

        const data = await res.json();
        console.log("Register response:", res.status, data);

        if (!res.ok) {
          throw new Error(data.error || "Registration failed");
        }

        setUser(data.user);
        console.log("Registration successful, redirecting to dashboard");
        router.push("/dashboard");
        router.refresh();
      } catch (error: any) {
        console.error("Registration error:", error);
        throw error;
      }
    },
    [router],
  );

  /* ---------------- LOGOUT ---------------- */
  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      router.push("/login");
      router.refresh();
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

  // Don't render children until auth check is complete (except on public pages)
  if (loading && pathname !== "/login" && pathname !== "/register" && pathname !== "/") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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