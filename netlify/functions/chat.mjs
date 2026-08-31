import OpenAI from "openai";

const openai = new OpenAI();
const MODEL = "gpt-5.2";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body, status = 200) {
  return Response.json(body, { status, headers });
}

export default async function handler(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed. Use POST." }, 405);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }

  const { messages, mode } = payload;
  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: "`messages` must be a non-empty array." }, 400);
  }

  const input = messages
    .filter(
      (message) =>
        message &&
        ["system", "user", "assistant"].includes(message.role) &&
        typeof message.content === "string" &&
        message.content.trim(),
    )
    .slice(-21)
    .map(({ role, content }) => ({ role, content }));

  if (!input.length || !input.some((message) => message.role === "user")) {
    return json({ error: "A valid user message is required." }, 400);
  }

  try {
    const response = await openai.responses.create({
      model: MODEL,
      input,
      ...(mode === "search" ? { tools: [{ type: "web_search" }] } : {}),
    });

    const content = response.output_text?.trim();
    if (!content) {
      return json({ error: "The AI service returned an empty response." }, 502);
    }

    return json({ content, model: MODEL });
  } catch (error) {
    console.error("Chat request failed", {
      name: error?.name,
      status: error?.status,
    });
    return json({ error: "The AI service is temporarily unavailable. Please try again." }, 502);
  }
}
