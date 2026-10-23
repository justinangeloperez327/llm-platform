"use client";

import { FormEvent, useRef, useState, useSyncExternalStore } from "react";
import { ArrowUpRight, Check, FileText, Info, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { draftKey, findSample } from "@/lib/samples";
import { usePreferences } from "./preferences-provider";
import { useAuthUser } from "@/components/auth/auth-boundary";

const STARTERS = [
  "Explain the difference between RAG and fine-tuning",
  "How should I choose between SQL and vector search?",
  "Show the architecture for a local LLM platform",
];

function subscribeToDraft(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener("llm-platform:draft", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("llm-platform:draft", listener);
  };
}

function readDraft(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function ChatWorkspace({ sampleId }: { sampleId?: string }) {
  const sample = findSample(sampleId);
  const user = useAuthUser();
  const key = draftKey(user.id, sample?.id);

  const [editedDraft, setEditedDraft] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const { preferences } = usePreferences();

  const persistedDraft = useSyncExternalStore(subscribeToDraft, () => readDraft(key), () => null);
  const draft = editedDraft ?? persistedDraft ?? "";

  function saveDraft(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!draft.trim()) return;
    try {
      window.localStorage.setItem(key, draft);
      window.dispatchEvent(new Event("llm-platform:draft"));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }

  function chooseStarter(prompt: string) {
    setEditedDraft(prompt);
    setSaved(false);
    textarea.current?.focus();
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-64px)] w-full max-w-4xl flex-col px-4 pb-5 pt-6 sm:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[.15em] text-blue-600 dark:text-blue-400">
            {sample ? "Illustrative conversation" : "New prompt"}
          </p>
          <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight sm:text-3xl">
            {sample ? sample.title : "What would you like to explore?"}
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {sample ? sample.summary : "Prepare a prompt for your private LLM workspace."}
          </p>
        </div>
        <span className="hidden shrink-0 rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-500 sm:block dark:border-white/10 dark:text-slate-400">
          Group 2 / Interface
        </span>
      </div>

      <div className="mb-6 flex gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-relaxed text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/[.08] dark:text-blue-200">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          This is an interface preview. Sample replies are written examples, not generated output.
          Your prompts are saved only in this browser; no request is sent to an LLM until Group 5.
        </p>
      </div>

      <section aria-label={sample ? "Illustrative messages" : "Prompt suggestions"} className="flex-1">
        {sample ? (
          <div className={preferences.density === "compact" ? "space-y-3" : "space-y-6"}>
            {sample.messages.map((message, index) => (
              <article key={index} className={message.role === "user" ? "ml-auto max-w-[90%] rounded-2xl rounded-tr-md border border-slate-200 bg-slate-100 p-4 dark:border-white/10 dark:bg-white/[.08] sm:max-w-[82%]" : "max-w-[95%] sm:max-w-[88%]"}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {message.role === "user" ? "Example question" : "Illustrative answer (not generated)"}
                </p>
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-800 dark:text-slate-100">{message.text}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {STARTERS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => chooseStarter(prompt)}
                aria-label={`Use prompt: ${prompt}`}
                className="group flex min-h-36 flex-col justify-between gap-5 rounded-xl border border-slate-200 bg-white p-5 text-left text-sm leading-relaxed text-slate-700 shadow-sm transition hover:border-blue-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-white/10 dark:bg-white/[.03] dark:text-slate-200 dark:hover:border-blue-500/40"
              >
                <Sparkles className="size-5 text-blue-500" aria-hidden="true" />
                <span>{prompt}</span>
                <ArrowUpRight className="ml-auto size-4 opacity-60 group-hover:opacity-100" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </section>

      <form onSubmit={saveDraft} className="sticky bottom-3 mt-8 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg shadow-black/[.03] dark:border-white/15 dark:bg-[#151a24] dark:shadow-black/20">
        <label htmlFor="prompt-draft" className="sr-only">Prompt draft</label>
        <textarea
          ref={textarea}
          id="prompt-draft"
          name="draft"
          maxLength={12000}
          rows={3}
          value={draft}
          onChange={(event) => { setEditedDraft(event.target.value); setSaved(false); }}
          placeholder="Write a prompt to save for later..."
          aria-describedby="prompt-hint"
          className="block max-h-44 min-h-20 w-full resize-y rounded-lg bg-transparent px-2 py-2 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-white dark:placeholder:text-slate-500"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-white/10">
          <div id="prompt-hint" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <FileText className="size-4 shrink-0" aria-hidden="true" />
            <span>Local draft only · {draft.length}/12000</span>
          </div>
          <Button type="submit" disabled={!draft.trim()} className="gap-2">
            {saved ? <Check className="size-4" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
            Save draft
          </Button>
        </div>
        <p role="status" aria-live="polite" className="mt-2 min-h-4 px-1 text-xs text-emerald-700 dark:text-emerald-400">
          {saved ? "Draft saved in this browser. No AI request was sent." : ""}
        </p>
      </form>
    </div>
  );
}
