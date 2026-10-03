import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { loadJobs, progressFor, type Job } from "@/lib/prep";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Groot — AI interview practice & automatic tracker" },
      { name: "description", content: "Paste a job description, practise a live AI interview that adapts to you, and track every round automatically." },
      { property: "og:title", content: "Groot — AI interview practice & automatic tracker" },
      { property: "og:description", content: "Paste a job description, practise a live AI interview that adapts to you, and track every round automatically." },
    ],
  }),
  component: Home,
});

function statusOf(j: Job) { return j.rounds.at(-1)?.realStatus ?? "Preparing"; }

function Home() {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  useEffect(() => {
    const refresh = () => setJobs(loadJobs());
    refresh();
    const t = setInterval(refresh, 3000);
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => { clearInterval(t); window.removeEventListener("focus", refresh); window.removeEventListener("storage", refresh); };
  }, []);

  return (
    <div className="flex w-full flex-1 flex-col">
      <section className="relative flex min-h-[calc(100svh-4rem)] flex-1 flex-col items-center justify-center overflow-hidden bg-surface px-4 py-20 text-center text-surface-foreground sm:py-28">
        {/* Neural pulse background — stretches edge-to-edge across the window */}
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
          <div className="hero-orb absolute top-1/4 -left-24 h-80 w-80 rounded-full bg-primary opacity-15 blur-[130px]" />
          <div className="hero-orb absolute bottom-1/4 -right-24 h-72 w-72 rounded-full bg-primary opacity-15 blur-[110px]" style={{ animationDelay: "-4.5s" }} />
          <div className="hero-ring absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10" />
          <div className="hero-ring absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/15" style={{ animationDelay: "-2s" }} />
        </div>

        <div className="relative z-10 mx-auto max-w-2xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-card/70 px-4 py-1.5 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-xs font-medium uppercase tracking-widest text-primary">Practice. Grow. Get Ready</span>
          </div>
          <h1 className="font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl">Walk into every interview already practised.</h1>
          <p className="mx-auto mt-4 max-w-xl text-surface-foreground/75">Paste a job description. A live AI interviewer adapts to the role, the round and your answers, then gives honest feedback that never invents your experience.</p>
          <div className="mt-10 flex justify-center">
            <Button asChild size="lg" className="h-12 px-8 text-base" style={{ boxShadow: "0 0 32px color-mix(in oklab, var(--primary) 35%, transparent)" }}>
              <Link to="/prepare">Prepare for an Interview <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="interviews" className="scroll-mt-24">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="font-display text-3xl font-medium">Your interviews</h2>
        {jobs && jobs.length === 0 && (
          <p className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No interviews yet. Complete your first mock interview and it will appear here automatically.
          </p>
        )}
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {jobs?.map((j) => {
            const round = j.rounds.at(-1);
            const atts = round?.attempts ?? [];
            const latest = atts.at(-1);
            const prev = atts.at(-2);
            return (
              <Card key={j.id}>
                <CardContent className="space-y-4 p-6">
                  <div>
                    <p className="font-display text-xl font-semibold">{j.title}</p>
                    <p className="text-sm text-muted-foreground">{j.company}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-muted-foreground">Current round</p><p className="font-medium">{round?.name}</p></div>
                    <div><p className="text-muted-foreground">Real status</p><p className="font-medium">{statusOf(j)}</p></div>
                    <div><p className="text-muted-foreground">Latest mock score</p><p className="font-medium">{latest ? `${latest.score}/100` : "—"}</p></div>
                    <div><p className="text-muted-foreground">Previous</p><p className="font-medium">{prev ? `${prev.score}/100` : "—"}</p></div>
                  </div>
                  {round && <div><div className="flex justify-between text-sm"><span>Preparation</span><span>{progressFor(round)}%</span></div><Progress className="mt-2" value={progressFor(round)} /></div>}
                  {round?.scheduledDate && <p className="text-xs text-muted-foreground">Real interview on {new Date(round.scheduledDate).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</p>}
                  <p className="text-xs text-muted-foreground">Last practice {latest ? new Date(latest.date).toLocaleDateString() : "—"}</p>
                  <Button asChild className="w-full"><Link to="/jobs/$id" params={{ id: j.id }}>Continue Preparation</Link></Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
        </div>
      </section>
    </div>
  );
}
