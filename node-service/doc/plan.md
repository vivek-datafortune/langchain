I want to set up a clean, production-ready backend architecture using Docker Compose with three services:

1) Node.js service (NestJS preferred) → main API + assistant brain
2) Python service → offline speech-to-text using Faster-Whisper
3) MongoDB → primary database

GOAL:
- Fully offline speech-to-text system
- Node acts as gateway/orchestrator
- Python handles only STT
- MongoDB stores patients, tests, sessions
- Designed to support future real-time streaming via WebSocket
- Clean microservice architecture
- No mixing runtimes in same container

====================================
SYSTEM ARCHITECTURE RULES
====================================

- Browser must ONLY talk to Node
- Node talks to:
    - MongoDB
    - Python Whisper service
- Python must not connect directly to MongoDB
- No child_process hacks
- No combining Python + Node in one container
- Whisper model must load once at startup
- System must work on CPU (no GPU required initially)

====================================
DOCKER COMPOSE SETUP
====================================

Create docker-compose.yml with:

Services:
- api (node service)
- whisper (python service)
- mongodb (official mongo image)

Requirements:
- Proper container names
- Shared Docker network
- Restart policies
- Environment variables
- Volume for MongoDB data persistence
- Expose:
    Node → 3000
    Whisper → 8000
    MongoDB → 27017

Node must connect to Mongo using:
    mongodb://mongodb:27017/medivoice

Node must call whisper using:
    http://whisper:8000/transcribe

====================================
PROJECT STRUCTURE
====================================

root/
 ├── docker-compose.yml
 ├── node-service/
 │    ├── Dockerfile
 │    ├── src/
 │    │    ├── speech/
 │    │    ├── patients/
 │    │    ├── assistant/
 │    │    └── main.ts
 │    └── package.json
 └── whisper-service/
      ├── Dockerfile
      ├── requirements.txt
      └── app/
           └── main.py

====================================
PYTHON SERVICE (Whisper)
====================================

- Use FastAPI
- Install:
    faster-whisper
    uvicorn
    ffmpeg
- Load Whisper small model globally at startup
- Do NOT reload per request
- Expose:

    POST /transcribe
    - Accept audio file (wav or webm)
    - Return:
        { "text": "transcribed text" }

- Add placeholder comment for future WebSocket streaming endpoint

====================================
NODE SERVICE (NestJS)
====================================

Modules:

1) SpeechModule
   - SpeechService
   - Calls whisper service using axios or fetch
   - Sends audio file
   - Returns transcript

2) PatientsModule
   - Patient schema
   - Fields:
        email
        mobile
        first_name
        last_name
        gender
        date_of_birth

3) TestsModule
   - Test schema based on:
        test_type
        patient_id
        clinic_id
        test_date
        height
        weight
        oxygen
        pulse
        temperature
        bp_systolic
        bp_diastolic
        bmi
        tc, tg, hdl, ldl
        hba1c
        result fields

4) AssistantModule
   - Handles session logic
   - Auth flow using mobile number
   - Placeholder for future wake word integration

Node must:
- Connect to MongoDB using mongoose
- Use environment variables for DB connection
- Abstract whisper call cleanly
- Return transcript via API endpoint:
      POST /assistant/transcribe

====================================
DOCKERFILES
====================================

Node Dockerfile:
- Use lightweight Node image
- Install dependencies
- Build Nest app
- Expose 3000

Python Dockerfile:
- Use python slim image
- Install ffmpeg
- Install requirements
- Expose 8000
- Run uvicorn

Mongo:
- Use official image
- Persist data using volume

====================================
IMPORTANT
====================================

- Keep everything minimal but clean
- Add comments explaining decisions
- Follow best practices
- Ensure model loads once
- Ensure services communicate via Docker service names
- Avoid unnecessary complexity
- Make it production-ready structure

Generate all required files with complete working content.