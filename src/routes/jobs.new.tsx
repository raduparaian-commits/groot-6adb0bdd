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
  const ok = title.trim() && jd.trim();

  function save() {
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
        <div><label className="mb-2 block text-sm font-medium">Job title</label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Software Engineer Intern" /></div>
        <div><label className="mb-2 block text-sm font-medium">Company or university</label><Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Amazon" /></div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium">Job description</label>
        <Textarea className="min-h-[180px] max-h-[60vh] resize-none [field-sizing:content]" value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the full job description..." />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium">Your CV or background <span className="font-normal text-muted-foreground">(optional)</span></label>
        <Textarea rows={4} value={cv} onChange={(e) => setCv(e.target.value)} placeholder="You can also upload your CV when you start an interview." />
      </div>
      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => nav({ to: "/" })}>Cancel</Button>
        <Button size="lg" onClick={save} disabled={!ok}>Add job</Button>
      </div>
    </div>
  );
}
