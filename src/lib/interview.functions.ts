import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AppSchema = z.object({
  target: z.string().max(200),
  kind: z.enum(["university", "job"]),
  role: z.string().max(200),
  values: z.array(z.string()).max(10),
  application: z.string().max(20000),
});

async function ai(messages: { role: string; content: string }[], json = false) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI is not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    if (res.status === 429) throw new Error("Too many requests — please wait a moment and try again.");
    if (res.status === 402) throw new Error("AI credits have run out.");
    throw new Error(`AI request failed [${res.status}]: ${await res.text()}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content as string;
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

export const getFeedback = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    AppSchema.extend({
      transcript: z.array(z.object({ q: z.string(), a: z.string().max(5000) })).max(10),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const content = await ai([
      {
        role: "system",
        content: `You are an interview coach for ${data.target} (${data.role}). Give concise, specific feedback in markdown-free plain text: an overall impression, 3 strengths, 3 things to improve, and a score out of 10. Judge against what ${data.target} values: ${data.values.join(", ")}.`,
      },
      {
        role: "user",
        content: `APPLICATION:\n${data.application}\n\nINTERVIEW:\n${data.transcript.map((t, i) => `Q${i + 1}: ${t.q}\nA: ${t.a}`).join("\n\n")}`,
      },
    ]);
    return { feedback: content };
  });
