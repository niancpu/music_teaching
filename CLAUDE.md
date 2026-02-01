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
                                         │
                   ┌─────────────────────┼─────────────────────┐
                   │                     │                     │
           ┌───────▼───────┐     ┌───────▼───────┐     ┌───────▼───────┐
           │ Redis + Celery│     │   Remotion    │     │   librosa     │
           │ (Image Tasks) │     │ (Video Render)│     │(Audio Analysis)│
           └───────────────┘     └───────────────┘     └───────────────┘
```

- **Frontend:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4
- **Backend:** FastAPI, Python 3.11, uvicorn, Celery, librosa
- **Remotion:** React-based video rendering with Three.js for 3D visualizations
- **Infrastructure:** Docker Compose, Nginx, Redis

## Build & Run Commands

### Development

```bash
# Frontend
cd frontend && npm install && npm run dev    # localhost:3000

# Backend (FastAPI)
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Celery Worker (required for image generation)
cd backend && celery -A app.celery_app worker --loglevel=info

# Remotion Studio (for visualization development)
cd remotion && npm install && npm run start

# Redis (required for Celery)
redis-server
```

### Production (Docker)

```bash
docker-compose up --build    # Runs all services on port 80
```

### Linting

```bash
cd frontend && npm run lint  # ESLint check
```

## Remotion Module

The `remotion/` directory contains video composition components for music visualization:

```
remotion/
├── src/
│   ├── Root.tsx                    # Composition registry
│   ├── compositions/
│   │   ├── CircularWaveform.tsx    # Circular audio visualization
│   │   ├── RadialWaveform.tsx      # Radial bars visualization
│   │   ├── BarWaveform.tsx         # Horizontal bars visualization
│   │   └── ParticleBreathing.tsx   # 3D particle system (Three.js)
│   └── types/audio-data.ts         # Audio analysis data types
└── public/
    ├── audio/                      # Audio files (copied from frontend)
    └── data/                       # Analysis JSON files (generated)
```

**Visualization Workflow:**
1. Frontend submits render request → `POST /api/v1/visualization/render`
2. Backend analyzes audio with librosa → saves JSON to `remotion/public/data/`
3. Backend invokes Remotion CLI → `npx remotion render <Composition>`
4. Video saved to `frontend/public/videos/` → returned via download endpoint

**Adding New Visualizations:**
1. Create composition in `remotion/src/compositions/`
2. Register in `remotion/src/Root.tsx`
3. Add style mapping in `backend/app/services/render_service.py` (composition_map)
4. Add option in `frontend/src/components/VisualizationGenerator.tsx`

## Backend Structure

The backend uses a modular FastAPI architecture under `backend/app/`:

- `main.py` - FastAPI app factory
- `config.py` - Settings via pydantic-settings
- `api/v1/endpoints/` - Route handlers
- `services/` - Business logic (render_service.py orchestrates Remotion)
- `tasks/` - Celery async tasks

API docs: `/api/docs` (Swagger), `/api/redoc`

### Async Task Processing

**Image Generation** (Celery + Redis):
- `POST /api/v1/image-generation/generate` → returns task_id
- `GET /api/v1/image-generation/status/{task_id}` → poll for results

**Visualization Rendering** (BackgroundTasks):
- `POST /api/v1/visualization/render` → returns task_id
- `GET /api/v1/visualization/status/{task_id}` → check status
- `GET /api/v1/visualization/download/{task_id}` → download video

## Frontend API Client

The frontend uses a typed API client layer in `frontend/src/lib/api/`:

- `client.ts` - Fetch wrapper with `APIResponse<T>` handling and `APIError` class
- `endpoints/` - Domain-specific API functions (songs, chat, visualization, etc.)
- `hooks/` - React hooks for data fetching (useSongs, useChat)

## Key Frontend Components

- **`AudioPlayer.tsx`** - Multi-track synchronized playback with microphone detection (RMS analysis, hysteresis thresholds)
- **`VisualizationGenerator.tsx`** - Video generation UI with style/resolution selection
- **`ImageGenerator.tsx`** - Audio-to-image generation with style presets
- **`ScoreViewer.tsx`** - PDF viewer using react-pdf
- **`VoiceChat.tsx`** - Voice conversation interface

## Data Model

Songs defined in `frontend/src/data/songs.json`:

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

## Environment Variables

Copy `backend/.env.example` to `backend/.env`:

- `CORS_ORIGINS` - Allowed origins (JSON array)
- `REDIS_URL` - Redis connection for Celery
- `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` - AI chat service
- `AUDD_API_KEY` - Audio analysis API
- `IMAGE_API_PROVIDER` - "openai" or "google"
- `OPENAI_IMAGE_*` / `GOOGLE_IMAGE_*` - Image generation config

## Asset Locations

- Audio: `frontend/public/audio/`
- Scores: `frontend/public/scores/`
- Generated videos: `frontend/public/videos/`
- Song metadata: `frontend/src/data/songs.json`
