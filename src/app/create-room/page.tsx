'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { generateRoomCode } from '@/lib/utils'
import { TOPICS, TIMER_OPTIONS, MIN_PLAYER_OPTIONS, MAX_PLAYER_OPTIONS } from '@/lib/constants'
import Link from 'next/link'

export default function CreateRoom() {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()

  const [topic, setTopic] = useState(TOPICS.PARFUM)
  const [minPlayers, setMinPlayers] = useState(4)
  const [maxPlayers, setMaxPlayers] = useState(10)
  const [roundTimer, setRoundTimer] = useState(120)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('You must be signed in to create a room')
      return
    }

    if (minPlayers > maxPlayers) {
      setError('Minimum players cannot be greater than maximum players')
      return
    }

    setCreating(true)
    setError('')

    try {
      // Generate unique room code
      let code = generateRoomCode()
      let attempts = 0
      
      while (attempts < 10) {
        const { data: existingRoom } = await supabase
          .from('rooms')
          .select('id')
          .eq('code', code)
          .single()

        if (!existingRoom) break
        code = generateRoomCode()
        attempts++
      }

      // Create room
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert({
          code,
          host_id: user.id,
          topic,
          min_players: minPlayers,
          max_players: maxPlayers,
          round_timer: roundTimer,
          status: 'WAITING',
        })
        .select()
        .single()

      if (roomError) throw roomError

      // Add host as participant
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
      console.error('Error creating room:', err)
      setError(err.message || 'Failed to create room')
      setCreating(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="card text-center">
          <h2 className="text-2xl font-bold mb-4">Sign in Required</h2>
          <p className="text-gray-300 mb-6">You must be signed in to create a room.</p>
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
          <h1 className="text-4xl font-bold mb-8 text-center">🎮 Create Room</h1>

          <form onSubmit={handleCreateRoom} className="space-y-6">
            {/* Topic Selection */}
            <div>
              <label className="block text-sm font-semibold mb-2">Game Topic</label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="input"
              >
                {Object.values(TOPICS).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Players */}
            <div>
              <label className="block text-sm font-semibold mb-2">Minimum Players</label>
              <select
                value={minPlayers}
                onChange={(e) => setMinPlayers(Number(e.target.value))}
                className="input"
              >
                {MIN_PLAYER_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n} players
                  </option>
                ))}
              </select>
            </div>

            {/* Max Players */}
            <div>
              <label className="block text-sm font-semibold mb-2">Maximum Players</label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="input"
              >
                {MAX_PLAYER_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n} players
                  </option>
                ))}
              </select>
            </div>

            {/* Round Timer */}
            <div>
              <label className="block text-sm font-semibold mb-2">Discussion Timer</label>
              <select
                value={roundTimer}
                onChange={(e) => setRoundTimer(Number(e.target.value))}
                className="input"
              >
                {TIMER_OPTIONS.map((seconds) => (
                  <option key={seconds} value={seconds}>
                    {seconds < 60 ? `${seconds} seconds` : `${seconds / 60} minutes`}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={creating}
              className="btn-primary w-full text-xl"
            >
              {creating ? 'Creating Room...' : 'Create Room'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
