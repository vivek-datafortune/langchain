import { useState, useEffect, useCallback } from 'react'

export function useMicrophoneDevices() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadDevices = async () => {
      try {
        if (isMounted) setIsLoading(true)
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(track => track.stop())
        if (isMounted) setPermissionGranted(true)

        await new Promise(resolve => setTimeout(resolve, 100))
        const allDevices = await navigator.mediaDevices.enumerateDevices()
        const audioInputs = allDevices.filter(d => d.kind === 'audioinput')
        
        if (!isMounted) return
        setDevices(audioInputs)

        if (audioInputs.length > 0) {
          setSelectedDeviceId(currentId => {
            const currentDeviceStillAvailable = audioInputs.some(d => d.deviceId === currentId)
            
            if (!currentDeviceStillAvailable || !currentId) {
              const externalDevice = audioInputs.find(d => {
                const label = d.label.toLowerCase()
                return (
                  !label.includes('built-in') &&
                  !label.includes('internal') &&
                  !label.includes('default')
                ) || label.includes('usb') || label.includes('external')
              })
              
              const preferredDevice = externalDevice || audioInputs[0]
              
              console.log('🎤 Microphone selected:', {
                label: preferredDevice.label,
                isExternal: !!externalDevice,
                deviceId: preferredDevice.deviceId.slice(0, 12) + '...'
              })
              
              return preferredDevice.deviceId
            }
            return currentId
          })
        }
        
        if (isMounted) setIsLoading(false)
      } catch (err) {
        console.error('Failed to enumerate devices:', err)
        if (isMounted) {
          setPermissionGranted(false)
          setIsLoading(false)
        }
      }
    }

    loadDevices()

    const handleDeviceChange = () => {
      console.log('🔄 Audio devices changed, reloading...')
      loadDevices()
    }
    
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange)

    return () => {
      isMounted = false
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange)
    }
  }, [])

  const updateSelectedDevice = useCallback((deviceId: string) => {
    const device = devices.find(d => d.deviceId === deviceId)
    if (device) {
      setSelectedDeviceId(deviceId)
      console.log('✅ Switched to:', device.label)
    }
  }, [devices])

  return {
    devices,
    selectedDeviceId,
    setSelectedDeviceId: updateSelectedDevice,
    permissionGranted,
    isLoading,
  }
}
