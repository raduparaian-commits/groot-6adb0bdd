import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, MicOff, PhoneOff, ScrollText, Send, Volume2, VolumeX } from "lucide-react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { loadDraft, recordAttempt, roundName, saveDraft, type Draft, type Turn } from "@/lib/prep";
import { scoreInterview } from "@/lib/prep.functions";
import { startVoiceInterview } from "@/lib/voice.functions";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Live interview — Groot" },
      { name: "description", content: "A live, adaptive AI interview that listens and follows up like a real interviewer." },
      { property: "og:title", content: "Live interview — Groot" },
      { property: "og:description", content: "A live, adaptive AI interview that listens and follows up like a real interviewer." },
    ],
  }),
  component: () => <ConversationProvider><LivePage /></ConversationProvider>,
});

type Phase = "connecting" | "thinking" | "speaking" | "listening" | "error" | "ended" | "scoring";

function LivePage() {
  const nav = useNavigate();
  const startVoice = useServerFn(startVoiceInterview);
  const score = useServerFn(scoreInterview);
  const [d, setD] = useState<Draft | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const turnsRef = useRef<Turn[]>([]);
  const [phase, setPhase] = useState<Phase>("connecting");
  const [answer, setAnswer] = useState("");
  const [muted, setMuted] = useState(false);
  const [micOff, setMicOff] = useState(false);
  const [showT, setShowT] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const startRef = useRef(Date.now());
  const endingRef = useRef(false);
  const startedRef = useRef(false);

  const addTurn = (t: Turn) => { turnsRef.current = [...turnsRef.current, t]; setTurns(turnsRef.current); };

  const convo = useConversation({
    micMuted: micOff,
    volume: muted ? 0 : 1,
    onMessage: (m) => {
      const text = m.message?.trim();
      if (!text) return;
      if (m.role === "agent" || m.source === "ai") addTurn({ speaker: "interviewer", text });
      else { addTurn({ speaker: "candidate", text }); setPhase((p) => (p === "listening" ? "thinking" : p)); }
    },
    onModeChange: ({ mode }) => { if (!endingRef.current) setPhase(mode === "speaking" ? "speaking" : "listening"); },
    onConnect: () => { startRef.current = Date.now(); setPhase("listening"); },
    onDisconnect: () => { if (!endingRef.current) setPhase("ended"); },
    onError: (msg) => { setError(typeof msg === "string" ? msg : "Connection error"); setPhase("error"); },
  });

  useEffect(() => {
    const dr = loadDraft();
    if (!dr.plan || !dr.prep) { nav({ to: "/prepare" }); return; }
    setD(dr);
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => { clearInterval(t); try { convo.endSession(); } catch {} };
  }, []);

  useEffect(() => { if (d && !startedRef.current) { startedRef.current = true; connect(d); } }, [d]);

  async function connect(dr: Draft) {
    setError(null);
    setPhase("connecting");
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const s = await startVoice({ data: {
        jd: dr.jd, duration: dr.duration, round: roundName(dr), interviewers: dr.interviewers, additional: dr.additional, cv: dr.cv,
        title: dr.analysis!.title, company: dr.analysis!.company, interviewer: dr.prep!.interviewer, plan: dr.plan!,
      } });
      convo.startSession({
        conversationToken: s.token,
        connectionType: "webrtc",
        overrides: { agent: { prompt: { prompt: s.prompt }, firstMessage: s.firstMessage } },
      });
    } catch (e: any) {
      setError(e?.name === "NotAllowedError" ? "Microphone access is needed for the voice interview." : e.message);
      setPhase("error");
    }
  }

  // Auto-wrap if the interview runs well past the planned time
  useEffect(() => { if (d && elapsed > d.duration * 60 + 120 && phase !== "scoring" && phase !== "ended") { endingRef.current = true; try { convo.endSession(); } catch {} setPhase("ended"); } }, [elapsed]);

  function send() {
    const text = answer.trim();
    if (!text) return;
    convo.sendUserMessage(text);
    addTurn({ speaker: "candidate", text });
    setAnswer("");
    setPhase("thinking");
  }

  async function end() {
    if (!d) return;
    endingRef.current = true;
    try { convo.endSession(); } catch {}
    const final = turnsRef.current;
    if (!final.some((t) => t.speaker === "candidate")) { nav({ to: "/" }); return; }
    setPhase("scoring");
    try {
      const results = await score({ data: {
        jd: d.jd, duration: d.duration, round: roundName(d), interviewers: d.interviewers, additional: d.additional, cv: d.cv,
        title: d.analysis!.title, company: d.analysis!.company, interviewer: d.prep!.interviewer, plan: d.plan!,
        transcript: final.slice(-80), elapsedSec: elapsed,
      } });
      const done: Draft = { ...d, transcript: final, durationSec: elapsed, results };
      const jobId = recordAttempt(done);
      saveDraft({ ...done, jobId });
      nav({ to: "/results" });
    } catch (e: any) {
      setError(e.message);
      setPhase("ended");
    }
  }
  const closing = phase === "ended";
  const mic = !micOff && phase === "listening";
  const toggleMic = () => setMicOff(!micOff);

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
