import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { REAL_STATUSES, getJob, newDraft, progressFor, saveDraft, updateJob, type Job, type RealStatus, type Round } from "@/lib/prep";

export const Route = createFileRoute("/jobs/$id")({
  head: () => ({
    meta: [
      { title: "Interview tracker" },
      { name: "description", content: "Every round, attempt and score for one job, tracked automatically." },
      { property: "og:title", content: "Interview tracker" },
      { property: "og:description", content: "Every round, attempt and score for one job, tracked automatically." },
    ],
  }),
  component: JobPage,
});

function JobPage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const [job, setJob] = useState<Job | null | undefined>(undefined);
  useEffect(() => setJob(getJob(id) ?? null), [id]);
  if (job === undefined) return null;
  if (!job) return <div className="px-4 py-24 text-center">Interview not found. <Link to="/" className="text-primary underline">Go home</Link></div>;

  function practice(r?: Round) {
    const j = job!;
    saveDraft({
      ...newDraft(), jobId: j.id, roundId: r?.id, jd: j.jd, cv: j.cv, analysis: j.analysis,
      ...(r ? { round: r.name, interviewers: r.interviewers, duration: r.duration, additional: r.additional } : {}),
    });
    nav({ to: "/prepare/about" });
  }
  function setStatus(r: Round, s: RealStatus) {
    updateJob(job!.id, (j) => ({ ...j, rounds: j.rounds.map((x) => (x.id === r.id ? { ...x, realStatus: s } : x)) }));
    setJob(getJob(job!.id)!);
  }
  function remove() {
    if (!confirm("Delete this interview and all its attempts?")) return;
    localStorage.setItem("groot.tracker", JSON.stringify(JSON.parse(localStorage.getItem("groot.tracker") || "[]").filter((j: Job) => j.id !== job!.id)));
    nav({ to: "/" });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-14 sm:px-6">
      <div>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Home</Link>
        <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight">{job.title}</h1>
        <p className="text-muted-foreground">{job.company} · {job.analysis.seniority}</p>
        <p className="mt-3 max-w-3xl text-sm">{job.analysis.summary}</p>
      </div>

      {job.rounds.map((r) => {
        const sorted = [...r.attempts].reverse();
        const latest = sorted[0];
        return (
          <Card key={r.id}>
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
              <CardTitle className="font-display text-xl">{r.name}</CardTitle>
              <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={r.realStatus} onChange={(e) => setStatus(r, e.target.value as RealStatus)} aria-label="Real interview status">
                {REAL_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </CardHeader>
            <CardContent className="space-y-4">
              {r.scheduledDate && <p className="text-sm text-muted-foreground">Real interview on {new Date(r.scheduledDate).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</p>}
              <div>
                <div className="flex justify-between text-sm"><span>Preparation progress</span><span>{progressFor(r)}%</span></div>
                <Progress className="mt-2" value={progressFor(r)} />
              </div>
              {latest && (
                <div className="rounded-xl bg-secondary/40 p-4 text-sm">
                  <p className="font-semibold">Latest feedback</p>
                  <p className="mt-1">{latest.results.nextAction}</p>
                </div>
              )}
              <div className="divide-y divide-border rounded-xl border border-border">
                {sorted.map((a, i) => (
                  <div key={a.id} className="flex justify-between p-3 text-sm">
                    <span>Attempt {sorted.length - i} · {new Date(a.date).toLocaleDateString()}</span>
                    <strong>{a.score}/100</strong>
                  </div>
                ))}
              </div>
              <Button onClick={() => practice(r)}>Practice this round again</Button>
            </CardContent>
          </Card>
        );
      })}

      <div className="flex flex-wrap gap-3">
        <Button size="lg" variant="outline" onClick={() => practice()}>Add next round</Button>
        <Button variant="ghost" className="text-destructive" onClick={remove}>Delete</Button>
      </div>
    </div>
  );
}
