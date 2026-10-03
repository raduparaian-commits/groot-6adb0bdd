import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { loadDraft, roundName, saveDraft, type Draft } from "@/lib/prep";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Interview results — Groot" },
      { name: "description", content: "Your score, what went well, what to improve and honest question-by-question feedback." },
      { property: "og:title", content: "Interview results — Groot" },
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
          <h1 className="font-display text-4xl font-semibold tracking-tight">Your results</h1>
          <p className="mt-1 text-muted-foreground">{d.analysis?.title} · {d.analysis?.company} · {roundName(d)}</p>
          <p className="mt-3 text-sm"><strong>Next:</strong> {r.nextAction}</p>
        </div>
      </div>

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
        {r.perQuestion.map((q, i) => (
          <Card key={i}>
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
              <CardTitle className="text-base leading-snug">Q{i + 1}. {q.question}</CardTitle>
              <span className="shrink-0 rounded-lg bg-secondary px-3 py-1 font-semibold">{q.score}</span>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-muted-foreground">{q.feedback}</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-muted/40 p-4"><p className="text-xs font-semibold uppercase text-muted-foreground">Your answer</p><p className="mt-2 whitespace-pre-wrap">{q.answer}</p></div>
                <div className="rounded-xl border border-primary/40 bg-secondary/40 p-4"><p className="text-xs font-semibold uppercase text-primary">Improved structure</p><p className="mt-2 whitespace-pre-wrap">{q.improved}</p></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="flex flex-wrap gap-3">
        <Button size="lg" onClick={retry}>Retry with new questions</Button>
        {d.jobId && <Button asChild size="lg" variant="outline"><Link to="/jobs/$id" params={{ id: d.jobId }}>View interview tracker</Link></Button>}
        <Button asChild size="lg" variant="ghost"><Link to="/">Home</Link></Button>
      </div>
    </div>
  );
}
