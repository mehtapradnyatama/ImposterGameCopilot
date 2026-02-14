'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function JoinRoom() {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()

  const [roomCode, setRoomCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('You must be signed in to join a room')
      return
    }

    if (roomCode.length !== 6) {
      setError('Room code must be 6 characters')
      return
    }

    setJoining(true)
    setError('')

    try {
      // Check if room exists
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*, room_participants(user_id)')
        .eq('code', roomCode.toUpperCase())
        .single()

      if (roomError || !room) {
        throw new Error('Room not found')
      }

      // Check if room is full
      if (room.room_participants.length >= room.max_players) {
        throw new Error('Room is full')
      }

      // Check if user is already in room
      const alreadyJoined = room.room_participants.some(
        (p: any) => p.user_id === user.id
      )

      if (alreadyJoined) {
        // Just redirect to lobby
        router.push(`/lobby/${room.code}`)
        return
      }

      // Add user as participant
      const { error: participantError } = await supabase
        .from('room_participants')
        .insert({
          room_id: room.id,
          user_id: user.id,
        })

      if (participantError) throw participantError

      // Redirect to lobby
      router.push(`/lobby/${room.code}`)
    } catch (err: any) {
      console.error('Error joining room:', err)
      setError(err.message || 'Failed to join room')
      setJoining(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="card text-center">
          <h2 className="text-2xl font-bold mb-4">Sign in Required</h2>
          <p className="text-gray-300 mb-6">You must be signed in to join a room.</p>
          <Link href="/" className="btn-primary inline-block">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-blue-400 hover:text-blue-300 mb-6 inline-block">
          ← Back to Home
        </Link>

        <div className="card">
          <h1 className="text-4xl font-bold mb-8 text-center">🚪 Join Room</h1>

          <form onSubmit={handleJoinRoom} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Room Code</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character code"
                maxLength={6}
                className="input text-center text-3xl font-mono tracking-widest"
                autoFocus
              />
              <p className="text-gray-400 text-sm mt-2">
                Ask the host for the room code
              </p>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={joining || roomCode.length !== 6}
              className="btn-primary w-full text-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {joining ? 'Joining...' : 'Join Room'}
            </button>
          </form>

          <div className="mt-8 text-center text-gray-400">
            <p className="mb-2">Don't have a room code?</p>
            <Link href="/create-room" className="text-blue-400 hover:text-blue-300">
              Create your own room →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
