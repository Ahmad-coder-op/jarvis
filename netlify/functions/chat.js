// Netlify serverless function: proxies chat requests to Groq's API.
//
// Why this exists: the browser can never hold a secret API key (anyone can
// open DevTools and read it out of the bundled JS), so the key lives here,
// in an environment variable, and only this server-side function ever sends
// it to Groq. The frontend calls this function instead of calling Groq
// directly.
//
// Required setup: in the Netlify dashboard, go to
// Site configuration -> Environment variables -> Add a variable
// named GROQ_API_KEY with your key from https://console.groq.com/keys

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Groq model IDs currently on the free/pay-as-you-go tier (Aug 2026).
// "smart" gives better answers; "fast" is quicker and cheaper.
// "search" is Groq's compound system, which can browse the web on its own.
const MODELS = {
  smart: "openai/gpt-oss-120b",
  fast: "openai/gpt-oss-20b",
  search: "groq/compound",
};

exports.handler = async function (event) {
  // CORS / preflight support, harmless even for same-origin calls.
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed. Use POST." }),
    };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error:
          "GROQ_API_KEY is not set on the server. Add it in Netlify: Site configuration -> Environment variables.",
      }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Request body must be valid JSON." }),
    };
  }

  const { messages, mode } = payload;

  if (!Array.isArray(messages) || messages.length === 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "`messages` must be a non-empty array." }),
    };
  }

  const model = MODELS[mode] || MODELS.smart;

  try {
    const groqResponse = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        stream: false,
      }),
    });

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      return {
        statusCode: groqResponse.status,
        headers,
        body: JSON.stringify({
          error: data?.error?.message || "Groq API returned an error.",
        }),
      };
    }

    const content = data?.choices?.[0]?.message?.content || "";

    if (!content.trim()) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: "Groq returned an empty response." }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ content, model }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error?.message || "Failed to reach the Groq API.",
      }),
    };
  }
};
