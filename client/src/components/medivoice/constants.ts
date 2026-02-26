export type Phase = 'idle' | 'listening' | 'processing'

/** ms of silence after last speech result before stopping and sending to Whisper (lower = faster deactivation) */
export const SILENCE_TIMEOUT = 1000
export const NO_SPEECH_TIMEOUT = 4000
export const RESULT_DISPLAY_MS = 4000
export const WAKE_PHRASE = 'hi there'
