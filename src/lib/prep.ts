// Shared types, options and browser storage for the interview prep flow.
export const DURATIONS = [10, 15, 20, 30, 45, 60] as const;
export const ROUNDS = [
  "Recruiter / Screening", "HR Interview", "First Round", "Second Round", "Hiring Manager",
  "Behavioural / Competency", "Technical", "Final Round", "Panel", "Other",
];
export const INTERVIEWERS = [
  "Recruiter", "HR", "Hiring Manager", "Technical Interviewer", "Technical Manager",
  "Department Manager", "Senior Leadership", "Panel", "Stakeholder / Client", "Not Sure",
];
export const REAL_STATUSES = ["Preparing", "Scheduled", "Waiting for outcome", "Passed", "Rejected", "Offer"] as const;
export type RealStatus = (typeof REAL_STATUSES)[number];

export interface JdAnalysis {
  title: string; company: string; seniority: string;
  skills: string[]; competencies: string[]; themes: string[]; summary: string;
}
export interface PlanItem {
  competency: string; question_intent: string; difficulty: string;
  evidence_expected: string; possible_follow_up_intents: string[]; question_signature: string;
}
export interface PrepInfo {
  areas: { name: string; why: string }[]; scenarios: string[]; questionStyles: string[];
  interviewer: { name: string; role: string };
}
export interface Turn { speaker: "interviewer" | "candidate"; text: string; followUp?: boolean | undefined }
export interface Results {
  overallScore: number;
  categories: { roleRelevance: number; evidence: number; structure: number; technical: number; communication: number; effectiveness: number };
  didWell: string[]; improve: string[]; missed: string[];
  jdCoverage: { competency: string; covered: "strong" | "partial" | "missing" }[];
  perQuestion: { question: string; answer: string; score: number; feedback: string; improved: string }[];
  nextAction: string;
}
export interface Draft {
  jobId?: string | undefined; roundId?: string | undefined;
  jd: string; duration: number; round: string; roundOther: string;
  interviewers: string[]; additional: string; cv: string; scheduledDate?: string | undefined;
  analysis?: JdAnalysis | undefined; prep?: PrepInfo | undefined; plan?: PlanItem[] | undefined;
  transcript?: Turn[] | undefined; durationSec?: number | undefined; results?: Results | undefined;
}
export interface Attempt { id: string; date: string; score: number; results: Results; signatures: string[] }
export interface Round {
  id: string; name: string; interviewers: string[]; duration: number; additional: string;
  realStatus: RealStatus; attempts: Attempt[]; scheduledDate?: string | undefined;
}
export interface Job {
  id: string; title: string; company: string; jd: string; analysis: JdAnalysis; cv: string;
  createdAt: string; updatedAt: string; rounds: Round[];
}

const DRAFT_KEY = "groot.draft";
const TRACKER_KEY = "groot.tracker";

export const newDraft = (): Draft => ({
  jd: "", duration: 20, round: "First Round", roundOther: "", interviewers: ["Hiring Manager"], additional: "", cv: "",
});
export function loadDraft(): Draft {
  try { return { ...newDraft(), ...JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "{}") }; } catch { return newDraft(); }
}
export function saveDraft(d: Draft) { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d)); }

export function loadJobs(): Job[] {
  try { return JSON.parse(localStorage.getItem(TRACKER_KEY) || "[]"); } catch { return []; }
}
export function saveJobs(j: Job[]) { localStorage.setItem(TRACKER_KEY, JSON.stringify(j)); }
export function getJob(id: string) { return loadJobs().find((j) => j.id === id); }
export function updateJob(id: string, fn: (j: Job) => Job) {
  saveJobs(loadJobs().map((j) => (j.id === id ? { ...fn(j), updatedAt: new Date().toISOString() } : j)));
}
export const roundName = (d: Pick<Draft, "round" | "roundOther">) => (d.round === "Other" ? d.roundOther || "Other" : d.round);
export const uid = () => Math.random().toString(36).slice(2, 10);

/** Interviewer personas — name gender matches the ElevenLabs voice. */
export interface Persona { name: string; voiceId: string; gender: "male" | "female" }
export const PERSONAS: Persona[] = [
  { name: "James Whitfield", voiceId: "JBFqnCBsd6RMkjVDRZzb", gender: "male" },   // George
  { name: "Sarah Bennett", voiceId: "EXAVITQu4vr4xnSDxMaL", gender: "female" },    // Sarah
  { name: "Arthur Hale", voiceId: "CwhRBWXzGAHq8TQ4Fs17", gender: "male" },        // Roger
  { name: "Emily Carson", voiceId: "9BWtsMINqrJLrRacOk9x", gender: "female" },     // Aria
];

/** Signatures of questions already asked for this job — used to avoid repetition on retry. */
export function previousSignatures(jobId?: string): string[] {
  const j = jobId ? getJob(jobId) : undefined;
  return j ? j.rounds.flatMap((r) => r.attempts.flatMap((a) => a.signatures)).slice(-40) : [];
}

/** Automatically create/update the tracker after a completed mock interview. Returns job id. */
export function recordAttempt(d: Draft): string {
  if (!d.results || !d.analysis) return d.jobId ?? "";
  const jobs = loadJobs();
  const now = new Date().toISOString();
  let job = d.jobId ? jobs.find((j) => j.id === d.jobId) : jobs.find((j) => j.jd.trim() === d.jd.trim());
  if (!job) {
    job = { id: uid(), title: d.analysis.title, company: d.analysis.company, jd: d.jd, analysis: d.analysis, cv: d.cv, createdAt: now, updatedAt: now, rounds: [] };
    jobs.unshift(job);
  }
  const name = roundName(d);
  let round = job.rounds.find((r) => r.id === d.roundId) ?? job.rounds.find((r) => r.name === name);
  if (!round) {
    round = { id: uid(), name, interviewers: d.interviewers, duration: d.duration, additional: d.additional, realStatus: "Preparing", attempts: [], scheduledDate: d.scheduledDate || undefined };
    job.rounds.push(round);
  }
  if (d.scheduledDate) round.scheduledDate = d.scheduledDate;
  round.attempts.push({ id: uid(), date: now, score: d.results.overallScore, results: d.results, signatures: (d.plan ?? []).map((p) => p.question_signature) });
  job.updatedAt = now;
  saveJobs(jobs);
  return job.id;
}

export function progressFor(round: Round): number {
  const n = round.attempts.length;
  if (!n) return 0;
  const best = Math.max(...round.attempts.map((a) => a.score));
  return Math.min(100, Math.round(Math.min(n, 3) * 15 + best * 0.55));
}
