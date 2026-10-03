import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DURATIONS, INTERVIEWERS, ROUNDS, loadDraft, newDraft, previousSignatures, roundName, saveDraft, type Draft } from "@/lib/prep";
import { buildInterview } from "@/lib/prep.functions";

export const Route = createFileRoute("/prepare/")({
  head: () => ({
    meta: [
      { title: "Tell us about the job — Groot" },
      { name: "description", content: "Paste a job description and Groot builds a realistic interview around it." },
      { property: "og:title", content: "Tell us about the job — Groot" },
      { property: "og:description", content: "Paste a job description and Groot builds a realistic interview around it." },
    ],
  }),
  component: JdPage,
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

function JdPage() {
  const nav = useNavigate();
  const build = useServerFn(buildInterview);
  const [jd, setJd] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [d, setD] = useState<Draft | null>(null);
  const [step, setStep] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const [reading, setReading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [chars, setChars] = useState(0);
  const [extractError, setExtractError] = useState<string | null>(null);

  useEffect(() => {
    const dr = loadDraft();
    if (!dr.jobId) setJd(dr.jd);
  }, []);
  const ok = jd.trim().length > 0;
  const set = (p: Partial<Draft>) => setD((prev) => (prev ? { ...prev, ...p } : prev));

  function remove() {
    if (jd.length > 200 && !confirm("Remove this job description?")) return;
    setJd("");
  }

  const [hideStep1, setHideStep1] = useState(false);

  function next() {
    const draft = { ...newDraft(), jd };
    saveDraft(draft);
    setD(draft);
    setUnlocked(true);
    requestAnimationFrame(() => step2Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    // After the slide, drop step 1 from the page so it can't be scrolled back to.
    setTimeout(() => {
      setHideStep1(true);
      requestAnimationFrame(() => window.scrollTo({ top: 0 }));
    }, 800);
  }

  function back() {
    setUnlocked(false);
    setHideStep1(false);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  async function readCv(file?: File) {
    if (!file) return;
    setReading(true);
    setExtractError(null);
    try {
      let text = "";
      const name = file.name.toLowerCase();
      if (name.endsWith(".pdf")) {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
        const pages: string[] = [];
        for (let i = 1; i <= Math.min(doc.numPages, 15); i++) {
          const page = await doc.getPage(i);
          const content = await page.getTextContent();
          pages.push((content.items as { str?: string }[]).map((it) => it.str ?? "").join(" "));
        }
        text = pages.join("\n\n");
      } else if (name.endsWith(".docx")) {
        const mammoth = await import("mammoth/mammoth.browser.js");
        text = (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value;
      } else {
        text = await file.text();
      }
      text = text.replace(/[ \t]+\n/g, "\n").trim();
      if (!text) throw new Error("No readable text found in that file — try pasting it below instead.");
      setFileName(file.name);
      setChars(text.length);
      set({ cv: text });
    } catch (e: any) {
      setExtractError(e?.message || "Couldn't read that file. Try pasting the text instead.");
    } finally {
      setReading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

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
      <div className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-4 py-32 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-display mt-6 text-2xl">{STEPS[step]}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-14 sm:px-6">
      {!hideStep1 && (
      <div className="flex min-h-[calc(100vh-10rem)] flex-col">
      <Badge variant="outline" className="mb-4 self-start border-primary/40 text-primary">
        Step 1 of 3
      </Badge>
      <div className="flex flex-1 flex-col justify-center">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Tell us about the job</h1>
        <p className="mt-2 text-muted-foreground">Paste the full job description. Your interview adapts to every responsibility and skill in it.</p>
        <Textarea className="mt-8 min-h-[180px] max-h-[70vh] resize-none overflow-y-auto [field-sizing:content]" placeholder="Paste the complete job description here..." value={jd} onChange={(e) => setJd(e.target.value)} />
        <div className="mt-6 flex justify-between">
          <Button variant="ghost" onClick={remove} disabled={!jd}>Remove</Button>
          <Button size="lg" onClick={next} disabled={!ok}>Next</Button>
        </div>
      </div>
      </div>
      )}

      {unlocked && (
      <div ref={step2Ref} className={`scroll-mt-24 space-y-10 ${hideStep1 ? "" : "mt-24"}`}>
        <div>
          <Badge variant="outline" className="mb-4 border-primary/40 text-primary">Step 2 of 3</Badge>
          <h1 className="font-display text-4xl font-semibold tracking-tight">About your interview</h1>
        </div>
        <section>
          <h2 className="mb-3 font-semibold">Interview duration</h2>
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map((m) => <Chip key={m} on={d?.duration === m} onClick={() => set({ duration: m })}>{m} minutes</Chip>)}
          </div>
        </section>
        <section>
          <h2 className="mb-3 font-semibold">Interview round</h2>
          <div className="flex flex-wrap gap-2">
            {ROUNDS.map((r) => <Chip key={r} on={d?.round === r} onClick={() => set({ round: r })}>{r}</Chip>)}
          </div>
          {d?.round === "Other" && <Input className="mt-3" placeholder="Describe the round" value={d.roundOther} onChange={(e) => set({ roundOther: e.target.value })} />}
        </section>
        <section>
          <h2 className="mb-3 font-semibold">When is your real interview? <span className="font-normal text-muted-foreground">(optional)</span></h2>
          <Input type="date" className="max-w-xs" value={d?.scheduledDate ?? ""} onChange={(e) => set({ scheduledDate: e.target.value })} />
        </section>
        <section>
          <h2 className="mb-3 font-semibold">Who will interview you?</h2>
          <div className="flex flex-wrap gap-2">
            {INTERVIEWERS.map((r) => (
              <Chip key={r} on={d?.interviewers.includes(r) ?? false}
                onClick={() => set({ interviewers: d?.interviewers.includes(r) ? d.interviewers.filter((x) => x !== r) : [...(d?.interviewers ?? []), r] })}>{r}</Chip>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-3 font-semibold">Anything else you know about the interview? <span className="font-normal text-muted-foreground">(optional)</span></h2>
          <Textarea rows={3} placeholder='e.g. "The recruiter said there will be scenario questions."' value={d?.additional ?? ""} onChange={(e) => set({ additional: e.target.value })} />
        </section>
        <section>
          <h2 className="mb-3 font-semibold">Your CV or background <span className="font-normal text-muted-foreground">(optional)</span></h2>
          <Textarea rows={5} placeholder="Paste your CV or a short summary of your experience. Feedback will only ever use facts you provide." value={d?.cv ?? ""} onChange={(e) => set({ cv: e.target.value })} />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt,.md,.rtf" className="hidden" onChange={(e) => readCv(e.target.files?.[0])} aria-label="Upload your CV" />
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={reading}>
              {reading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {reading ? "Reading your CV..." : "Upload CV"}
            </Button>
            {fileName && <span className="text-sm text-muted-foreground">{fileName} · {chars.toLocaleString()} characters read</span>}
            {fileName && <button type="button" className="text-sm text-muted-foreground underline" onClick={() => { setFileName(""); setChars(0); set({ cv: "" }); }}>Clear</button>}
          </div>
        </section>
        {(error || extractError) && <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error || extractError}</p>}
        <div className="flex justify-between pb-14">
          <Button variant="ghost" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Back</Button>
          <Button size="lg" onClick={go} disabled={!d?.interviewers.length}>Build My Interview</Button>
        </div>
      </div>
    </div>
  );
}
