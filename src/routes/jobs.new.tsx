import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createJob } from "@/lib/prep";

export const Route = createFileRoute("/jobs/new")({
  head: () => ({
    meta: [
      { title: "Add a job — Groot" },
      { name: "description", content: "Add a job or university place you're applying for and practise interviews for it." },
      { property: "og:title", content: "Add a job — Groot" },
      { property: "og:description", content: "Add a job or university place you're applying for and practise interviews for it." },
    ],
  }),
  component: NewJob,
});

function NewJob() {
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jd, setJd] = useState("");
  const [cv, setCv] = useState("");
  const [tried, setTried] = useState(false);
  const bad = (v: string) => tried && !v.trim();
  const err = <p className="mt-1 text-sm text-destructive">You must fill in this field.</p>;
  const red = "border-destructive ring-2 ring-destructive/30";

  function save() {
    setTried(true);
    if (!title.trim() || !jd.trim()) return;
    const id = createJob({ title: title.trim(), company: company.trim() || "—", jd, cv });
    nav({ to: "/jobs/$id", params: { id } });
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-14 sm:px-6">
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Add a job</h1>
        <p className="mt-2 text-muted-foreground">Once it's added, start interviews from inside the job and track your progress there.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="mb-2 block text-sm font-medium">Job title</label><Input aria-invalid={bad(title)} className={bad(title) ? red : ""} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Software Engineer Intern" />{bad(title) && err}</div>
        <div><label className="mb-2 block text-sm font-medium">Company or university</label><Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Amazon" /></div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium">Job description</label>
        <Textarea aria-invalid={bad(jd)} className={`min-h-[180px] max-h-[60vh] resize-none [field-sizing:content] ${bad(jd) ? red : ""}`} value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the full job description..." />
        {bad(jd) && err}
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium">Your CV or background <span className="font-normal text-muted-foreground">(optional)</span></label>
        <Textarea rows={4} value={cv} onChange={(e) => setCv(e.target.value)} placeholder="You can also upload your CV when you start an interview." />
      </div>
      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => nav({ to: "/" })}>Cancel</Button>
        <Button size="lg" onClick={save}>Add job</Button>
      </div>
    </div>
  );
}
