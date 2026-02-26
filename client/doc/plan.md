We already have backend ready (Node API running on localhost:3000).

Now implement frontend in:

client/src/components/medivoice/MediVoicePage.tsx

=========================================
GOAL
=========================================

Build a production-ready voice assistant UI called "MediVoice" with:

- Glassmorphic design
- Center microphone orb
- Wake word activation: "hey medivoice"
- Live transcript display
- Auto deactivation on silence (like Google Assistant / Siri)
- Clean, scalable architecture

=========================================
TECH REQUIREMENTS
=========================================

Use:
- React (functional components)
- TypeScript
- Hooks only
- TailwindCSS for styling
- Framer Motion for animations
- Web Speech API for live transcript (interim results)
- Picovoice Porcupine (browser SDK) for wake word detection

Backend endpoint to call after speech ends:
POST http://localhost:3000/assistant/transcribe

=========================================
BEHAVIOR FLOW
=========================================

IDLE STATE:
- Animated glowing glass orb in center
- Subtle breathing animation
- Text below: "Say 'Hey MediVoice'"

WAKE WORD DETECTED:
- Orb glows stronger
- Start speech recognition
- Show listening indicator
- Change text to: "Listening..."

WHILE USER SPEAKING:
- Show live transcript (interim results)
- Transcript updates in real time

WHEN USER STOPS SPEAKING (2–3 sec silence):
- Stop recognition
- Send final transcript to backend
- Show final transcript
- Return to idle state
- Reactivate wake word listener

IF NO SPEECH AFTER WAKE (3 sec):
- Deactivate and go back to idle

=========================================
STATE MANAGEMENT
=========================================

Use clean state structure:

- isListening (boolean)
- isWakeActive (boolean)
- transcript (string)
- interimTranscript (string)
- isProcessing (boolean)
- silenceTimer (ref)

Separate logic clearly:
- Wake word handling
- Speech recognition
- Backend communication
- UI state

=========================================
UI DESIGN (Glassmorphism)
=========================================

- Fullscreen gradient background
- Center glass card with:
    backdrop-blur
    bg-white/10
    border-white/20
    shadow-xl
    rounded-3xl

- Circular mic orb:
    120px-150px
    radial gradient
    blur glow effect
    animated pulse when active

- Smooth transitions
- Modern minimal typography
- Responsive layout

Use Framer Motion for:
- Orb pulse
- Fade transcript in/out
- Listening ripple effect

=========================================
IMPORTANT ARCHITECTURE RULES
=========================================

- Wake word runs continuously in background
- Speech recognition only starts after wake
- Silence detection must be implemented manually
- Clean up all listeners on unmount
- Handle browser permissions properly
- Do not crash if mic permission denied
- Graceful fallback if Porcupine fails

=========================================
CODE STRUCTURE
=========================================

Single file implementation for now:

MediVoicePage.tsx

But code must be structured cleanly with:
- helper functions
- proper useEffect separation
- clear comments

=========================================
BONUS (OPTIONAL BUT PREFERRED)
=========================================

- Add subtle sound when activated
- Add small waveform animation
- Add processing spinner when calling backend
- Accessibility support

=========================================
DELIVERABLE
=========================================

Generate a complete, production-ready MediVoicePage.tsx file with:
- Full UI
- Wake word integration placeholder
- Working Web Speech API logic
- Silence detection
- Backend call
- Proper cleanup
- Well commented