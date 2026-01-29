# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Music Teaching Audio Community Platform (音乐教师音频社区) - A web platform for music teachers to access teaching audio resources, view musical scores, and manage orchestral track playback with external performance listening capabilities.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    NGINX (Port 80)                          │
│              (Reverse Proxy & Load Balancer)                │
└──────────────────┬──────────────────┬──────────────────────┘
                   │                  │
        ┌──────────▼──────────┐  ┌────▼──────────────┐
        │  Frontend (Port 3000)│  │ Backend (Port 8000)│
        │  Next.js + React    │  │ FastAPI + Python  │
        └─────────────────────┘  └───────────────────┘
```

- **Frontend:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4
- **Backend:** FastAPI, Python 3.11, uvicorn, python-pptx
- **Infrastructure:** Docker Compose, Nginx

## Build & Run Commands

### Development

```bash
# Frontend
cd frontend
npm install
npm run dev          # localhost:3000

# Backend (FastAPI)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Production (Docker)

```bash
docker-compose up --build    # Runs all services on port 80
```

### Frontend Only

```bash
cd frontend
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check
```

## Backend Structure

The backend uses a modular FastAPI architecture under `backend/app/`:

```
backend/app/
├── main.py              # FastAPI app factory
├── config.py            # Settings via pydantic-settings
├── api/v1/
│   ├── router.py        # Aggregates all endpoint routers
│   └── endpoints/       # Route handlers (health, songs, audio, chat, ppt)
├── core/
│   ├── security.py      # CORS setup
│   └── exceptions.py    # Exception handlers
├── schemas/             # Pydantic models (song, audio, chat, ppt)
└── services/            # Business logic (song_service, audd_service, ai_service, ppt_service)
```

API docs available at `/api/docs` (Swagger) and `/api/redoc`.

Note: `backend/app.py` is a legacy Flask version kept for reference.

## Key Frontend Components

- **`components/AudioPlayer.tsx`** - Multi-track player with:
  - Synchronized playback across all tracks
  - Individual volume controls per track
  - External performance listening via Web Audio API (microphone detection)
  - RMS audio level analysis with hysteresis-based state management (START_THRESHOLD=0.02, STOP_THRESHOLD=0.015, HYSTERESIS_MS=600)
- **`components/ScoreViewer.tsx`** - Modal PDF score viewer using react-pdf
- **`app/songs/[slug]/page.tsx`** - Dynamic song detail pages (statically generated)

## Data Model

Songs are defined in `frontend/src/data/songs.json`:

```typescript
interface Song {
  slug: string;           // URL identifier
  title: string;
  composer: string;
  category: 'classical' | 'folk';
  totalAudio: string;     // Path to full mix
  totalScore?: string;    // Path to full score PDF
  tracks: Track[];        // Individual instrument tracks with section grouping
}
```

## Nginx Routing

- `/api/*` → Backend (FastAPI) on port 8000
- `/*` → Frontend (Next.js) on port 3000

## Environment Variables

Copy `backend/.env.example` to `backend/.env`:

- `AUDD_API_KEY` - Audio analysis API key
- `AI_API_KEY` - AI chat API key
- `AI_BASE_URL` - AI API endpoint
- `AI_MODEL` - AI model name
- `CORS_ORIGINS` - Allowed CORS origins (JSON array)

## Asset Locations

- Audio files: `frontend/public/audio/`
- Score PDFs: `frontend/public/scores/`
- Song metadata: `backend/songs/`
