import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DURATIONS, INTERVIEWERS, ROUNDS, loadDraft, previousSignatures, roundName, saveDraft, type Draft } from "@/lib/prep";
import { buildInterview } from "@/lib/prep.functions";

export const Route = createFileRoute("/prepare/about")({
  head: () => ({
    meta: [
      { title: "About your interview — Groot" },
      { name: "description", content: "Choose the round, length and interviewer so your practice matches the real thing." },
      { property: "og:title", content: "About your interview — Groot" },
      { property: "og:description", content: "Choose the round, length and interviewer so your practice matches the real thing." },
    ],
  }),
  component: AboutPage,
});

const STEPS = ["Analysing the role...", "Identifying interview priorities...", "Building your personalised interview..."];

function Chip({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50"}`}>
      {children}
    </button>
  );
}

function AboutPage() {
  const nav = useNavigate();
  const build = useServerFn(buildInterview);
  const [d, setD] = useState<Draft | null>(null);
  const [step, setStep] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [chars, setChars] = useState(0);
  const [extractError, setExtractError] = useState<string | null>(null);

  useEffect(() => {
    const dr = loadDraft();
    if (!dr.jd) nav({ to: "/prepare" });
    else setD(dr);
  }, []);
  if (!d) return null;
  const set = (p: Partial<Draft>) => setD({ ...d, ...p });

  async function go() {
    if (!d) return;
    setError(null);
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, 2)), 2500);
    try {
      const r = await build({ data: { jd: d.jd, duration: d.duration, round: roundName(d), interviewers: d.interviewers, additional: d.additional, cv: d.cv, previousSignatures: previousSignatures(d.jobId) } });
      saveDraft({ ...d, ...r, transcript: undefined, results: undefined });
      nav({ to: "/prepare/room" });
    } catch (e: any) {
      setError(e.message);
      setStep(-1);
    } finally {
      clearInterval(t);
    }
  }

  if (step >= 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-32 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-display mt-6 text-2xl">{STEPS[step]}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-14 sm:px-6">
      <div>
        <Badge variant="outline" className="mb-4 border-primary/40 text-primary">Step 2 of 3</Badge>
        <h1 className="font-display text-4xl font-semibold tracking-tight">About your interview</h1>
      </div>
      <section>
        <h2 className="mb-3 font-semibold">Interview duration</h2>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((m) => <Chip key={m} on={d.duration === m} onClick={() => set({ duration: m })}>{m} minutes</Chip>)}
        </div>
      </section>
      <section>
        <h2 className="mb-3 font-semibold">Interview round</h2>
        <div className="flex flex-wrap gap-2">
          {ROUNDS.map((r) => <Chip key={r} on={d.round === r} onClick={() => set({ round: r })}>{r}</Chip>)}
        </div>
        {d.round === "Other" && <Input className="mt-3" placeholder="Describe the round" value={d.roundOther} onChange={(e) => set({ roundOther: e.target.value })} />}
      </section>
      <section>
        <h2 className="mb-3 font-semibold">Who will interview you?</h2>
        <div className="flex flex-wrap gap-2">
          {INTERVIEWERS.map((r) => (
            <Chip key={r} on={d.interviewers.includes(r)}
              onClick={() => set({ interviewers: d.interviewers.includes(r) ? d.interviewers.filter((x) => x !== r) : [...d.interviewers, r] })}>{r}</Chip>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-3 font-semibold">Anything else you know about the interview? <span className="font-normal text-muted-foreground">(optional)</span></h2>
        <Textarea rows={3} placeholder='e.g. "The recruiter said there will be scenario questions."' value={d.additional} onChange={(e) => set({ additional: e.target.value })} />
      </section>
      <section>
        <h2 className="mb-3 font-semibold">Your CV or background <span className="font-normal text-muted-foreground">(optional)</span></h2>
        <Textarea rows={5} placeholder="Paste your CV or a short summary of your experience. Feedback will only ever use facts you provide." value={d.cv} onChange={(e) => set({ cv: e.target.value })} />
      </section>
      {error && <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => nav({ to: "/prepare" })}>Back</Button>
        <Button size="lg" onClick={go} disabled={!d.interviewers.length}>Build My Interview</Button>
      </div>
    </div>
  );
}
