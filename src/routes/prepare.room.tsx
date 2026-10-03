import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadDraft, roundName, type Draft } from "@/lib/prep";

export const Route = createFileRoute("/prepare/room")({
  head: () => ({
    meta: [
      { title: "Preparation room — Groot" },
      { name: "description", content: "See what you're likely to be tested on and prepare your STAR examples before going live." },
      { property: "og:title", content: "Preparation room — Groot" },
      { property: "og:description", content: "See what you're likely to be tested on and prepare your STAR examples before going live." },
    ],
  }),
  component: RoomPage,
});

const STAR = [
  ["Situation", "What was happening?"],
  ["Task", "What were you responsible for?"],
  ["Action", "What did YOU personally do?"],
  ["Result", "What happened?"],
];

function RoomPage() {
  const nav = useNavigate();
  const [d, setD] = useState<Draft | null>(null);
  useEffect(() => {
    const dr = loadDraft();
    if (!dr.prep || !dr.analysis) nav({ to: "/prepare" });
    else setD(dr);
  }, []);
  if (!d?.prep || !d.analysis) return null;
  const meta = [["Company", d.analysis.company], ["Round", roundName(d)], ["Duration", `${d.duration} min`], ["Interviewer", d.interviewers.join(", ")]];

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-14 sm:px-6">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <Badge variant="outline" className="border-primary/40 text-primary">Step 3 of 3</Badge>
          <Button asChild variant="ghost" size="sm"><Link to="/prepare">← Back</Link></Button>
        </div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Your interview with {d.prep.interviewer.name} is ready</h1>
        <p className="mt-2 text-xl">{d.analysis.title}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {meta.map(([k, v]) => (
            <div key={k} className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{k}</p>
              <p className="mt-1 text-sm font-medium">{v}</p>
            </div>
          ))}
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">What you're likely to be tested on</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {d.prep.areas.map((a) => (
            <Card key={a.name}><CardContent className="p-5"><p className="font-semibold">{a.name}</p><p className="mt-1 text-sm text-muted-foreground">{a.why}</p></CardContent></Card>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader><CardTitle className="text-base">Likely scenarios</CardTitle></CardHeader>
          <CardContent><ul className="list-disc space-y-1 pl-5 text-sm">{d.prep.scenarios.map((s) => <li key={s}>{s}</li>)}</ul></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Question styles to expect</CardTitle></CardHeader>
          <CardContent><ul className="list-disc space-y-1 pl-5 text-sm">{d.prep.questionStyles.map((s) => <li key={s}>{s}</li>)}</ul></CardContent></Card>
      </div>

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">STAR preparation</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          {STAR.map(([k, v]) => (
            <div key={k} className="rounded-xl border border-primary/30 bg-secondary/40 p-4">
              <p className="flex items-center gap-2 font-semibold"><span className="font-display text-2xl font-semibold leading-none text-primary">{k![0]}</span>{k}</p>
              <p className="text-sm text-muted-foreground">{v}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Use real examples. Feedback never invents achievements for you.</p>
      </section>

      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center">
        <p>You'll be interviewed by <strong>{d.prep.interviewer.name}</strong>, {d.prep.interviewer.role}.</p>
        <p className="text-sm text-muted-foreground">The exact questions stay hidden — just like the real thing. Find a quiet spot and allow microphone access.</p>
        <Button asChild size="lg" className="mt-2"><Link to="/live">Start interview</Link></Button>
      </div>
    </div>
  );
}
