"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { type AuthUser } from "@/lib/auth";

const AuthContext = createContext<AuthUser | null>(null);

export function useAuthUser(): AuthUser {
  const user = useContext(AuthContext);
  if (!user) throw new Error("Verified auth context is required");
  return user;
}

export function AuthBoundary({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function checkSession() {
      try {
        const result = await fetch("/api/auth/me", {
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });
        if (!result.ok) {
          router.replace("/login");
          return;
        }
        const data = (await result.json()) as AuthUser;
        if (!data || typeof data.id !== "string" || typeof data.email !== "string") {
          router.replace("/login");
          return;
        }
        setUser(data);
      } catch {
        if (!controller.signal.aborted) router.replace("/login");
      } finally {
        if (!controller.signal.aborted) setChecked(true);
      }
    }
    void checkSession();
    return () => controller.abort();
  }, [router]);

  if (!checked || !user) {
    return (
      <div role="status" aria-live="polite" className="grid min-h-dvh place-items-center bg-slate-50 text-sm text-slate-600 dark:bg-[#0b0e14] dark:text-slate-400">
        Verifying your session…
      </div>
    );
  }
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

