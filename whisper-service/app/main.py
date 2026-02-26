import io
import tempfile
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

logger = logging.getLogger("whisper-service")
logging.basicConfig(level=logging.INFO)

model: WhisperModel | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    logger.info("Loading Faster-Whisper 'small' model (CPU)...")
    model = WhisperModel("small", device="cpu", compute_type="int8")
    logger.info("Whisper model loaded and ready.")
    yield
    logger.info("Shutting down whisper service.")


app = FastAPI(title="Whisper STT Service", lifespan=lifespan)

# CORS so browser or Node can call this service (e.g. when used behind same origin or for dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    allowed_types = {
        "audio/wav", "audio/x-wav", "audio/wave",
        "audio/webm", "audio/mpeg", "audio/mp3",
        "audio/ogg", "audio/flac",
    }
    if file.content_type and file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio type: {file.content_type}. Accepted: wav, webm, mp3, ogg, flac",
        )

    # Map content type to file extension for faster_whisper
    suffix_map = {
        "audio/webm": ".webm",
        "audio/wav": ".wav",
        "audio/x-wav": ".wav",
        "audio/wave": ".wav",
        "audio/mpeg": ".mp3",
        "audio/mp3": ".mp3",
        "audio/ogg": ".ogg",
        "audio/flac": ".flac",
    }
    suffix = suffix_map.get(file.content_type or "", ".webm")

    try:
        audio_bytes = await file.read()
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=True) as tmp:
            tmp.write(audio_bytes)
            tmp.flush()
            # Force English so we don't get Devanagari/other scripts for Indian-accented English
            segments, info = model.transcribe(tmp.name, beam_size=5, language="en")
            text = " ".join(segment.text.strip() for segment in segments)

        return {"text": text}
    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


# TODO: Future WebSocket endpoint for real-time streaming transcription
# @app.websocket("/ws/transcribe")
# async def ws_transcribe(websocket: WebSocket): ...
