# Deployment Guide

This application handles data using a SQLite database file (`server/deepsea.db`). For production deployment on cloud platforms, you **MUST** configure a persistent volume to store this file, otherwise all user data will be lost every time the server restarts.

## Option 1: Render (Recommended for simplicity)

1.  Push your code to a GitHub repository.
2.  Create a new **Web Service** on Render.
3.  Connect your repository.
4.  **Runtime**: Docker
5.  **Environment Variables**:
    - `GEMINI_API_KEY`: Your Gemini API Key
6.  **Advanced - Disks (Persistent Storage)**:
    - Click "Add Disk".
    - **Name**: `sqlite-data`
    - **Mount Path**: `/app/server`
    - **Size**: 1GB (sufficient for this app)
    *Note: Render Disks are a paid feature.*
    
    *Alternative without paid disk*: You will lose data on restart.

## Option 2: Fly.io

1.  Install `flyctl`.
2.  Login: `fly auth login`.
3.  Initialize: `fly launch` (do not deploy yet).
4.  Create a volume: `fly volumes create slot_data --size 1`.
5.  Edit `fly.toml` to mount the volume:
    ```toml
    [mounts]
    source = "slot_data"
    destination = "/app/server"
    ```
6.  Deploy: `fly deploy`.

## Option 3: VPS / Docker Compose

1.  Copy the project to your server.
2.  Build: `docker build -t slot-game .`
3.  Run: `docker run -d -p 3001:3001 -v $(pwd)/server:/app/server slot-game`

## Notes
- The application runs on port `3001` internally.
- Use the `GEMINI_API_KEY` environment variable for AI features.
