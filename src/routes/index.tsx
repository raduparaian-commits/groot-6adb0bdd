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

const FILTERS = ["All", "Preparing", "Scheduled", "Waiting", "Completed"] as const;

function statusOf(j: Job) { return j.rounds.at(-1)?.realStatus ?? "Preparing"; }
function matches(j: Job, f: (typeof FILTERS)[number]) {
  const s = statusOf(j);
  if (f === "All") return true;
  if (f === "Waiting") return s === "Waiting for outcome";
  if (f === "Completed") return ["Passed", "Rejected", "Offer"].includes(s);
  return s === f;
}

function Home() {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  useEffect(() => {
    const refresh = () => setJobs(loadJobs());
    refresh();
    const t = setInterval(refresh, 3000);
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => { clearInterval(t); window.removeEventListener("focus", refresh); window.removeEventListener("storage", refresh); };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <section className="rounded-3xl bg-surface p-10 text-surface-foreground sm:p-14">
        <h1 className="font-display max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Walk into every interview already practised.</h1>
        <p className="mt-4 max-w-xl text-surface-foreground/75">Paste a job description. A live AI interviewer adapts to the role, the round and your answers — then gives honest feedback that never invents your experience.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg"><Link to="/prepare">Prepare for an Interview <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          <Button asChild size="lg" variant="secondary"><Link to="/" hash="interviews">See my interview tracker</Link></Button>
        </div>
      </section>

      <section id="interviews" className="mt-14 scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-semibold">Your interviews</h2>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1 text-sm ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{f}</button>
            ))}
          </div>
        </div>
        {jobs && jobs.length === 0 && (
          <p className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No interviews yet. Complete your first mock interview and it will appear here automatically.
          </p>
        )}
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {jobs?.filter((j) => matches(j, filter)).map((j) => {
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
      </section>
    </div>
  );
}
