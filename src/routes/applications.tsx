import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap, Briefcase, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PRESETS, APP_STORAGE_KEY, type Preset, type SubmittedApplication } from "@/lib/presets";

export const Route = createFileRoute("/applications")({
  head: () => ({
    meta: [
      { title: "Mock Application — Groot" },
      { name: "description", content: "Fill in a mock application tailored to Oxford, Southampton, Amazon or Tesco, then get interviewed on it." },
      { property: "og:title", content: "Mock Application — Groot" },
      { property: "og:description", content: "Fill in a mock application tailored to Oxford, Southampton, Amazon or Tesco, then get interviewed on it." },
    ],
  }),
  component: ApplicationsPage,
});

function ApplicationsPage() {
  const [preset, setPreset] = useState<Preset | null>(null);

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      {!preset ? (
        <>
          <Badge variant="outline" className="mb-4 border-primary/40 text-primary">Step 1 of 2 · Application</Badge>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Where are you applying?</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Pick a target. Your application form and interview adapt to what they look for.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPreset(p)}
                className="group rounded-2xl border border-border bg-card p-6 text-left transition-colors hover:border-primary hover:bg-secondary/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                    {p.kind === "university" ? <GraduationCap className="h-5 w-5" /> : <Briefcase className="h-5 w-5" />}
                  </span>
                  <div>
                    <p className="font-display text-lg font-semibold">{p.name}</p>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{p.kind}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{p.tagline}</p>
              </button>
            ))}
          </div>
        </>
      ) : (
        <ApplicationForm preset={preset} onBack={() => setPreset(null)} />
      )}
    </div>
  );
}

function ApplicationForm({ preset, onBack }: { preset: Preset; onBack: () => void }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const filled = preset.questions.filter((q) => (answers[q.id] ?? "").trim().length > 0).length;
  const ready = role.trim() && filled >= Math.min(3, preset.questions.length);

  function submit() {
    const app: SubmittedApplication = { presetId: preset.id, name, role, answers };
    sessionStorage.setItem(APP_STORAGE_KEY, JSON.stringify(app));
    navigate({ to: "/interviews" });
  }

  return (
    <>
      <button onClick={onBack} className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Change target
      </button>
      <Badge variant="outline" className="mb-4 border-primary/40 text-primary">Step 1 of 2 · Application</Badge>
      <h1 className="font-display text-4xl font-semibold tracking-tight">{preset.name} application</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {preset.values.map((v) => (
          <Badge key={v} variant="secondary"><Check className="mr-1 h-3 w-3" />{v}</Badge>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="font-display text-xl">Your details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sam Patel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">{preset.roleLabel}</Label>
              <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder={preset.rolePlaceholder} />
            </div>
          </div>
          {preset.questions.map((q) => (
            <div key={q.id} className="space-y-2">
              <Label htmlFor={q.id}>{q.label}</Label>
              <p className="text-xs text-muted-foreground">{q.hint}</p>
              <Textarea
                id={q.id}
                rows={q.rows ?? 4}
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
              />
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-4">
            <Button size="lg" onClick={submit} disabled={!ready}>Submit for review</Button>
            <p className="text-xs text-muted-foreground">
              {ready ? "Next: a mock interview based on what you wrote." : `Add your ${preset.roleLabel.toLowerCase()} and answer at least 3 sections.`}
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
