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
        │  Frontend (Port 3000)│  │ Backend (Port 5000)│
        │  Next.js + React    │  │ Flask + Python    │
        └─────────────────────┘  └───────────────────┘
```

- **Frontend:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4
- **Backend:** Flask 2.3, Python 3.11, python-pptx
- **Infrastructure:** Docker Compose, Nginx

## Build & Run Commands

### Development

```bash
# Frontend
cd frontend
npm install
npm run dev          # localhost:3000

# Backend
cd backend
pip install -r requirements.txt
python app.py        # localhost:5000
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

## Key Components

### Frontend (`frontend/src/`)

- **`app/page.tsx`** - Home page with hero section and library preview
- **`app/library/page.tsx`** - Audio library with search/filter functionality
- **`app/songs/[slug]/page.tsx`** - Dynamic song detail pages (statically generated)
- **`components/AudioPlayer.tsx`** - Main audio player with:
  - Multi-track playback with individual volume controls
  - External performance listening via Web Audio API (microphone input detection)
  - RMS audio level analysis with hysteresis-based state management
- **`components/ScoreViewer.tsx`** - Modal PDF score viewer
- **`data/songs.json`** - Static song metadata

### Backend (`backend/`)

- **`app.py`** - Flask application with endpoints:
  - `POST /api/analyze` - Audio analysis via AudD API
  - `POST /api/generate_ppt` - PowerPoint generation from song metadata
  - `GET /api/scores` - List available score files
  - `GET /api/health` - Health check

## Data Model

Songs are defined in `frontend/src/data/songs.json` with this structure:

```typescript
interface Song {
  slug: string;           // URL identifier
  title: string;
  composer: string;
  category: 'classical' | 'folk';
  totalAudio: string;     // Path to full mix
  totalScore?: string;    // Path to full score PDF
  tracks: Track[];        // Individual instrument tracks
}
```

## Nginx Routing

- `/api/*` → Backend (Flask) on port 5000
- `/*` → Frontend (Next.js) on port 3000

## Environment Variables

- `AUDD_API_KEY` - Audio analysis API key
- `API_KEY` - AI chat API key (in config.py)
- `BASE_URL` - AI API endpoint
- `MODEL` - AI model name

## Asset Locations

- Audio files: `frontend/public/audio/`
- Score PDFs: `frontend/public/scores/`
- Song metadata: `backend/songs/`
