// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnySpeechRecognition = any

const WORD_TO_DIGIT: Record<string, string> = {
  zero: '0', oh: '0', o: '0',
  one: '1', won: '1',
  two: '2', to: '2', too: '2',
  three: '3', tree: '3',
  four: '4', for: '4',
  five: '5',
  six: '6', sex: '6',
  seven: '7',
  eight: '8', ate: '8',
  nine: '9', niner: '9',
}

export function getSpeechRecognition(): (new () => AnySpeechRecognition) | null {
  const w = window as unknown as Record<string, unknown>
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as
    | (new () => AnySpeechRecognition)
    | null
}

export function parseSpokenDigits(transcript: string): string[] {
  const words = transcript.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
  const digits: string[] = []
  for (const w of words) {
    if (/^\d$/.test(w)) {
      digits.push(w)
    } else if (/^\d+$/.test(w)) {
      for (const c of w) digits.push(c)
    } else if (WORD_TO_DIGIT[w]) {
      digits.push(WORD_TO_DIGIT[w])
    }
  }
  return digits
}
