# JARVIS Pro AI — Groq Edition

A polished React AI chat app powered by **Groq's free AI API** through a
Netlify serverless function. The Jarvis visual identity, animated orb,
background grid, voice controls, Urdu/English switch, copy/read-aloud tools,
and responsive layout are all preserved.

## What changed from the Puter.js version

- Removed the Puter.js browser SDK entirely — no more visitor sign-in popups.
- Added `netlify/functions/chat.js`, a serverless function that calls Groq's
  `chat/completions` API using a secret API key stored in an environment
  variable. Visitors never see or need an API key.
- The frontend now calls `/.netlify/functions/chat` instead of `puter.ai.chat()`.
- Defaults to `openai/gpt-oss-120b` (Groq's flagship open model). Toggling
  "Web search" in the UI switches to `groq/compound`, which can browse the
  web on its own.
- Since this uses a simple request/response call (not a token stream), the
  reply is revealed with a lightweight typewriter effect on the client so it
  still feels alive.

## One-time setup: get a free Groq API key

1. Go to <https://console.groq.com/keys> and sign up (no credit card needed).
2. Create an API key and copy it.

## Netlify deployment

Build settings:
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions` (already set in `netlify.toml`)

**Required environment variable** — in the Netlify dashboard, go to:
`Site configuration -> Environment variables -> Add a variable`

| Key            | Value                          |
| -------------- | ------------------------------ |
| `GROQ_API_KEY` | your key from console.groq.com |

After adding the variable, trigger a new deploy (env vars only take effect on
the next build). Then visit your site — no sign-in, no popups, it just works.

## Local development

```bash
npm install
```

The chat function needs an environment variable, so use the Netlify CLI
instead of plain Vite for local testing:

```bash
npm install -g netlify-cli   # one-time
cp .env.example .env         # then paste your GROQ_API_KEY into .env
netlify dev
```

`netlify dev` runs the Vite frontend **and** the serverless function together
and loads `.env` automatically. Plain `npm run dev` will start the UI but the
chat function won't be reachable, since Vite alone doesn't run Netlify
functions.

## Files of interest

- `src/App.jsx` — chat UI and logic; calls `/.netlify/functions/chat`.
- `netlify/functions/chat.js` — the serverless proxy that talks to Groq and
  keeps `GROQ_API_KEY` secret.
- `.env.example` — template for local development.
