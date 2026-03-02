# Console Debug Guide for MediVoice Wake Word Detection

## Console Log Prefixes

- 🎤 **[Wake Word]** - Wake word detection (idle mode, listening for "hi there")
- 👂 **[Listening]** - Active listening mode (after wake word detected)
- 🎙️ **[Recording]** - Audio recording to file
- 🎤 **Microphone selected** - Device selection

## What to Look For

### 1. Wake Word Listener Starting
```
🔍 [Wake Word] Effect dependencies changed: { enabled: true, phase: 'idle', showPhoneInput: false, willRun: true }
🔧 [Wake Word] Effect running with: { enabled: true, phase: 'idle', showPhoneInput: false, wakePhrase: 'hi there' }
🎙️ [Wake Word] Recognition started, listening for: hi there
```

### 2. Speech Detection
```
🎤 [Wake Word] Raw transcript: { text: 'hi', length: 2, resultIndex: 0, isFinal: false }
📝 [Wake Word] Buffer updated: { buffer: 'hi', bufferLength: 2, lookingFor: 'hi there', containsPhrase: false }
🎤 [Wake Word] Raw transcript: { text: 'there', length: 5, resultIndex: 1, isFinal: false }
📝 [Wake Word] Buffer updated: { buffer: 'hi there', bufferLength: 8, lookingFor: 'hi there', containsPhrase: true }
✅ [Wake Word] DETECTED in buffer: hi there
```

### 3. Wake Word Triggered
```
✅ [Wake Word] DETECTED in buffer: hi there
👂 [Listening] Starting active listening mode
🎙️ [Recording] Starting with constraints: { deviceId: { exact: 'abc123...' } }
✅ [Recording] Using audio device: { label: 'USB Audio Device', deviceId: 'abc123...', ... }
```

### 4. Common Issues

**Wake word not detecting:**
- Check if you see `🎤 [Wake Word] Raw transcript` logs - if not, microphone may not be working
- Check if `containsPhrase: false` - wake phrase might not match what you said
- Check if recognition keeps restarting: `🔄 [Wake Word] Recognition ended, restarting...`

**Wrong microphone:**
- Look for `✅ [Recording] Using audio device:` to see which mic is actually being used
- Compare with your dropdown selection

**Permission issues:**
- Look for `⚠️ [Wake Word] Microphone permission denied`
- Look for `❌ [Wake Word] Recognition error: { error: 'not-allowed' }`

## Testing Steps

1. Open browser console (F12)
2. Say "hi there" clearly
3. Check the console for:
   - Raw transcript logs showing what was heard
   - Buffer updates showing phrase detection
   - Success message when wake word detected
