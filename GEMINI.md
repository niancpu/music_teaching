# Music Teaching Platform - Project Context

## Project Overview
This project is a comprehensive music teaching platform designed to assist in music education through interactive score viewing, multi-track audio playback, AI-assisted tutoring, and automated teaching material generation (PPT).

The project appears to exist in two states:
1.  **Modern Architecture (Dockerized):** A separated Frontend (Next.js) and Backend (Flask API) orchestrated by Docker Compose.
2.  **Standalone Prototype:** A monolithic Flask application (`server.py`) that serves server-side rendered templates.

## Architecture & Tech Stack

### 1. Modern Stack (Recommended)
This is the production-ready architecture defined in `docker-compose.yml`.

*   **Frontend (`/frontend`):**
    *   **Framework:** Next.js 16 (React 19, TypeScript).
    *   **Styling:** Tailwind CSS.
    *   **Key Features:** Score viewing (`react-pdf`), audio playback.
*   **Backend (`/backend`):**
    *   **Framework:** Python Flask.
    *   **Key Features:**
        *   **PPT Generation:** Dynamic creation of PowerPoint slides from song metadata (`python-pptx`).
        *   **Audio Analysis:** Integration with AudD API for genre/mood detection.
        *   **API:** Serves song data and score file lists.
*   **Infrastructure:**
    *   **Nginx:** Reverse proxy handling traffic between frontend and backend.
    *   **Docker:** Containerization for all services.

### 2. Standalone Prototype (`server.py`)
A self-contained Flask application located at the root.

*   **Entry Point:** `server.py` (Port 5002).
*   **Templates:** `templates/` (HTML/Jinja2).
*   **Static Files:** `static/` (CSS/JS) and `assets/`.
*   **Key Features:**
    *   AI Chat integration (`/chat`) for music theory Q&A.
    *   Specific track pages (e.g., `/track/ode-to-joy`).
    *   Waveform visualization (`wavesurfer.js`).

## Key Directories

| Directory | Description |
| :--- | :--- |
| **`frontend/`** | Next.js source code, including pages, components, and public assets. |
| **`backend/`** | Flask API server source code, including `app.py` and `songs/` metadata. |
| **`assets/`** | Central storage for media files (MP3s, PDF scores, images). |
| **`templates/`** | HTML templates for the standalone `server.py` application. |
| **`static/`** | CSS and JS files for the standalone `server.py` application. |
| **`nginx/`** | Nginx configuration files. |
| **`动态乐谱/`** | Experimental or WIP folder for dynamic score generation. |

## Development & Usage

### Option A: Docker (Modern Stack)
The easiest way to run the full application.

```bash
# Build and start services
docker compose up --build -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```
*   **Access:** `http://localhost` (via Nginx).

### Option B: Manual Setup (Modern Stack)

**Backend:**
```bash
cd backend
python -m venv venv
# Activate venv (Windows: venv\Scripts\activate, Unix: source venv/bin/activate)
pip install -r requirements.txt
python app.py
```
*   **Port:** 5000

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
*   **Port:** 3000

### Option C: Standalone Prototype
To run the legacy/prototype version with server-side templates.

```bash
# Install root requirements
pip install -r requirement.txt

# Run server
python server.py
```
*   **Access:** `http://localhost:5002`

## Configuration

*   **Backend Environment Variables:**
    *   `AUDD_API_KEY`: API key for AudD music recognition (defaults set in `app.py` but should be overridden).
*   **AI Chat Configuration:**
    *   `config.py`: Contains settings for the AI model (`MODEL`, `BASE_URL`, `API_KEY`) used by `server.py`.
