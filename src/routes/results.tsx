import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { loadDraft, recordAttempt, roundName, saveDraft, type Draft } from "@/lib/prep";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Post interview feedback — Groot" },
      { name: "description", content: "Your score, what went well, what to improve and honest question-by-question feedback." },
      { property: "og:title", content: "Post interview feedback — Groot" },
      { property: "og:description", content: "Your score, what went well, what to improve and honest question-by-question feedback." },
    ],
  }),
  component: ResultsPage,
});

const CATS: [keyof NonNullable<Draft["results"]>["categories"], string][] = [
  ["roleRelevance", "Role Relevance"], ["evidence", "Evidence & Impact"], ["structure", "STAR / Structure"],
  ["technical", "Technical Quality"], ["communication", "Communication"], ["effectiveness", "Interview Effectiveness"],
];

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <Card><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent><ul className="list-disc space-y-1 pl-5 text-sm">{items.map((x, i) => <li key={i}>{x}</li>)}</ul></CardContent></Card>
  );
}


type Mistake = { quote: string; issue: string };
/** Split an answer into plain and mistake segments by locating each quoted mistake. */
function segments(answer: string, mistakes: Mistake[]) {
  const lower = answer.toLowerCase();
  const ranges: { s: number; e: number; m: Mistake }[] = [];
  for (const m of mistakes) {
    const q = m.quote.trim();
    if (!q) continue;
    const s = lower.indexOf(q.toLowerCase());
    if (s >= 0 && !ranges.some((r) => s < r.e && s + q.length > r.s)) ranges.push({ s, e: s + q.length, m });
  }
  ranges.sort((a, b) => a.s - b.s);
  const out: { text: string; m?: Mistake }[] = [];
  let i = 0;
  for (const r of ranges) { if (r.s > i) out.push({ text: answer.slice(i, r.s) }); out.push({ text: answer.slice(r.s, r.e), m: r.m }); i = r.e; }
  if (i < answer.length) out.push({ text: answer.slice(i) });
  return out;
}
const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

function Pie({ pct }: { pct: number }) {
  const r = 70, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 180 180" className="h-44 w-44 -rotate-90">
      <circle cx="90" cy="90" r={r} fill="none" strokeWidth="36" className="stroke-primary" />
      <circle cx="90" cy="90" r={r} fill="none" strokeWidth="36" className="stroke-destructive"
        strokeDasharray={`${(pct / 100) * c} ${c}`} />
    </svg>
  );
}

function ResultsPage() {
  const nav = useNavigate();
  const [d, setD] = useState<Draft | null>(null);
  useEffect(() => {
    const dr = loadDraft();
    if (!dr.results) nav({ to: "/" });
    else setD(dr);
  }, []);
  const r = d?.results;
  if (!d || !r) return null;

  const qs = r.perQuestion.map((q) => ({ ...q, segs: segments(q.answer || "", q.mistakes ?? []) }));
  const total = qs.reduce((n, q) => n + words(q.answer || ""), 0);
  const bad = qs.reduce((n, q) => n + q.segs.filter((x) => x.m).reduce((k, x) => k + words(x.text), 0), 0);
  const pct = total ? Math.round((bad / total) * 100) : 0;

  function saveInterview() {
    if (d!.results?.saved) return;
    const jobId = recordAttempt(d!);
    const next = { ...d!, jobId, results: { ...d!.results!, saved: true } };
    saveDraft(next);
    setD(next);
    toast.success("Interview saved — it now shows on your home page.");
  }

  function retry() {
    saveDraft({ ...d!, prep: undefined, plan: undefined, transcript: undefined, results: undefined });
    nav({ to: "/prepare/about" });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-14 sm:px-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex h-32 w-32 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <span className="font-display text-5xl font-semibold">{r.overallScore}</span>
          <span className="text-sm opacity-80">/ 100</span>
        </div>
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Post interview feedback</h1>
          <p className="mt-1 text-muted-foreground">{d.analysis?.title} · {d.analysis?.company} · {roundName(d)}</p>
          <p className="mt-3 text-sm"><strong>Next:</strong> {r.nextAction}</p>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row">
          <div className="relative">
            <Pie pct={pct} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-3xl font-semibold">{pct}%</span>
              <span className="text-xs text-muted-foreground">mistakes</span>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <h2 className="font-display text-xl font-semibold">How much of what you said had mistakes</h2>
            <p className="text-muted-foreground">Based on {total} words you spoke across {qs.length} questions.</p>
            <p className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-destructive" />Mistakes — {pct}%</p>
            <p className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-primary" />Fine — {100 - pct}%</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {CATS.map(([k, label]) => (
          <div key={k} className="rounded-xl border border-border bg-card p-4">
            <div className="flex justify-between text-sm"><span>{label}</span><strong>{r.categories[k]}</strong></div>
            <Progress className="mt-2" value={r.categories[k]} />
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <List title="What you did well" items={r.didWell} />
        <List title="What to improve" items={r.improve} />
        <List title="Missed opportunities" items={r.missed} />
      </div>

      <Card><CardHeader><CardTitle className="text-base">Job description coverage</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {r.jdCoverage.map((c) => (
            <span key={c.competency} className={`rounded-full px-3 py-1 text-sm ${c.covered === "strong" ? "bg-primary text-primary-foreground" : c.covered === "partial" ? "bg-accent text-accent-foreground" : "border border-destructive/50 text-destructive"}`}>
              {c.competency} · {c.covered}
            </span>
          ))}
        </CardContent></Card>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold">Question-by-question feedback</h2>
        {qs.map((q, i) => (
          <Card key={i}>
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
              <CardTitle className="text-base leading-snug">Q{i + 1}. {q.question}</CardTitle>
              <span className="shrink-0 rounded-lg bg-secondary px-3 py-1 font-semibold">{q.score}</span>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">What you said</p>
                <p className="mt-2 whitespace-pre-wrap leading-relaxed">
                  {q.segs.length ? q.segs.map((x, k) => x.m
                    ? <mark key={k} title={x.m.issue} className="rounded bg-destructive/15 px-0.5 text-destructive underline decoration-destructive decoration-wavy">{x.text}</mark>
                    : <span key={k}>{x.text}</span>) : <span className="text-muted-foreground">No answer recorded.</span>}
                </p>
              </div>
              <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
                <p className="text-xs font-semibold uppercase text-destructive">Mistakes made</p>
                {q.mistakes?.length ? (
                  <ul className="mt-2 space-y-2">{q.mistakes.map((m, k) => (
                    <li key={k}><span className="font-medium text-destructive">"{m.quote}"</span> — {m.issue}</li>
                  ))}</ul>
                ) : <p className="mt-2 text-muted-foreground">No clear mistakes in this answer.</p>}
              </div>
              <p className="text-muted-foreground"><strong className="text-foreground">How to improve:</strong> {q.feedback}</p>
              <div className="rounded-xl border border-primary/40 bg-secondary/40 p-4"><p className="text-xs font-semibold uppercase text-primary">Improved answer</p><p className="mt-2 whitespace-pre-wrap">{q.improved}</p></div>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="flex flex-wrap gap-3">
        <Button size="lg" onClick={saveInterview} disabled={!!r.saved}>{r.saved ? "Interview saved" : "Save interview"}</Button>
        <Button size="lg" variant="secondary" onClick={retry}>Retry with new questions</Button>
        {r.saved && d.jobId && <Button asChild size="lg" variant="outline"><Link to="/jobs/$id" params={{ id: d.jobId }}>View interview tracker</Link></Button>}
        <Button asChild size="lg" variant="ghost"><Link to="/">Home</Link></Button>
      </div>
    </div>
  );
}
