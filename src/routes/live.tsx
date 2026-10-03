import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, MicOff, PhoneOff, RefreshCw, ScrollText, Send, Video, VideoOff, Volume2, VolumeX } from "lucide-react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PERSONAS, loadDraft, recordAttempt, roundName, saveDraft, type Draft, type Turn } from "@/lib/prep";
import { scoreInterview } from "@/lib/prep.functions";
import { startVoiceInterview } from "@/lib/voice.functions";
import jamesImg from "@/assets/personas/james.jpg";
import sarahImg from "@/assets/personas/sarah.jpg";
import arthurImg from "@/assets/personas/arthur.jpg";
import emilyImg from "@/assets/personas/emily.jpg";

const PERSONA_IMAGES = [jamesImg, sarahImg, arthurImg, emilyImg];

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
  const [personaIdx, setPersonaIdx] = useState(0);
  const personaRef = useRef(0);
  const [camOn, setCamOn] = useState(false);
  const [aiVideo, setAiVideo] = useState(false);
  const camStreamRef = useRef<MediaStream | null>(null);
  const camVideoRef = useRef<HTMLVideoElement>(null);
  const startRef = useRef(Date.now());
  const endingRef = useRef(false);
  const startedRef = useRef(false);

  const persona = PERSONAS[personaIdx];
  const personaImg = PERSONA_IMAGES[personaIdx];

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
    return () => { clearInterval(t); stopCam(); try { convo.endSession(); } catch {} };
  }, []);

  useEffect(() => { if (d && !startedRef.current) { startedRef.current = true; connect(d); } }, [d]);

  async function connect(dr: Draft) {
    setError(null);
    setPhase("connecting");
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const p = PERSONAS[personaRef.current];
      const s = await startVoice({ data: {
        jd: dr.jd, duration: dr.duration, round: roundName(dr), interviewers: dr.interviewers, additional: dr.additional, cv: dr.cv,
        title: dr.analysis!.title, company: dr.analysis!.company, interviewer: dr.prep!.interviewer, personaName: p.name, plan: dr.plan!,
      } });
      convo.startSession({
        conversationToken: s.token,
        connectionType: "webrtc",
        overrides: { agent: { prompt: { prompt: s.prompt }, firstMessage: s.firstMessage }, tts: { voiceId: p.voiceId } },
      });
    } catch (e: any) {
      setError(e?.name === "NotAllowedError" ? "Microphone access is needed for the voice interview." : e.message);
      setPhase("error");
    }
  }

  function cyclePersona() {
    const next = (personaIdx + 1) % PERSONAS.length;
    setPersonaIdx(next);
    personaRef.current = next;
    // If a session is live, reconnect so the new voice and name take effect.
    if (d && (phase === "listening" || phase === "speaking" || phase === "thinking")) {
      try { convo.endSession(); } catch {}
      connect(d);
    }
  }

  function stopCam() {
    camStreamRef.current?.getTracks().forEach((t) => t.stop());
    camStreamRef.current = null;
  }

  async function toggleCam() {
    if (camOn) { stopCam(); setCamOn(false); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      camStreamRef.current = stream;
      setCamOn(true);
      requestAnimationFrame(() => { if (camVideoRef.current) camVideoRef.current.srcObject = stream; });
    } catch {
      setError("Camera access is needed to show your video.");
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
    stopCam();
    try { convo.endSession(); } catch {}
    const final = turnsRef.current;
    if (!final.some((t) => t.speaker === "candidate")) { nav({ to: "/" }); return; }
    setPhase("scoring");
    try {
      const results = await score({ data: {
        jd: d.jd, duration: d.duration, round: roundName(d), interviewers: d.interviewers, additional: d.additional, cv: d.cv,
        title: d.analysis!.title, company: d.analysis!.company, interviewer: { ...d.prep!.interviewer, name: persona.name }, plan: d.plan!,
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
  const initials = persona.name.split(" ").map((w) => w[0]).join("").slice(0, 2);
  const label = { connecting: "Connecting...", thinking: "Thinking...", speaking: "Speaking...", listening: micOff ? "Mic muted" : "Listening...", error: "Connection error", ended: "Interview ended", scoring: "Preparing your feedback..." }[phase];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface text-surface-foreground">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-10">
        <div className="flex w-full items-center justify-between text-sm text-surface-foreground/70">
          <span>{d.analysis?.title} · {roundName(d)}</span>
          <span className="font-mono tabular-nums">{mm}:{ss} / {d.duration}:00</span>
        </div>

        <div className={`mt-12 flex items-start justify-center gap-6 ${camOn ? "flex-wrap" : ""}`}>
          {/* Interviewer: avatar or video persona */}
          <div className="flex flex-col items-center">
            {aiVideo ? (
              <div className="relative overflow-hidden rounded-2xl border-2 border-primary/40 shadow-lg">
                <img src={personaImg} alt={persona.name} width={1024} height={1024}
                  className={`h-56 w-56 object-cover transition-transform duration-300 ${phase === "speaking" ? "animate-[talk_0.6s_ease-in-out_infinite]" : ""}`} />
                {phase === "speaking" && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-primary/30 to-transparent" />
                )}
                <span className="absolute bottom-2 left-2 rounded-full bg-background/70 px-2 py-0.5 text-xs text-foreground">Live</span>
              </div>
            ) : (
              <div className="relative">
                <div className={`absolute inset-0 rounded-full bg-primary/40 ${phase === "speaking" ? "animate-ping" : ""}`} />
                <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-primary font-display text-5xl text-primary-foreground">{initials}</div>
              </div>
            )}
            <p className="font-display mt-6 text-2xl">{persona.name}</p>
            <p className="text-sm text-surface-foreground/70">{d.prep.interviewer.role}</p>
            <button type="button" onClick={cyclePersona}
              className="mt-2 flex items-center gap-1.5 rounded-full border border-surface-foreground/20 px-3 py-1 text-xs text-surface-foreground/70 transition hover:border-primary hover:text-primary">
              <RefreshCw className="h-3 w-3" /> Change interviewer
            </button>
          </div>

          {/* Candidate camera */}
          {camOn && (
            <div className="flex flex-col items-center">
              <div className="relative overflow-hidden rounded-2xl border-2 border-surface-foreground/20 shadow-lg">
                <video ref={camVideoRef} autoPlay muted playsInline className="h-56 w-56 object-cover" />
                <span className="absolute bottom-2 left-2 rounded-full bg-background/70 px-2 py-0.5 text-xs text-foreground">You</span>
              </div>
              <p className="font-display mt-6 text-2xl">You</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex h-10 items-end gap-1" aria-hidden>
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} className={`w-1.5 rounded-full bg-primary ${phase === "speaking" || mic ? "animate-pulse" : ""}`}
              style={{ height: phase === "speaking" || mic ? `${20 + ((i * 37) % 80)}%` : "15%", animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
        <p className="mt-3 flex items-center gap-2 text-sm">{(phase === "thinking" || phase === "scoring" || phase === "connecting") && <Loader2 className="h-4 w-4 animate-spin" />}{label}</p>

        {muted && current && <p className="mt-6 rounded-xl bg-background/10 p-4 text-center">{current.text}</p>}
        {error && <p className="mt-4 rounded-lg bg-destructive/20 p-3 text-sm">{error}</p>}

        {phase === "error" && <Button className="mt-6" onClick={() => connect(d)}>Try connecting again</Button>}
        {(phase === "listening" || phase === "thinking" || phase === "speaking") && (
          <div className="mt-8 w-full space-y-3">
            <Textarea rows={4} className="bg-background text-foreground" placeholder="Just speak — or type an answer here..." value={answer} onChange={(e) => setAnswer(e.target.value)} />
            <div className="flex justify-center gap-3">
              <Button variant={micOff ? "destructive" : "secondary"} onClick={toggleMic}>{micOff ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}{micOff ? "Unmute mic" : "Mute mic"}</Button>
              <Button onClick={send} disabled={!answer.trim()}><Send className="mr-2 h-4 w-4" />Send typed answer</Button>
            </div>
          </div>
        )}
        {closing && <Button size="lg" className="mt-8" onClick={end}>See my results</Button>}

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button variant="secondary" size="icon" onClick={() => { setMuted(!muted); }} aria-label="Mute">{muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</Button>
          <Button variant="secondary" size="icon" onClick={() => setShowT(!showT)} aria-label="Transcript"><ScrollText className="h-4 w-4" /></Button>
          <Button variant={camOn ? "default" : "secondary"} onClick={toggleCam}>
            {camOn ? <VideoOff className="mr-2 h-4 w-4" /> : <Video className="mr-2 h-4 w-4" />}{camOn ? "Stop my video" : "My video"}
          </Button>
          <Button variant={aiVideo ? "default" : "secondary"} onClick={() => setAiVideo(!aiVideo)}>
            {aiVideo ? <VideoOff className="mr-2 h-4 w-4" /> : <Video className="mr-2 h-4 w-4" />}{aiVideo ? "Hide interviewer video" : "Interviewer video"}
          </Button>
          <Button variant="destructive" onClick={end} disabled={phase === "scoring"}><PhoneOff className="mr-2 h-4 w-4" />End interview</Button>
        </div>

        {showT && (
          <div className="mt-8 w-full space-y-3 rounded-xl bg-background/10 p-4 text-sm">
            {turns.map((t, i) => <p key={i}><strong>{t.speaker === "interviewer" ? persona.name : "You"}:</strong> {t.text}</p>)}
          </div>
        )}
      </div>
    </div>
  );
}
