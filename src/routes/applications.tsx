import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, GraduationCap, Briefcase, PenLine, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/applications")({
  head: () => ({
    meta: [
      { title: "Mock Applications — Groot" },
      { name: "description", content: "Rehearse personal statements and cover letters shaped around your target university or job." },
      { property: "og:title", content: "Mock Applications — Groot" },
      { property: "og:description", content: "Rehearse personal statements and cover letters shaped around your target university or job." },
    ],
  }),
  component: ApplicationsPage,
});

type DraftType = "personal_statement" | "cover_letter" | "short_answer";

const PROMPTS: Record<DraftType, { label: string; hint: string; prompt: string }> = {
  personal_statement: {
    label: "Personal statement",
    hint: "For a university application",
    prompt: "Why have you chosen this course, and what makes you a strong fit?",
  },
  cover_letter: {
    label: "Cover letter",
    hint: "For a job application",
    prompt: "Why this company, and why should they choose you?",
  },
  short_answer: {
    label: "Short answer",
    hint: "Application form question",
    prompt: "Answer one specific question from your application form.",
  },
};

function ApplicationsPage() {
  const [draftType, setDraftType] = useState<DraftType>("personal_statement");
  const [target, setTarget] = useState("");
  const [details, setDetails] = useState("");
  const [draft, setDraft] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const active = PROMPTS[draftType];

  function submit() {
    setSubmitted(true);
  }

  function reset() {
    setSubmitted(false);
    setDraft("");
    setDetails("");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <Badge variant="outline" className="mb-4 border-primary/40 text-primary">
        <FileText className="mr-1 h-3.5 w-3.5" />
        Mock application
      </Badge>
      <h1 className="font-display text-4xl font-semibold tracking-tight">
        Rehearse the written part of your application
      </h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Draft statements, letters, and short answers — then get them reviewed
        against what your target actually looks for.
      </p>

      {!submitted ? (
        <Card className="mt-10">
          <CardHeader>
            <CardTitle className="font-display text-xl">What are you writing?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="mb-3 block text-sm font-medium">Type of document</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {(Object.keys(PROMPTS) as DraftType[]).map((key) => {
                  const item = PROMPTS[key]!;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setDraftType(key)}
                      className={`rounded-xl border p-4 text-left transition-colors ${
                        draftType === key
                          ? "border-primary bg-secondary/60"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">{item.hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target" className="text-sm font-medium">
                Where are you applying?
              </Label>
              <Input
                id="target"
                placeholder="e.g. Imperial College, Computing — or Stripe, Design Engineer"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="details" className="text-sm font-medium">
                Anything the reader should know about you
              </Label>
              <Textarea
                id="details"
                rows={4}
                placeholder="Your grades, experience, projects, motivation — whatever matters for this application"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <PenLine className="h-4 w-4 text-primary" />
                You'd answer: “{active.prompt}”
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                AI-drafted first versions and tailored feedback are coming soon —
                for now, write your own draft below.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="draft" className="text-sm font-medium">
                Your draft
              </Label>
              <Textarea
                id="draft"
                rows={8}
                placeholder="Start writing, or paste a draft you already have…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </div>

            <Button
              onClick={submit}
              size="lg"
              disabled={draft.trim().length === 0 || target.trim().length === 0}
            >
              Submit for review
            </Button>
            {draft.trim().length === 0 || target.trim().length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Add a target and at least a few words of draft to continue.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-10">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="font-display text-xl">Draft received</CardTitle>
            {target && (
              <Badge variant="secondary" className="max-w-[50%] truncate">
                {target}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your {active.label.toLowerCase()} for <span className="font-medium text-foreground">{target}</span> is
              saved. Tailored review, scoring, and AI-assisted rewrites are
              coming soon.
            </p>
            <div className="rounded-lg border border-border p-4">
              <p className="whitespace-pre-wrap text-sm">{draft}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset}>
                Write another draft
              </Button>
              <Button variant="ghost" disabled>
                <Download className="mr-2 h-4 w-4" />
                Export (coming soon)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="flex gap-3">
          <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold">For universities</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Personal statements and short answers tuned to each course's style and expectations.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Briefcase className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold">For jobs</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cover letters matched to the job ad — keywords, tone, and the story they want to hear.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
