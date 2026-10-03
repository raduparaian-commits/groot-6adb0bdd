import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mic, MicOff, GraduationCap, Briefcase, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/interviews")({
  head: () => ({
    meta: [
      { title: "Mock Interviews — Groot" },
      { name: "description", content: "Practice spoken interviews tailored to your target university or job." },
      { property: "og:title", content: "Mock Interviews — Groot" },
      { property: "og:description", content: "Practice spoken interviews tailored to your target university or job." },
    ],
  }),
  component: InterviewsPage,
});

type Mode = "university" | "job";

const DEMO_QUESTIONS: Record<Mode, string[]> = {
  university: [
    "Why have you chosen this particular course at this university?",
    "Tell me about a book, project, or idea that shaped how you think.",
    "What would you contribute to the community here?",
    "Describe a challenge you faced and how you handled it.",
  ],
  job: [
    "Walk me through your experience with this kind of work.",
    "Tell me about a time you disagreed with your team — what happened?",
    "Why this company, and why now?",
    "Describe a project you led from start to finish.",
  ],
};

function InterviewsPage() {
  const [mode, setMode] = useState<Mode>("university");
  const [target, setTarget] = useState("");
  const [started, setStarted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [micOn, setMicOn] = useState(false);

  const questions = DEMO_QUESTIONS[mode];
  const question = questions[questionIndex] ?? questions[0]!;
  const isLast = questionIndex === questions.length - 1;

  function start() {
    setStarted(true);
    setQuestionIndex(0);
    setAnswers([]);
    setAnswer("");
  }

  function submitAnswer() {
    const next = [...answers, answer];
    setAnswers(next);
    setAnswer("");
    if (isLast) {
      setStarted(false);
    } else {
      setQuestionIndex((i) => i + 1);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <Badge variant="outline" className="mb-4 border-primary/40 text-primary">
        <Mic className="mr-1 h-3.5 w-3.5" />
        Mock interview
      </Badge>
      <h1 className="font-display text-4xl font-semibold tracking-tight">
        Practice the interview before the interview
      </h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Choose your target and work through questions shaped around it.
      </p>

      {!started && answers.length === 0 && (
        <Card className="mt-10">
          <CardHeader>
            <CardTitle className="font-display text-xl">Set up your session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="mb-3 block text-sm font-medium">What are you interviewing for?</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setMode("university")}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                    mode === "university"
                      ? "border-primary bg-secondary/60"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <span>
                    <span className="block text-sm font-semibold">University</span>
                    <span className="block text-xs text-muted-foreground">Admissions interview</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("job")}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                    mode === "job"
                      ? "border-primary bg-secondary/60"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <Briefcase className="h-5 w-5 text-primary" />
                  <span>
                    <span className="block text-sm font-semibold">Job</span>
                    <span className="block text-xs text-muted-foreground">Role interview</span>
                  </span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target" className="text-sm font-medium">
                {mode === "university" ? "University / course" : "Company / role"}
              </Label>
              <Input
                id="target"
                placeholder={
                  mode === "university"
                    ? "e.g. Oxford, Medicine — or paste a course link"
                    : "e.g. Graduate Software Engineer at Monzo — or paste a job ad"
                }
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The more specific you are, the more tailored the practice.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-3">
                {micOn ? (
                  <Mic className="h-5 w-5 text-primary" />
                ) : (
                  <MicOff className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-semibold">Voice practice</p>
                  <p className="text-xs text-muted-foreground">
                    Speak your answers — AI voice coming soon
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMicOn((v) => !v)}
                aria-pressed={micOn}
              >
                {micOn ? "On" : "Off"}
              </Button>
            </div>

            <Button onClick={start} size="lg" className="w-full sm:w-auto">
              <Sparkles className="mr-2 h-4 w-4" />
              Start interview
            </Button>
          </CardContent>
        </Card>
      )}

      {started && (
        <Card className="mt-10">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="font-display text-lg">
              Question {questionIndex + 1} of {questions.length}
            </CardTitle>
            {target && (
              <Badge variant="secondary" className="max-w-[50%] truncate">
                {target}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-display text-xl leading-relaxed">{question}</p>
            <Textarea
              placeholder="Type your answer — or use voice mode once it's live"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={6}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStarted(false)}>
                End session
              </Button>
              <Button onClick={submitAnswer} disabled={answer.trim().length === 0}>
                {isLast ? "Finish" : "Next question"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!started && answers.length > 0 && (
        <Card className="mt-10">
          <CardHeader>
            <CardTitle className="font-display text-xl">Session complete</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You answered {answers.length} questions{target ? ` for ${target}` : ""}.
              Feedback and scoring are coming soon.
            </p>
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={q} className="rounded-lg border border-border p-4">
                  <p className="text-sm font-semibold">{q}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                    {answers[i] || "—"}
                  </p>
                </div>
              ))}
            </div>
            <Button onClick={() => { setAnswers([]); setQuestionIndex(0); }}>
              New session
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
