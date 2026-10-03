import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, MicOff, PhoneOff, ScrollText, Send, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { loadDraft, recordAttempt, roundName, saveDraft, type Draft, type Turn } from "@/lib/prep";
import { nextTurn, scoreInterview } from "@/lib/prep.functions";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Live interview — Groot" },
      { name: "description", content: "A live, adaptive AI interview that listens and follows up like a real interviewer." },
      { property: "og:title", content: "Live interview — Groot" },
      { property: "og:description", content: "A live, adaptive AI interview that listens and follows up like a real interviewer." },
    ],
  }),
  component: LivePage,
});

type Phase = "thinking" | "speaking" | "listening" | "scoring";

function LivePage() {
  const nav = useNavigate();
  const ask = useServerFn(nextTurn);
  const score = useServerFn(scoreInterview);
  const [d, setD] = useState<Draft | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [phase, setPhase] = useState<Phase>("thinking");
  const [answer, setAnswer] = useState("");
  const [muted, setMuted] = useState(false);
  const [mic, setMic] = useState(false);
  const [showT, setShowT] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const recRef = useRef<any>(null);
  const startRef = useRef(Date.now());
  const mutedRef = useRef(false);
  mutedRef.current = muted;

  useEffect(() => {
    const dr = loadDraft();
    if (!dr.plan || !dr.prep) { nav({ to: "/prepare" }); return; }
    setD(dr);
    startRef.current = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => { clearInterval(t); window.speechSynthesis?.cancel(); recRef.current?.stop(); };
  }, []);

  useEffect(() => { if (d && turns.length === 0) step([]); }, [d]);

  function payload(dr: Draft, t: Turn[]) {
    return {
      jd: dr.jd, duration: dr.duration, round: roundName(dr), interviewers: dr.interviewers, additional: dr.additional, cv: dr.cv,
      title: dr.analysis!.title, company: dr.analysis!.company, interviewer: dr.prep!.interviewer, plan: dr.plan!,
      transcript: t, elapsedSec: Math.floor((Date.now() - startRef.current) / 1000),
    };
  }

  function say(text: string, after: () => void) {
    const s = window.speechSynthesis;
    if (mutedRef.current || !s) { after(); return; }
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.02;
    u.onend = after;
    u.onerror = after;
    s.speak(u);
  }

  async function step(t: Turn[]) {
    if (!d) return;
    setPhase("thinking");
    try {
      const r = await ask({ data: payload(d, t) });
      const next = [...t, { speaker: "interviewer" as const, text: r.say, followUp: r.followUp }];
      setTurns(next);
      setPhase("speaking");
      setClosing(r.done);
      say(r.say, () => setPhase(r.done ? "speaking" : "listening"));
    } catch (e: any) {
      setError(e.message);
      setPhase("listening");
    }
  }

  function toggleMic() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return setError("Voice answers aren't supported in this browser — type instead.");
    if (mic) { recRef.current?.stop(); return; }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    const base = answer;
    let said = "";
    rec.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) said += e.results[i][0].transcript + " ";
      setAnswer((base + " " + said).trim());
    };
    rec.onend = () => setMic(false);
    recRef.current = rec;
    rec.start();
    setMic(true);
  }

  function send() {
    recRef.current?.stop();
    const text = answer.trim();
    if (!text) return;
    const t = [...turns, { speaker: "candidate" as const, text }];
    setTurns(t);
    setAnswer("");
    step(t);
  }

  async function end() {
    if (!d) return;
    recRef.current?.stop();
    window.speechSynthesis?.cancel();
    if (!turns.some((t) => t.speaker === "candidate")) { nav({ to: "/" }); return; }
    setPhase("scoring");
    try {
      const results = await score({ data: payload(d, turns) });
      const done: Draft = { ...d, transcript: turns, durationSec: elapsed, results };
      const jobId = recordAttempt(done);
      saveDraft({ ...done, jobId });
      nav({ to: "/results" });
    } catch (e: any) {
      setError(e.message);
      setPhase("listening");
    }
  }

  if (!d?.prep) return null;
  const current = [...turns].reverse().find((t) => t.speaker === "interviewer");
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const initials = d.prep.interviewer.name.split(" ").map((w) => w[0]).join("").slice(0, 2);
  const label = { thinking: "Thinking...", speaking: "Speaking...", listening: "Listening...", scoring: "Preparing your feedback..." }[phase];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface text-surface-foreground">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-10">
        <div className="flex w-full items-center justify-between text-sm text-surface-foreground/70">
          <span>{d.analysis?.title} · {roundName(d)}</span>
          <span className="font-mono tabular-nums">{mm}:{ss} / {d.duration}:00</span>
        </div>

        <div className="relative mt-12">
          <div className={`absolute inset-0 rounded-full bg-primary/40 ${phase === "speaking" ? "animate-ping" : ""}`} />
          <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-primary font-display text-5xl text-primary-foreground">{initials}</div>
        </div>
        <p className="font-display mt-6 text-2xl">{d.prep.interviewer.name}</p>
        <p className="text-sm text-surface-foreground/70">{d.prep.interviewer.role}</p>

        <div className="mt-6 flex h-10 items-end gap-1" aria-hidden>
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} className={`w-1.5 rounded-full bg-primary ${phase === "speaking" || mic ? "animate-pulse" : ""}`}
              style={{ height: phase === "speaking" || mic ? `${20 + ((i * 37) % 80)}%` : "15%", animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
        <p className="mt-3 flex items-center gap-2 text-sm">{(phase === "thinking" || phase === "scoring") && <Loader2 className="h-4 w-4 animate-spin" />}{label}</p>

        {muted && current && <p className="mt-6 rounded-xl bg-background/10 p-4 text-center">{current.text}</p>}
        {error && <p className="mt-4 rounded-lg bg-destructive/20 p-3 text-sm">{error}</p>}

        {phase === "listening" && !closing && (
          <div className="mt-8 w-full space-y-3">
            <Textarea rows={4} className="bg-background text-foreground" placeholder="Answer with the mic or type..." value={answer} onChange={(e) => setAnswer(e.target.value)} />
            <div className="flex justify-center gap-3">
              <Button variant={mic ? "destructive" : "secondary"} onClick={toggleMic}>{mic ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}{mic ? "Stop mic" : "Speak"}</Button>
              <Button onClick={send} disabled={!answer.trim()}><Send className="mr-2 h-4 w-4" />Done answering</Button>
            </div>
          </div>
        )}
        {closing && phase !== "scoring" && <Button size="lg" className="mt-8" onClick={end}>See my results</Button>}

        <div className="mt-10 flex gap-3">
          <Button variant="secondary" size="icon" onClick={() => { setMuted(!muted); window.speechSynthesis?.cancel(); }} aria-label="Mute">{muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</Button>
          <Button variant="secondary" size="icon" onClick={() => setShowT(!showT)} aria-label="Transcript"><ScrollText className="h-4 w-4" /></Button>
          <Button variant="destructive" onClick={end} disabled={phase === "scoring"}><PhoneOff className="mr-2 h-4 w-4" />End interview</Button>
        </div>

        {showT && (
          <div className="mt-8 w-full space-y-3 rounded-xl bg-background/10 p-4 text-sm">
            {turns.map((t, i) => <p key={i}><strong>{t.speaker === "interviewer" ? d.prep!.interviewer.name : "You"}:</strong> {t.text}</p>)}
          </div>
        )}
      </div>
    </div>
  );
}
