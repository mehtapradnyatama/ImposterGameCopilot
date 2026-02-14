'use client'

import { useState, useEffect, useRef } from 'react'
import SimplePeer from 'simple-peer'
import { createClient } from '@/lib/supabase/client'

interface WebRTCVoiceChatProps {
  roomCode: string
  userId: string
  participants: any[]
}

export default function WebRTCVoiceChat({ roomCode, userId, participants }: WebRTCVoiceChatProps) {
  const [isMuted, setIsMuted] = useState(true)
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false)
  const [volume, setVolume] = useState(100)
  const [hasPermission, setHasPermission] = useState(false)
  
  const localStreamRef = useRef<MediaStream | null>(null)
  const peersRef = useRef<Map<string, SimplePeer.Instance>>(new Map())
  const supabase = createClient()

  useEffect(() => {
    initializeAudio()

    // Listen for spacebar for push-to-talk
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        activatePushToTalk()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        deactivatePushToTalk()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      cleanup()
    }
  }, [])

  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      })
      localStreamRef.current = stream
      
      // Mute by default
      stream.getAudioTracks().forEach(track => {
        track.enabled = false
      })
      
      setHasPermission(true)
      initializePeerConnections()
    } catch (err) {
      console.error('Error accessing microphone:', err)
      alert('Please allow microphone access to use voice chat')
    }
  }

  const initializePeerConnections = async () => {
    // This is a simplified WebRTC setup
    // In production, you'd use a signaling server
    // For now, we'll use Supabase Realtime for signaling
    
    const channel = supabase.channel(`webrtc:${roomCode}`)
      .on('broadcast', { event: 'signal' }, ({ payload }) => {
        handleSignal(payload)
      })
      .subscribe()
  }

  const handleSignal = (payload: any) => {
    const { from, signal } = payload
    
    if (from === userId) return

    let peer = peersRef.current.get(from)
    
    if (!peer) {
      peer = createPeer(false, from)
      peersRef.current.set(from, peer)
    }

    peer.signal(signal)
  }

  const createPeer = (initiator: boolean, remotePeerId: string): SimplePeer.Instance => {
    const peer = new SimplePeer({
      initiator,
      stream: localStreamRef.current || undefined,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    })

    peer.on('signal', (signal) => {
      // Send signal through Supabase Realtime
      supabase.channel(`webrtc:${roomCode}`).send({
        type: 'broadcast',
        event: 'signal',
        payload: { from: userId, to: remotePeerId, signal },
      })
    })

    peer.on('stream', (remoteStream) => {
      // Play remote audio
      const audio = new Audio()
      audio.srcObject = remoteStream
      audio.volume = volume / 100
      audio.play()
    })

    peer.on('error', (err) => {
      console.error('Peer connection error:', err)
    })

    return peer
  }

  const activatePushToTalk = () => {
    if (!localStreamRef.current || isMuted) return
    
    localStreamRef.current.getAudioTracks().forEach(track => {
      track.enabled = true
    })
    setIsPushToTalkActive(true)

    // Play activation sound (optional)
    playSound('activate')
  }

  const deactivatePushToTalk = () => {
    if (!localStreamRef.current) return
    
    localStreamRef.current.getAudioTracks().forEach(track => {
      track.enabled = false
    })
    setIsPushToTalkActive(false)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (!isMuted) {
      // Muting
      deactivatePushToTalk()
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value)
    setVolume(newVolume)
    
    // Update all audio elements (in production, you'd track these)
    const audioElements = document.querySelectorAll('audio')
    audioElements.forEach(audio => {
      audio.volume = newVolume / 100
    })
  }

  const playSound = (type: 'activate' | 'deactivate') => {
    // Use Web Audio API to generate a simple beep
    const audioContext = new AudioContext()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = type === 'activate' ? 800 : 600
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.1)
  }

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
    }
    
    peersRef.current.forEach(peer => {
      peer.destroy()
    })
    peersRef.current.clear()
  }

  if (!hasPermission) {
    return (
      <div className="bg-yellow-900/30 border border-yellow-600 text-yellow-200 p-3 rounded text-sm">
        🎤 Microphone access required for voice chat
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="bg-slate-900 rounded-lg p-3">
        <h4 className="text-sm font-semibold mb-2">🎙️ Voice Chat</h4>
        
        {/* Push to Talk Button */}
        <button
          onMouseDown={activatePushToTalk}
          onMouseUp={deactivatePushToTalk}
          onMouseLeave={deactivatePushToTalk}
          onTouchStart={activatePushToTalk}
          onTouchEnd={deactivatePushToTalk}
          disabled={isMuted}
          className={`w-full py-3 rounded-lg font-semibold text-sm transition-all ${
            isPushToTalkActive
              ? 'bg-green-600 text-white scale-105'
              : isMuted
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isPushToTalkActive ? '🔊 Speaking...' : isMuted ? '🔇 Muted' : '🎤 Hold to Talk'}
        </button>

        <div className="text-xs text-gray-400 text-center mt-1">
          Press and hold SPACEBAR or click button
        </div>
      </div>

      {/* Controls */}
      <div className="bg-slate-900 rounded-lg p-3 space-y-2">
        <button
          onClick={toggleMute}
          className={`w-full py-2 rounded-lg text-sm font-semibold ${
            isMuted
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isMuted ? '🔇 Unmute' : '🔊 Mute'}
        </button>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Volume: {volume}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full"
          />
        </div>
      </div>
    </div>
  )
}
