"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useAuthUser } from "./auth-boundary";

export function LogoutButton() {
  const user = useAuthUser();
  const [pending, setPending] = useState(false);
  async function logout() {
    if (pending) return;
    setPending(true);
    try {
      const result = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!result.ok) throw new Error("Logout failed");
      try {
        const prefix = `llm-platform.draft.v1.${user.id}.`;
        for (let index = window.localStorage.length - 1; index >= 0; index--) {
          const key = window.localStorage.key(index);
          if (key?.startsWith(prefix)) window.localStorage.removeItem(key);
        }
      } catch {
        // Private browsing restrictions must not block server-side logout.
      }
      window.location.replace("/login");
    } catch {
      setPending(false);
      window.alert("Could not sign out. Check that the local authentication API is running.");
    }
  }
  return (
    <button type="button" onClick={logout} disabled={pending}
      className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-500 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-white/5">
      <LogOut className="size-4" aria-hidden="true" />
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}

