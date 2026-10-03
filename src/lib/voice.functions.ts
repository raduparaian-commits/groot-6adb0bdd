import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const API = "https://api.elevenlabs.io/v1/convai";
const AGENT_NAME = "Groot Interviewer";
const VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"; // George — calm, professional
let cachedAgentId: string | null = null;

function key() {
  const k = process.env.ELEVENLABS_API_KEY;
  if (!k) throw new Error("ElevenLabs is not connected to this project");
  return k;
}

async function el(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, { ...init, headers: { "xi-api-key": key(), "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (!res.ok) {
    const body = await res.text();
    console.error(`ElevenLabs ${path} failed [${res.status}]: ${body}`);
    throw new Error(`ElevenLabs request failed [${res.status}]: ${body.slice(0, 300)}`);
  }
  return res.json();
}

async function getAgentId(): Promise<string> {
  if (cachedAgentId) return cachedAgentId;
  const list = await el(`/agents?search=${encodeURIComponent(AGENT_NAME)}&page_size=10`);
  const found = (list.agents ?? []).find((a: any) => a.name === AGENT_NAME);
  if (found) return (cachedAgentId = found.agent_id as string);
  const created = await el(`/agents/create`, {
    method: "POST",
    body: JSON.stringify({
      name: AGENT_NAME,
      conversation_config: {
        agent: { first_message: "Hello, thanks for joining today.", language: "en", prompt: { prompt: "You are a professional interviewer." } },
        tts: { voice_id: VOICE_ID, model_id: "eleven_turbo_v2" },
        conversation: { max_duration_seconds: 3900 },
      },
      platform_settings: {
        overrides: { conversation_config_override: { agent: { prompt: { prompt: true }, first_message: true } } },
      },
    }),
  });
  return (cachedAgentId = created.agent_id as string);
}

const Input = z.object({
  jd: z.string().max(30000), duration: z.number().int().min(5).max(90), round: z.string().max(100),
  interviewers: z.array(z.string().max(60)).max(10), additional: z.string().max(4000), cv: z.string().max(20000),
  title: z.string().max(200), company: z.string().max(200),
  interviewer: z.object({ name: z.string().max(100), role: z.string().max(200) }),
  plan: z.array(z.any()).max(20),
});

export const startVoiceInterview = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }) => {
    const agentId = await getAgentId();
    const { token } = await el(`/conversation/token?agent_id=${agentId}`);
    const company = data.company && data.company !== "Unknown" ? data.company : "the organisation";
    const prompt = `You are ${data.interviewer.name}, ${data.interviewer.role} at ${company}, conducting a live spoken "${data.round}" interview for the position of ${data.title}. Interview length: about ${data.duration} minutes. Interviewer type: ${data.interviewers.join(", ") || "not specified"}.

HOW TO BEHAVE
- Act exactly like a real, professional human interviewer. Speak naturally, concisely, one question at a time (1-3 sentences per turn).
- Personalise: reference specific experiences, projects, achievements and skills the candidate actually wrote in their CV/background below. Never invent facts about them.
- Listen to each answer. Ask natural follow-ups that build on what they just said; probe vague answers ("Can you give me a specific example?", "What was your personal contribution?", "What was the result?").
- Remember everything said earlier in this conversation and build on it. Never repeat a question already asked.
- Move on when you have enough evidence. Cover the hidden plan below roughly in order, adapting to the conversation; do not read it out verbatim.
- Manage time: wrap up near ${data.duration} minutes, invite the candidate's questions briefly, then thank them and close professionally.
- NEVER give coaching, scores, corrections, hints or feedback during the interview. Neutral acknowledgements only ("Thank you", "Understood").
- Do not mention that you are an AI or that this is a mock.

HIDDEN INTERVIEW PLAN (question intentions):
${JSON.stringify(data.plan)}

JOB DESCRIPTION:
${data.jd.slice(0, 12000)}

ADDITIONAL INFO:
${data.additional || "none"}

CANDIDATE CV / APPLICATION:
${data.cv || "not provided — ask about their background instead"}`;
    const firstMessage = `Hello, I'm ${data.interviewer.name}, ${data.interviewer.role}. Thanks for making the time today. To start us off, could you briefly introduce yourself and tell me what attracted you to this ${data.title} role?`;
    return { token, prompt, firstMessage };
  });
