# Vaani Learn

Voice-first language practice for students — powered by **Gnani Prisma STT** and **Timbre TTS**.

> Practice speaking. Hear feedback. Get better.

Built for the **Great Indian AI Internship Challenge** (Gnani AI).

## Features

- Lesson library (English + Hindi topics)
- Speak drills with microphone capture
- **Gnani Prisma** speech-to-text transcription
- Score + feedback against model answers
- **Gnani Timbre** text-to-speech for model answers
- Progress history (local)

## Stack

| Layer | Tech |
|--------|------|
| Frontend | Vite + React + React Router |
| Deploy | Vercel |
| STT | Gnani Prisma (`POST /stt/v3`) |
| TTS | Gnani Timbre (`/api/v1/tts/inference`) |
| API | Vercel Serverless (`/api/stt`, `/api/tts`) |

## Local setup

```bash
npm install
cp .env.example .env
# set GNANI_API_KEY in .env
npm run dev
```

## Vercel deploy

1. Import this repo in [Vercel](https://vercel.com/new)
2. Framework: **Vite**
3. Add env var: `GNANI_API_KEY` = your Gnani key
4. Deploy

Suggested project name / subdomain: **vaani-learn**

## Env

| Variable | Where | Purpose |
|----------|--------|---------|
| `GNANI_API_KEY` | Vercel / `.env` | Gnani `X-API-Key-ID` for STT & TTS |

Never commit the real key.

## Demo flow

1. Open the app → **Lessons**
2. Open a lesson → **Speak** on a drill
3. **Hear model answer** (Timbre TTS)
4. **Start speaking** → stop → Prisma transcript + score

## License

MIT — for hackathon / learning use.
