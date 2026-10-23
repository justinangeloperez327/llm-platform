import { ArrowUpRight, BrainCircuit, Database, HardDrive, Layers3, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { statusLabel, type ServiceStatus } from "@/lib/status";

const modules: { name: string; detail: string; status: ServiceStatus; icon: typeof BrainCircuit }[] = [
  { name: "Application frontend", detail: "Next.js 16 • TypeScript • Node 24", status: "ready", icon: Layers3 },
  { name: "API foundation", detail: "FastAPI • provider contracts", status: "offline", icon: BrainCircuit },
  { name: "Vector storage", detail: "PostgreSQL 17 • pgvector", status: "offline", icon: Database },
  { name: "Local inference", detail: "Ollama • Qwen3.5 2B Q4", status: "offline", icon: HardDrive },
];

export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10 md:px-10">
      <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3 font-semibold tracking-tight">
          <span className="grid size-10 place-items-center rounded-lg border border-blue-500/40 bg-blue-500/10 text-blue-300">
            <BrainCircuit className="size-5" aria-hidden="true" />
          </span>
          LLM Platform
        </div>
        <span className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-white/65">Development / Group 1</span>
      </nav>

      <section className="max-w-3xl py-20 md:py-28">
        <div className="mb-6 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-blue-300">
          <span className="size-1.5 rounded-full bg-blue-400" /> Windows-first architecture
        </div>
        <h1 className="text-4xl font-semibold leading-tight tracking-[-0.045em] md:text-6xl">
          Your own infrastructure.<br /><span className="text-white/45">Your own model choices.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/60 md:text-lg">
          A modular language-model platform designed for local inference, source-aware retrieval and independently
          deployable AI systems. Group 1 establishes the development foundation.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild><a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer">
            API reference <ArrowUpRight className="size-4" aria-hidden="true" />
          </a></Button>
          <Button variant="outline" asChild><a href="https://github.com/justinangeloperez327/llm-platform" target="_blank" rel="noreferrer">Source code <ArrowUpRight className="size-4" aria-hidden="true" /></a></Button>
        </div>
      </section>

      <section aria-labelledby="foundation-title" className="border-t border-white/10 pt-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-blue-300">Platform modules</p>
            <h2 id="foundation-title" className="mt-2 text-2xl font-semibold">Foundation overview</h2>
          </div>
          <span className="flex items-center gap-2 text-xs text-white/55">
            <ShieldCheck className="size-4" aria-hidden="true" /> Local-first, no automatic deployment
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {modules.map(({ name, detail, status, icon: Icon }) => (
            <article key={name} className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <Icon className="size-5 text-blue-300" aria-hidden="true" />
                <span className="text-xs text-white/45">{statusLabel(status)}</span>
              </div>
              <h3 className="font-medium">{name}</h3>
              <p className="mt-1 text-sm text-white/50">{detail}</p>
            </article>
          ))}
        </div>
      </section>
      <footer className="mt-16 border-t border-white/10 py-6 text-xs text-white/40">
        Group 1 · Development scaffolding only · Runtime health is not inferred from this page
      </footer>
    </main>
  );
}

