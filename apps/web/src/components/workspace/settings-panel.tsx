"use client";

import { Database, HardDrive, Info, RotateCcw, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePreferences } from "./preferences-provider";

function SelectTile({ selected, title, detail, onClick }: {
  selected: boolean;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${selected ? "border-blue-500 bg-blue-50 dark:border-blue-400/70 dark:bg-blue-500/10" : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-white/[.03] dark:hover:border-white/20"}`}
    >
      <span className="block text-sm font-semibold text-slate-900 dark:text-white">{title}</span>
      <span className="mt-1 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">{detail}</span>
    </button>
  );
}

export function SettingsPanel() {
  const { preferences, setPreference, reset } = usePreferences();
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-[.15em] text-blue-600 dark:text-blue-400">Personalization</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Workspace settings</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        Appearance preferences are stored in this browser. Model parameters are displayed for planning only until streaming inference arrives in Group 5.
      </p>

      <section aria-labelledby="appearance-title" className="mt-9 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[.025] sm:p-6">
        <div className="flex items-start gap-3">
          <SlidersHorizontal className="mt-1 size-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <div>
            <h2 id="appearance-title" className="text-lg font-semibold">Appearance</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Control the visual theme and interface spacing.</p>
          </div>
        </div>
        <h3 className="mb-3 mt-7 text-sm font-semibold">Color theme</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectTile selected={preferences.theme === "dark"} title="Dark" detail="Dark surfaces and restrained blue highlights" onClick={() => setPreference("theme", "dark")} />
          <SelectTile selected={preferences.theme === "light"} title="Light" detail="Bright, high-contrast workspace" onClick={() => setPreference("theme", "light")} />
        </div>
        <h3 className="mb-3 mt-6 text-sm font-semibold">Display density</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectTile selected={preferences.density === "comfortable"} title="Comfortable" detail="More spacing between sample messages" onClick={() => setPreference("density", "comfortable")} />
          <SelectTile selected={preferences.density === "compact"} title="Compact" detail="Tighter message spacing" onClick={() => setPreference("density", "compact")} />
        </div>
      </section>

      <section aria-labelledby="response-title" className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[.025] sm:p-6">
        <div className="flex items-start gap-3">
          <Info className="mt-1 size-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <div>
            <h2 id="response-title" className="text-lg font-semibold">Future response preference</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Saved locally now; not yet applied to model responses.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <SelectTile selected={preferences.responseStyle === "balanced"} title="Balanced" detail="Explanations with relevant context" onClick={() => setPreference("responseStyle", "balanced")} />
          <SelectTile selected={preferences.responseStyle === "concise"} title="Concise" detail="Short, direct model replies" onClick={() => setPreference("responseStyle", "concise")} />
        </div>
      </section>

      <section aria-labelledby="runtime-title" className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[.025] sm:p-6">
        <div className="flex items-start gap-3">
          <HardDrive className="mt-1 size-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <div>
            <h2 id="runtime-title" className="text-lg font-semibold">Planned local inference</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Read-only configuration — no model connection is made from this page.</p>
          </div>
        </div>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-4 dark:border-white/10"><dt className="text-xs text-slate-500 dark:text-slate-400">Provider</dt><dd className="mt-1 font-medium">Ollama on Windows</dd></div>
          <div className="rounded-lg border border-slate-200 p-4 dark:border-white/10"><dt className="text-xs text-slate-500 dark:text-slate-400">First model</dt><dd className="mt-1 font-medium">Qwen3.5 2B Q4</dd></div>
          <div className="rounded-lg border border-slate-200 p-4 dark:border-white/10"><dt className="text-xs text-slate-500 dark:text-slate-400">Initial context</dt><dd className="mt-1 font-medium">2,048 tokens</dd></div>
          <div className="rounded-lg border border-slate-200 p-4 dark:border-white/10"><dt className="text-xs text-slate-500 dark:text-slate-400">Concurrency</dt><dd className="mt-1 font-medium">1 model request</dd></div>
        </dl>
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 p-4 dark:border-white/10">
        <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <ShieldCheck className="size-4" aria-hidden="true" /> Settings stay in this browser, not in an account.
        </p>
        <Button variant="outline" onClick={reset}><RotateCcw className="size-4" aria-hidden="true" /> Reset preferences</Button>
      </div>
      <p className="mt-5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Database className="size-4" aria-hidden="true" /> Knowledge sources and hosted models are introduced in later groups.
      </p>
    </div>
  );
}
