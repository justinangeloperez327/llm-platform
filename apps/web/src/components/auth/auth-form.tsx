"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrainCircuit, Eye, EyeOff, LockKeyhole, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readableAuthError, validPassword } from "@/lib/auth";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const registration = mode === "register";
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError("");
    if (registration && !validPassword(password)) {
      setError("Password must contain at least 12 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({
          email: email.trim(),
          password,
          ...(registration ? { display_name: displayName.trim() } : {}),
        }),
      });
      if (!response.ok) {
        const data: unknown = await response.json().catch(() => null);
        setError(readableAuthError(response.status, data));
        return;
      }
      setPassword("");
      window.location.replace("/chat");
    } catch {
      setError("Cannot reach the local authentication API. Verify FastAPI and PostgreSQL are running.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-12 text-slate-900 dark:bg-[#0b0e14] dark:text-white">
      <div className="w-full max-w-[420px]">
        <div className="mb-9 flex items-center justify-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-blue-600 text-white">
            <BrainCircuit className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-lg font-semibold tracking-tight">LLM Platform</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Local development workspace</p>
          </div>
        </div>
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-white/10 dark:bg-[#141923]">
          <div className="mb-7">
            <h1 className="text-2xl font-semibold tracking-tight">
              {registration ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {registration ? "Register to access your private development workspace." : "Sign in to access your local workspace."}
            </p>
          </div>
          <form onSubmit={submit} className="space-y-5">
            {registration && (
              <div>
                <label htmlFor="display-name" className="mb-1.5 block text-sm font-medium">Display name</label>
                <input id="display-name" type="text" autoComplete="name" minLength={1} maxLength={100} required value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-white/15 dark:bg-[#0b0e14]" />
              </div>
            )}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email</label>
              <input id="email" type="email" autoComplete="email" maxLength={320} required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-white/15 dark:bg-[#0b0e14]" />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium">Password</label>
              <div className="relative">
                <input id="password" type={visible ? "text" : "password"} autoComplete={registration ? "new-password" : "current-password"}
                  minLength={registration ? 12 : 1} maxLength={256} required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-12 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-white/15 dark:bg-[#0b0e14]" />
                <button type="button" onClick={() => setVisible((s) => !s)} aria-label={visible ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-1 grid w-10 place-items-center rounded-md text-slate-500 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-500 dark:hover:text-white">
                  {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                </button>
              </div>
              {registration && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Minimum 12 characters; a passphrase is recommended.</p>}
            </div>
            {error && <div role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">{error}</div>}
            <Button className="w-full" disabled={submitting} type="submit">
              {registration ? <UserPlus className="size-4" aria-hidden="true" /> : <LogIn className="size-4" aria-hidden="true" />}
              {submitting ? "Working…" : registration ? "Create account" : "Sign in"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {registration ? "Already have an account?" : "New to LLM Platform?"}{" "}
            <Link className="font-medium text-blue-600 underline-offset-4 hover:underline dark:text-blue-400" href={registration ? "/login" : "/register"}>
              {registration ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </section>
        <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-slate-500 dark:text-slate-400">
          <LockKeyhole className="size-3.5" aria-hidden="true" />
          Local development · authentication service required
        </p>
      </div>
    </main>
  );
}

