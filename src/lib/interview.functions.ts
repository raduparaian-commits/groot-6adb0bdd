import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AppSchema = z.object({
  target: z.string().max(200),
  kind: z.enum(["university", "job"]),
  role: z.string().max(200),
  values: z.array(z.string()).max(10),
  application: z.string().max(20000),
});

async function ai(messages: { role: string; content: string }[]) {
  const key = process.env['LOVABLE_API_KEY'];
  if (!key) throw new Error("AI is not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Lovable-API-Key": key, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      input: messages,
      stream: true,
      store: false,
      reasoning: { effort: "low", summary: "auto" },
    }),
  });
  if (!res.ok || !res.body) {
    if (res.status === 429) throw new Error("Too many requests — please wait a moment and try again.");
    if (res.status === 402) throw new Error("AI credits have run out.");
    throw new Error(`AI request failed [${res.status}]: ${await res.text()}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const ev = JSON.parse(payload);
        if (ev.type === "response.output_text.delta") out += ev.delta;
        if (ev.type === "error" || ev.type === "response.failed")
          throw new Error(ev.error?.message ?? ev.response?.error?.message ?? "AI failed");
      } catch (e) {
        if (e instanceof Error && !(e instanceof SyntaxError)) throw e;
      }
    }
  }
  if (!out.trim()) throw new Error("AI returned an empty response");
  return out;
}

export const generateQuestions = createServerFn({ method: "POST" })
  .inputValidator((d) => AppSchema.parse(d))
  .handler(async ({ data }) => {
    const content = await ai(
      [
        {
          role: "system",
          content: `You are a realistic ${data.kind === "university" ? "admissions tutor" : "hiring manager"} at ${data.target} interviewing for: ${data.role}. They value: ${data.values.join(", ")}. Write 6 interview questions that probe specifically the experiences, claims and interests in the candidate's application below. Reference their own words. Mix in one or two questions that test fit with ${data.target}'s style. Return JSON: {"questions": string[]}.`,
        },
        { role: "user", content: data.application },
      ],
      true,
    );
    const parsed = JSON.parse(content) as { questions: string[] };
    return { questions: parsed.questions.slice(0, 8) };
  });

export interface QuestionFeedback {
  score: number;
  improvements: string[];
  ideal: string;
}
export interface Feedback {
  overall: string;
  overallScore: number;
  perQuestion: QuestionFeedback[];
}

export const getFeedback = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    AppSchema.extend({
      transcript: z.array(z.object({ q: z.string(), a: z.string().max(5000) })).max(10),
    }).parse(d),
  )
  .handler(async ({ data }): Promise<Feedback> => {
    const content = await ai([
      {
        role: "system",
        content: `You are an interview coach for ${data.target} (${data.role}). Judge against what ${data.target} values: ${data.values.join(", ")}. For EACH answer give: a score 1-10, 2-4 short specific improvement notes, and an "ideal" revised answer (a natural spoken response of 90-160 words, written in first person, built only from facts in the candidate's application and answer). Also an overall summary (2-3 sentences) and overallScore 1-10. Return ONLY JSON: {"overall": string, "overallScore": number, "perQuestion": [{"score": number, "improvements": string[], "ideal": string}]} with perQuestion in the same order as the questions.`,
      },
      {
        role: "user",
        content: `APPLICATION:\n${data.application}\n\nINTERVIEW:\n${data.transcript.map((t, i) => `Q${i + 1}: ${t.q}\nA: ${t.a || "(no answer)"}`).join("\n\n")}`,
      },
    ]);
    const m = content.match(/\{[\s\S]*\}/);
    return JSON.parse(m ? m[0] : content) as Feedback;
  });
