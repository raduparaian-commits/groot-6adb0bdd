import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sprout,
  Mic,
  FileText,
  Target,
  ArrowRight,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div>
      {/* Hero */}
      <section className="bark-line border-b border-border/70">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <Badge variant="outline" className="mb-6 border-primary/40 text-primary">
            <Sprout className="mr-1 h-3.5 w-3.5" />
            Practice that grows with you
          </Badge>
          <h1 className="max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            Mock interviews and applications that{" "}
            <span className="text-primary">adapt to your university or job</span>.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Tell Groot which university or role you're aiming for. It tailors
            practice questions, feedback, and application coaching to exactly
            that — no generic prep.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/interviews">
                Start a mock interview
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/applications">Practice an application</Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4" /> University admissions practice
            </span>
            <span className="flex items-center gap-1.5">
              <Briefcase className="h-4 w-4" /> Job interview & application coaching
            </span>
          </div>
        </div>
      </section>

      {/* What you can practice */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="font-display text-3xl font-semibold tracking-tight">
          Two ways to practice
        </h2>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Every session adapts to the specific university, course, or company
          you choose — from question style to what they actually ask about.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Card className="group transition-shadow hover:shadow-md">
            <CardContent className="p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <Mic className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-2xl font-semibold">Mock Interviews</h3>
              <p className="mt-3 text-muted-foreground">
                Talk through questions picked for your target role or program.
                Practice spoken answers and get feedback on what to sharpen.
              </p>
              <Button asChild variant="ghost" className="mt-6 -ml-4 px-4">
                <Link to="/interviews">
                  Try an interview <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group transition-shadow hover:shadow-md">
            <CardContent className="p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <FileText className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-2xl font-semibold">Mock Applications</h3>
              <p className="mt-3 text-muted-foreground">
                Rehearse personal statements, cover letters, and application
                answers shaped around the university or job you're applying to.
              </p>
              <Button asChild variant="ghost" className="mt-6 -ml-4 px-4">
                <Link to="/applications">
                  Try an application <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it adapts */}
      <section className="border-y border-border/70 bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-10 md:grid-cols-3">
            {[
              {
                icon: Target,
                title: "Pick your target",
                body: "Name the university, course, or company — Groot builds its question bank around what they actually ask.",
              },
              {
                icon: Mic,
                title: "Practice out loud",
                body: "Speak your answers in a realistic interview flow, with follow-up questions that react to what you say.",
              },
              {
                icon: FileText,
                title: "Get tailored feedback",
                body: "Every round ends with notes tied to your specific target — not generic interview advice.",
              },
            ].map((step) => (
              <div key={step.title}>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <step.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="rounded-2xl bg-primary px-8 py-14 text-center text-primary-foreground">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to practice for your target?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-primary-foreground/80">
            Pick a university or a job and Groot does the rest.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-8">
            <Link to="/interviews">
              Start now <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
