# JARVIS Pro AI

A polished React AI chat app powered by **Netlify AI Gateway** through a
Netlify Function. The Jarvis visual identity, animated orb,
background grid, voice controls, Urdu/English switch, copy/read-aloud tools,
and responsive layout are all preserved.

## Chat architecture

- `netlify/functions/chat.mjs` runs on Netlify's modern Functions runtime and
  calls OpenAI through Netlify AI Gateway.
- The frontend calls `/.netlify/functions/chat`; credentials remain on the
  server and are injected automatically by Netlify.
- Toggling "Web search" enables the model's web search tool.
- Since this uses a simple request/response call (not a token stream), the
  reply is revealed with a lightweight typewriter effect on the client so it
  still feels alive.

## Netlify deployment

Build settings:
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions` (already set in `netlify.toml`)

No provider API key is required. Netlify AI Gateway injects server-side
credentials automatically on supported credit-based plans.

## Local development

```bash
npm install
```

Use the Netlify CLI instead of plain Vite for local testing so the frontend
and function run together:

```bash
netlify dev
```

`netlify dev` runs the Vite frontend **and** the serverless function together
and loads `.env` automatically. Plain `npm run dev` will start the UI but the
chat function won't be reachable, since Vite alone doesn't run Netlify
functions.

## Files of interest

- `src/App.jsx` — chat UI and logic; calls `/.netlify/functions/chat`.
- `netlify/functions/chat.mjs` — the serverless AI Gateway function.
