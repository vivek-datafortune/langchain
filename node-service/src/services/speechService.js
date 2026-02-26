import axios from 'axios';
import FormData from 'form-data';

const WHISPER_URL = process.env.WHISPER_SERVICE_URL || 'http://localhost:8000';

const DEFAULT_CONTENT_TYPE = 'audio/webm';

export async function transcribeAudio(fileBuffer, originalName, contentType = DEFAULT_CONTENT_TYPE) {
  const form = new FormData();
  form.append('file', fileBuffer, {
    filename: originalName || 'audio.webm',
    contentType: contentType || DEFAULT_CONTENT_TYPE,
  });

  try {
    const response = await axios.post(`${WHISPER_URL}/transcribe`, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 60000,
    });
    return response.data;
  } catch (err) {
    const msg = err.response?.data?.detail ?? err.response?.data?.message ?? err.message;
    const status = err.response?.status;
    console.error('[speechService] Whisper request failed:', status, msg);
    const e = new Error(status === 503 ? 'Transcription service starting' : (msg || 'Transcription failed'));
    e.status = status || 502;
    throw e;
  }
}
