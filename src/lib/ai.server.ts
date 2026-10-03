export async function ai(system: string, user: string): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Lovable-API-Key": key, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      input: [{ role: "system", content: system }, { role: "user", content: user }],
      stream: true, store: false,
      reasoning: { effort: "low", summary: "auto" },
    }),
  });
  if (!res.ok || !res.body) {
    if (res.status === 429) throw new Error("Too many requests. Please wait a moment and try again.");
    if (res.status === 402) throw new Error("AI credits have run out.");
    throw new Error(`AI request failed [${res.status}]: ${await res.text()}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "", out = "";
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
      let ev: any;
      try { ev = JSON.parse(payload); } catch { continue; }
      if (ev.type === "response.output_text.delta") out += ev.delta;
      if (ev.type === "error" || ev.type === "response.failed")
        throw new Error(ev.error?.message ?? ev.response?.error?.message ?? "AI failed");
    }
  }
  if (!out.trim()) throw new Error("AI returned an empty response");
  return out;
}

export async function aiJson<T>(system: string, user: string): Promise<T> {
  const content = await ai(system + "\nReturn ONLY valid JSON, no prose.", user);
  const m = content.match(/\{[\s\S]*\}/);
  return JSON.parse(m ? m[0] : content) as T;
}
