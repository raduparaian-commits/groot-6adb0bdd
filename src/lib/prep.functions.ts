import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { aiJson } from "./ai.server";
import type { JdAnalysis, PlanItem, PrepInfo, Results, Turn } from "./prep";

const VOLUME: Record<number, string> = { 10: "2-4", 15: "3-5", 20: "4-6", 30: "6-8", 45: "8-11", 60: "10-14" };

const Config = z.object({
  jd: z.string().min(1).max(30000),
  duration: z.number().int().min(5).max(90),
  round: z.string().max(100),
  interviewers: z.array(z.string().max(60)).max(10),
  additional: z.string().max(4000),
  cv: z.string().max(20000),
});

export const buildInterview = createServerFn({ method: "POST" })
  .inputValidator((d) => Config.extend({ previousSignatures: z.array(z.string().max(300)).max(60) }).parse(d))
  .handler(async ({ data }) => {
    return aiJson<{ analysis: JdAnalysis; prep: PrepInfo; plan: PlanItem[] }>(
      `You design realistic mock interviews. Analyse the job description and build:
1) analysis: {title, company ("Unknown" if not stated), seniority, skills[], competencies[], themes[], summary (2 sentences)}
2) prep: {areas: 4-8 [{name, why}] the candidate is likely tested on, scenarios: 3-5 likely scenarios, questionStyles: 3-4 example question STYLES (not the actual questions), interviewer: {name (realistic first + last name), role (fits the interviewer type and company)}}
3) plan: ${VOLUME[data.duration] ?? "4-6"} hidden main question intentions [{competency, question_intent, difficulty, evidence_expected, possible_follow_up_intents[], question_signature (short unique summary)}] appropriate for the "${data.round}" round with ${data.interviewers.join(", ") || "an interviewer"}. Avoid intents similar to these previously asked signatures: ${JSON.stringify(data.previousSignatures)}.
Never invent facts about the candidate. JSON shape: {"analysis":{...},"prep":{...},"plan":[...]}`,
      `JOB DESCRIPTION:\n${data.jd}\n\nADDITIONAL INFO:\n${data.additional || "none"}\n\nCANDIDATE CV/BACKGROUND:\n${data.cv || "not provided"}`,
    );
  });

const TurnZ = z.object({ speaker: z.enum(["interviewer", "candidate"]), text: z.string().max(6000), followUp: z.boolean().optional() });
const Live = Config.extend({
  title: z.string().max(200), company: z.string().max(200),
  interviewer: z.object({ name: z.string().max(100), role: z.string().max(200) }),
  plan: z.array(z.any()).max(20),
  transcript: z.array(TurnZ).max(80),
  elapsedSec: z.number().min(0),
});

export const nextTurn = createServerFn({ method: "POST" })
  .inputValidator((d) => Live.parse(d))
  .handler(async ({ data }) => {
    const remaining = Math.max(0, data.duration * 60 - data.elapsedSec);
    return aiJson<{ say: string; followUp: boolean; done: boolean }>(
      `You are ${data.interviewer.name}, ${data.interviewer.role} at ${data.company}, running a ${data.round} interview for "${data.title}". Behave exactly like a real human interviewer speaking aloud:
- First turn: introduce yourself briefly and ask a round-appropriate opening question.
- One question at a time. Phrase plan intentions naturally; never read them robotically.
- After each answer decide: ask a natural follow-up (if vague, missing personal action or result) OR move to the next uncovered plan intention. Avoid interrogation; max 2 follow-ups per topic.
- Remember what the candidate said; never ask them to repeat evidence.
- NEVER coach, score, or hint at better answers.
- Time remaining: ${Math.round(remaining / 60)} min of ${data.duration}. When time is nearly up or the plan is covered, thank them, invite a quick question if time allows, and close professionally with done=true.
- Keep each utterance under 70 words, conversational.
HIDDEN PLAN: ${JSON.stringify(data.plan)}
JSON: {"say": string, "followUp": boolean, "done": boolean}`,
      `JOB DESCRIPTION (summary source):\n${data.jd.slice(0, 6000)}\n\nCANDIDATE BACKGROUND:\n${data.cv || "not provided"}\n\nCONVERSATION SO FAR:\n${data.transcript.map((t) => `${t.speaker === "interviewer" ? "INTERVIEWER" : "CANDIDATE"}: ${t.text}`).join("\n") || "(not started)"}`,
    );
  });

export const scoreInterview = createServerFn({ method: "POST" })
  .inputValidator((d) => Live.parse(d))
  .handler(async ({ data }) => {
    return aiJson<Results>(
      `You are a strict, fair interview assessor for "${data.title}" at ${data.company} (${data.round} round).
CRITICAL INTEGRITY RULE: never invent achievements, metrics, employers, tools, team sizes or outcomes. Use only the CV and the transcript. Where information is missing, the improved answer must use placeholders like "[Add your actual result]", "[Add the specific action YOU took]", "[Add the tool or system you actually used]".
Scoring categories 0-100: roleRelevance (25%), evidence (20%), structure STAR (20%), technical (15%), communication (10%), effectiveness (10%) — adjust slightly for the round. Do not penalise accents. Missing evidence reduces scores.
perQuestion: one entry per MAIN interviewer question (merge its follow-ups into the answer), with question, answer (the candidate's EXACT words from the transcript, verbatim, follow-ups joined with a space), score 0-100, feedback (2-3 sentences), mistakes (array of {quote, issue}: quote is an EXACT verbatim substring copied from answer that was a mistake — vague, filler, off-topic, missing result, unclear, inaccurate, weak phrasing; issue explains the problem in one short sentence; empty array if none), improved (a first-person improved answer using only confirmed facts + placeholders).
jdCoverage: key JD competencies with covered "strong"|"partial"|"missing".
nextAction: one sentence recommending what to practise next.
JSON: {"overallScore":n,"categories":{"roleRelevance":n,"evidence":n,"structure":n,"technical":n,"communication":n,"effectiveness":n},"didWell":[],"improve":[],"missed":[],"jdCoverage":[],"perQuestion":[],"nextAction":""}`,
      `JD:\n${data.jd.slice(0, 8000)}\n\nCV:\n${data.cv || "not provided"}\n\nPLAN:\n${JSON.stringify(data.plan)}\n\nTRANSCRIPT:\n${data.transcript.map((t: Turn) => `${t.speaker.toUpperCase()}: ${t.text}`).join("\n")}`,
    );
  });
