"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen, BrainCircuit, ChevronRight, Database, Menu, MessageSquareText,
  Moon, Plus, Settings2, Sun, X,
} from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { SAMPLE_CONVERSATIONS } from "@/lib/samples";
import { cn } from "@/lib/utils";
import { PreferencesProvider, usePreferences } from "./preferences-provider";
import { LogoutButton } from "@/components/auth/logout-button";

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const navItem = "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500";
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-5 dark:border-white/10">
        <span className="grid size-9 place-items-center rounded-lg bg-blue-600 text-white">
          <BrainCircuit className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold tracking-tight">LLM Platform</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Local development</div>
        </div>
      </div>

      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-5">
        <Link
          href="/chat"
          onClick={onNavigate}
          className="mb-6 flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          <Plus className="size-4" aria-hidden="true" /> New draft
        </Link>
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[.12em] text-slate-500 dark:text-slate-400">Workspace</p>
        <Link
          className={cn(navItem, pathname === "/chat" ? "bg-slate-200/80 text-slate-950 dark:bg-white/10 dark:text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5")}
          href="/chat"
          onClick={onNavigate}
          aria-current={pathname === "/chat" ? "page" : undefined}
        >
          <MessageSquareText className="size-4" aria-hidden="true" /> Chat workspace
        </Link>
        <div aria-disabled="true" className={cn(navItem, "cursor-not-allowed text-slate-400 dark:text-slate-500")}>
          <Database className="size-4" aria-hidden="true" /> Knowledge base <span className="ml-auto text-[10px]">Group 6</span>
        </div>
        <div aria-disabled="true" className={cn(navItem, "cursor-not-allowed text-slate-400 dark:text-slate-500")}>
          <BrainCircuit className="size-4" aria-hidden="true" /> Models <span className="ml-auto text-[10px]">Group 11</span>
        </div>

        <p className="mb-2 mt-8 px-3 text-[11px] font-semibold uppercase tracking-[.12em] text-slate-500 dark:text-slate-400">Sample conversations</p>
        <p className="mb-3 px-3 text-xs text-slate-500 dark:text-slate-500">Illustrative only · not AI generated</p>
        {SAMPLE_CONVERSATIONS.map((sample) => (
          <Link
            key={sample.id}
            href={`/chat?sample=${sample.id}`}
            onClick={onNavigate}
            className="group mb-1 flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-slate-600 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100"
          >
            <BookOpen className="size-4 shrink-0" aria-hidden="true" />
            <span className="flex-1 truncate">{sample.title}</span>
            <ChevronRight className="size-3 opacity-0 group-hover:opacity-100" aria-hidden="true" />
          </Link>
        ))}
      </nav>
      <div className="border-t border-slate-200 px-3 py-4 dark:border-white/10">
        <Link
          href="/settings"
          onClick={onNavigate}
          aria-current={pathname === "/settings" ? "page" : undefined}
          className={cn(navItem, pathname === "/settings" ? "bg-slate-200/80 text-slate-950 dark:bg-white/10 dark:text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5")}
        >
          <Settings2 className="size-4" aria-hidden="true" /> Settings
        </Link>
        <LogoutButton />
        <p className="mt-4 px-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-500">
          Preview-only UI. Backend model chat will arrive in Group 5.
        </p>
      </div>
    </div>
  );
}

function ShellContent({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { preferences, setPreference, hydrated } = usePreferences();
  const pathname = usePathname();
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  function closeMenu() {
    setOpen(false);
    menuButton.current?.focus();
  }

  function handleDialogKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
    }
    if (event.key !== "Tab" || !dialog.current) return;
    const focusables = dialog.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className={cn("flex min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0b0e14] dark:text-slate-100", preferences.density === "compact" && "text-[14px]")}>
      <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 border-r border-slate-200 bg-white md:block dark:border-white/10 dark:bg-[#11151e]">
        <Navigation />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-slate-950/70" aria-hidden="true" onClick={closeMenu} />
          <div
            id="mobile-navigation"
            ref={dialog}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            onKeyDown={handleDialogKeys}
            className="relative h-full w-[min(85vw,290px)] border-r border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#11151e]"
          >
            <button ref={closeButton} onClick={closeMenu} aria-label="Close navigation" className="absolute right-3 top-5 z-10 rounded-md p-2 text-slate-600 focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-slate-300">
              <X className="size-5" aria-hidden="true" />
            </button>
            <Navigation onNavigate={closeMenu} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-8 dark:border-white/10 dark:bg-[#0b0e14]/95">
          <div className="flex min-w-0 items-center gap-3">
            <button ref={menuButton} onClick={() => setOpen(true)} aria-label="Open navigation" aria-expanded={open} aria-controls="mobile-navigation" className="rounded-md p-2 focus-visible:outline-2 focus-visible:outline-blue-500 md:hidden">
              <Menu className="size-5" aria-hidden="true" />
            </button>
            <span className="truncate text-sm font-medium text-slate-600 dark:text-slate-300">
              {pathname === "/settings" ? "Preferences" : "Chat workspace"}
            </span>
            <span className="hidden rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-500 sm:inline-flex dark:border-white/10 dark:text-slate-400">UI preview</span>
          </div>
          <button
            aria-label={hydrated && preferences.theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title="Toggle color theme"
            onClick={() => setPreference("theme", preferences.theme === "dark" ? "light" : "dark")}
            className="grid size-9 place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
          >
            {preferences.theme === "dark" ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
          </button>
        </header>
        <main id="main-content" className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  return <PreferencesProvider><ShellContent>{children}</ShellContent></PreferencesProvider>;
}

