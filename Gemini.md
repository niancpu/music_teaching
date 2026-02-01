# Project Overview: Music Teaching Platform

This project is a music teaching application consisting of a FastAPI backend and a Next.js frontend, with video generation capabilities using Remotion.

## Backend Services

The backend (`backend/`) is built with FastAPI and provides several specialized services:

### Core Services
- **Song Service** (`song_service.py`):
    - Manages song metadata and structure.
    - Loads data from `frontend/src/data/songs.json`.
- **Task Manager** (`task_manager.py`):
    - Manages asynchronous background tasks (specifically for video rendering).
    - Uses JSON files for persistence (`backend/data/tasks/`).
- **AI Service** (`ai_service.py`):
    - Interface for AI chat functionality (OpenAI compatible).
    - Acts as a music teaching assistant.

### Audio & Visualization
- **Audio Analysis Service** (`audio_analysis_service.py`):
    - Uses `librosa` to extract frame-by-frame RMS amplitude and Mel spectrogram data.
    - Used for driving visualizations.
- **Audio Feature Service** (`audio_feature_service.py`):
    - Extracts high-level musical features: Tempo (BPM), Key/Mode, Energy, Valence, MFCCs.
    - Used to generate prompts for AI image generation.
- **Render Service** (`render_service.py`):
    - Orchestrates video rendering using **Remotion**.
    - Prepares data, copies audio, and executes the Remotion CLI via subprocess.
    - Supports different visualization styles (Circular, Radial, Bars).
- **Image Generation Service** (`image_generation_service.py`):
    - Generates artwork based on musical features.
    - Supports OpenAI (DALL-E) and Google (Imagen) providers.
    - Automatically builds prompts based on audio mood/tempo.

### Educational Tools
- **PPT Service** (`ppt_service.py`):
    - Generates PowerPoint (`.pptx`) slides for teaching.
    - Includes score images, practice tips, and teacher notes from song metadata.
- **AudD Service** (`audd_service.py`):
    - Integration with AudD API for music recognition and genre/mood analysis.

## API Structure

Endpoints are versioned under `/api/v1`:
- `/health`: System health check.
- `/songs`: Song retrieval and filtering.
- `/audio`: Audio analysis endpoints.
- `/chat`: AI assistant chat interface.
- `/ppt`: PPT generation endpoints.
- `/visualization`: Video rendering task management.
- `/image-generation`: AI image generation from audio features.

## Frontend
The frontend (`frontend/`) is a Next.js application.
- Uses `remotion` for programmatic video creation.
- Stores static assets (audio, scores) in `public/`.
