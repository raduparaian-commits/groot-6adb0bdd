import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { loadDraft, newDraft, saveDraft } from "@/lib/prep";

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

function JdPage() {
  const nav = useNavigate();
  const [jd, setJd] = useState("");
  useEffect(() => {
    const d = loadDraft();
    if (!d.jobId) setJd(d.jd);
  }, []);
  const ok = jd.trim().length > 0;

  function remove() {
    if (jd.length > 200 && !confirm("Remove this job description?")) return;
    setJd("");
  }
  function next() {
    saveDraft({ ...newDraft(), jd });
    nav({ to: "/prepare/about" });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <Badge variant="outline" className="mb-4 border-primary/40 text-primary">Step 1 of 3</Badge>
      <h1 className="font-display text-4xl font-semibold tracking-tight">Tell us about the job</h1>
      <p className="mt-2 text-muted-foreground">Paste the full job description. Your interview adapts to every responsibility and skill in it.</p>
      <Textarea className="mt-8 min-h-[180px] max-h-[70vh] resize-none overflow-y-auto [field-sizing:content]" placeholder="Paste the complete job description here..." value={jd} onChange={(e) => setJd(e.target.value)} />
      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={remove} disabled={!jd}>Remove</Button>
        <Button size="lg" onClick={next} disabled={!ok}>Next</Button>
      </div>
    </div>
  );
}
