import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, MicOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { APP_STORAGE_KEY, getPreset, type Preset, type SubmittedApplication } from "@/lib/presets";
import { generateQuestions, getFeedback, type Feedback } from "@/lib/interview.functions";

export const Route = createFileRoute("/interviews")({
  head: () => ({
    meta: [
      { title: "Mock Interview — Groot" },
      { name: "description", content: "An interview built from your own application, with scores and ideal answers for every question." },
      { property: "og:title", content: "Mock Interview — Groot" },
      { property: "og:description", content: "An interview built from your own application, with scores and ideal answers for every question." },
    ],
  }),
  component: InterviewPage,
});

function buildPayload(app: SubmittedApplication, preset: Preset) {
  const application = [
    `Name: ${app.name || "Candidate"}`,
    `${preset.roleLabel}: ${app.role}`,
    ...preset.questions.map((q) => `${q.label}\n${app.answers[q.id] || "(blank)"}`),
  ].join("\n\n");
  return { target: preset.name, kind: preset.kind, role: app.role, values: preset.values, application };
}

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

function InterviewPage() {
  const [app, setApp] = useState<SubmittedApplication | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [questions, setQuestions] = useState<string[] | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [scoring, setScoring] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);
  const genQ = useServerFn(generateQuestions);
  const genF = useServerFn(getFeedback);

  useEffect(() => {
    const raw = sessionStorage.getItem(APP_STORAGE_KEY);
    if (raw) setApp(JSON.parse(raw));
    setLoaded(true);
  }, []);

  const preset = app ? getPreset(app.presetId) : undefined;

  useEffect(() => {
    if (!app || !preset || questions) return;
    genQ({ data: buildPayload(app, preset) })
      .then((r) => {
        setQuestions(r.questions);
        setAnswers(r.questions.map(() => ""));
      })
      .catch((e) => setError(e.message));
  }, [app, preset]);

  useEffect(() => {
    if (questions?.[idx] && !feedback) speak(questions[idx]!);
  }, [questions, idx]);

  function toggleMic() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return setError("Voice answers aren't supported in this browser — type instead.");
    if (listening) { recRef.current?.stop(); return; }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    const start = answers[idx] ?? "";
    let said = "";
    rec.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) said += e.results[i][0].transcript + " ";
      setAnswers((a) => a.map((v, i) => (i === idx ? (start + " " + said).trim() : v)));
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  async function finish() {
    if (!app || !preset || !questions) return;
    recRef.current?.stop();
    window.speechSynthesis?.cancel();
    setScoring(true);
    try {
      const r = await genF({ data: { ...buildPayload(app, preset), transcript: questions.map((q, i) => ({ q, a: answers[i] ?? "" })) } });
      setFeedback(r);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setScoring(false);
    }
  }

  if (!loaded) return null;

  if (!app || !preset) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-semibold">Start with your application</h1>
        <p className="mt-3 text-muted-foreground">Your interview is built from what you write in your application.</p>
        <Button asChild size="lg" className="mt-8"><Link to="/applications">Start practicing</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <Badge variant="outline" className="mb-4 border-primary/40 text-primary">Step 2 of 2 · Interview</Badge>
      <h1 className="font-display text-4xl font-semibold tracking-tight">{preset.name} interview</h1>
      <p className="mt-2 text-muted-foreground">{app.role}</p>

      {error && <p className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      {!questions && !error && (
        <div className="mt-12 flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Reading your application and preparing questions…
        </div>
      )}

      {questions && !feedback && (
        <Card className="mt-8">
          <CardHeader>
            <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
              <span>Question {idx + 1} of {questions.length}</span>
              <button onClick={() => speak(questions[idx]!)} className="inline-flex items-center gap-1 hover:text-foreground">
                <Volume2 className="h-4 w-4" /> Replay
              </button>
            </div>
            <Progress value={((idx + 1) / questions.length) * 100} />
            <CardTitle className="font-display pt-4 text-2xl leading-snug">{questions[idx]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              rows={7}
              placeholder="Speak with the mic or type your answer…"
              value={answers[idx] ?? ""}
              onChange={(e) => setAnswers((a) => a.map((v, i) => (i === idx ? e.target.value : v)))}
            />
            <div className="flex flex-wrap gap-3">
              <Button variant={listening ? "destructive" : "outline"} onClick={toggleMic}>
                {listening ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                {listening ? "Stop" : "Answer by voice"}
              </Button>
              <div className="ml-auto flex gap-3">
                <Button variant="ghost" disabled={idx === 0} onClick={() => { recRef.current?.stop(); setIdx(idx - 1); }}>Back</Button>
                {idx < questions.length - 1 ? (
                  <Button onClick={() => { recRef.current?.stop(); setIdx(idx + 1); }}>Next question</Button>
                ) : (
                  <Button onClick={finish} disabled={scoring}>
                    {scoring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Finish & get scores
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {feedback && questions && (
        <div className="mt-8 space-y-6">
          <Card className="border-primary/40 bg-secondary/40">
            <CardContent className="flex items-start gap-6 p-6">
              <ScoreBadge score={feedback.overallScore} large />
              <div>
                <p className="font-display text-xl font-semibold">Overall</p>
                <p className="mt-1 text-muted-foreground">{feedback.overall}</p>
              </div>
            </CardContent>
          </Card>
          {questions.map((q, i) => {
            const f = feedback.perQuestion[i];
            if (!f) return null;
            return (
              <Card key={i}>
                <CardHeader className="flex-row items-start gap-4 space-y-0">
                  <ScoreBadge score={f.score} />
                  <CardTitle className="font-display text-lg leading-snug">Q{i + 1}. {q}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What could improve</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                      {f.improvements.map((m, j) => <li key={j}>{m}</li>)}
                    </ul>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-border bg-muted/40 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your answer</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm">{answers[i] || "(no answer)"}</p>
                    </div>
                    <div className="rounded-xl border border-primary/40 bg-secondary/40 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Revised ideal answer</p>
                        <button onClick={() => speak(f.ideal)} className="text-muted-foreground hover:text-foreground" aria-label="Listen">
                          <Volume2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm">{f.ideal}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          <Button asChild size="lg"><Link to="/applications">Practice again</Link></Button>
        </div>
      )}
    </div>
  );
}

function ScoreBadge({ score, large }: { score: number; large?: boolean }) {
  const tone = score >= 8 ? "bg-primary text-primary-foreground" : score >= 5 ? "bg-accent text-accent-foreground" : "bg-destructive text-destructive-foreground";
  return (
    <span className={`flex shrink-0 flex-col items-center justify-center rounded-xl font-display font-semibold ${tone} ${large ? "h-20 w-20 text-3xl" : "h-12 w-12 text-lg"}`}>
      {score}
      <span className="text-[10px] font-normal opacity-80">/10</span>
    </span>
  );
}
