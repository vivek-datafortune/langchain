import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Check, Loader2, AlertCircle, Settings } from 'lucide-react'

interface MicrophoneDeviceSelectorProps {
  devices: MediaDeviceInfo[]
  selectedDeviceId: string
  onDeviceChange: (deviceId: string) => void
}

export function MicrophoneDeviceSelector({
  devices,
  selectedDeviceId,
  onDeviceChange,
}: MicrophoneDeviceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [testingDevice, setTestingDevice] = useState<string | null>(null)
  const [audioLevels, setAudioLevels] = useState<Record<string, number>>({})
  const [deviceStatus, setDeviceStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({})
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cleanup audio resources
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      if (audioContextRef.current) audioContextRef.current.close()
    }
  }, [])

  const testDevice = async (deviceId: string) => {
    setTestingDevice(deviceId)
    setDeviceStatus(prev => ({ ...prev, [deviceId]: 'testing' }))

    try {
      // Clean up previous test
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      // Get audio stream from specific device
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } }
      })
      streamRef.current = stream

      // Setup audio analysis
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      // Monitor audio levels
      let maxLevel = 0
      const checkAudio = () => {
        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
        const level = Math.min(100, (average / 255) * 100)
        
        if (level > maxLevel) maxLevel = level

        setAudioLevels(prev => ({ ...prev, [deviceId]: level }))
        animationFrameRef.current = requestAnimationFrame(checkAudio)
      }
      checkAudio()

      // Test for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Cleanup
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      stream.getTracks().forEach(t => t.stop())
      audioContext.close()

      // Determine success based on if we detected any audio
      setDeviceStatus(prev => ({ ...prev, [deviceId]: maxLevel > 5 ? 'success' : 'error' }))
      setTestingDevice(null)
      
      // Reset status after delay
      setTimeout(() => {
        setDeviceStatus(prev => ({ ...prev, [deviceId]: 'idle' }))
        setAudioLevels(prev => ({ ...prev, [deviceId]: 0 }))
      }, 2000)

    } catch (error) {
      console.error('Device test failed:', error)
      setDeviceStatus(prev => ({ ...prev, [deviceId]: 'error' }))
      setTestingDevice(null)
      setTimeout(() => {
        setDeviceStatus(prev => ({ ...prev, [deviceId]: 'idle' }))
      }, 2000)
    }
  }

  const handleDeviceSelect = (deviceId: string) => {
    onDeviceChange(deviceId)
    setIsOpen(false)
  }

  if (devices.length <= 1) return null

  const selectedDevice = devices.find(d => d.deviceId === selectedDeviceId)
  const getDeviceLabel = (device: MediaDeviceInfo) => {
    return device.label || `Microphone ${device.deviceId.slice(0, 8)}`
  }

  const getDeviceType = (label: string) => {
    const lower = label.toLowerCase()
    if (lower.includes('built-in') || lower.includes('internal')) return 'built-in'
    if (lower.includes('usb') || lower.includes('external')) return 'external'
    return 'unknown'
  }

  return (
    <div className="relative" ref={containerRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/80 transition-all hover:border-white/20 hover:bg-white/5 max-w-full"
        style={{ background: 'rgba(255,255,255,0.03)' }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        title={selectedDevice ? getDeviceLabel(selectedDevice) : 'Select microphone'}
      >
        <Settings size={14} className="text-emerald-400/70 shrink-0" />
        <span className="max-w-35 truncate">
          {selectedDevice ? getDeviceLabel(selectedDevice) : 'Select microphone'}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-white/40">
            <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-white/10 shadow-2xl backdrop-blur-xl"
            style={{ background: 'rgba(18, 18, 18, 0.95)', minWidth: '280px', maxWidth: '320px' }}
          >
            <div className="max-h-70 overflow-y-auto overflow-x-hidden">
              {devices.map((device) => {
                const isSelected = device.deviceId === selectedDeviceId
                const status = deviceStatus[device.deviceId] || 'idle'
                const level = audioLevels[device.deviceId] || 0
                const deviceType = getDeviceType(device.label)

                return (
                  <div
                    key={device.deviceId}
                    className="border-b border-white/5 last:border-b-0"
                  >
                    <div className="flex items-center gap-2 p-3 transition-colors hover:bg-white/5">
                      <button
                        onClick={() => handleDeviceSelect(device.deviceId)}
                        className="flex flex-1 items-center gap-2 text-left min-w-0"
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          isSelected ? 'bg-emerald-500/20' : 'bg-white/5'
                        }`}>
                          <Mic size={14} className={isSelected ? 'text-emerald-400' : 'text-white/40'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium truncate ${
                            isSelected ? 'text-emerald-400' : 'text-white/80'
                          }`} title={getDeviceLabel(device)}>
                            {getDeviceLabel(device)}
                          </p>
                          <p className="text-[10px] text-white/30 capitalize truncate">
                            {deviceType === 'built-in' ? '🔹 Built-in' : deviceType === 'external' ? '🔌 External' : '🎤 Microphone'}
                          </p>
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20"
                          >
                            <Check size={12} className="text-emerald-400" />
                          </motion.div>
                        )}
                      </button>

                      <button
                        onClick={() => testDevice(device.deviceId)}
                        disabled={testingDevice !== null}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 transition-all hover:border-white/20 hover:bg-white/5 disabled:opacity-50"
                        title="Test microphone"
                      >
                        {status === 'testing' ? (
                          <Loader2 size={12} className="animate-spin text-cyan-400" />
                        ) : status === 'success' ? (
                          <Check size={12} className="text-emerald-400" />
                        ) : status === 'error' ? (
                          <AlertCircle size={12} className="text-amber-400" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-white/30" />
                        )}
                      </button>
                    </div>

                    {/* Audio level indicator */}
                    {status === 'testing' && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3">
                          <div className="relative h-1.5 overflow-hidden rounded-full bg-white/5">
                            <motion.div
                              className="h-full rounded-full bg-linear-to-r from-emerald-500 to-cyan-400"
                              style={{ width: `${level}%` }}
                              transition={{ duration: 0.1 }}
                            />
                          </div>
                          <p className="mt-1 text-[9px] text-white/30 text-center">
                            {level > 5 ? 'Audio detected' : 'Speak to test...'}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )
              })}
            </div>
            
            <div className="border-t border-white/5 bg-white/2 p-2">
              <p className="text-[9px] text-white/25 text-center">
                Click device to select • Click dot to test
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
