'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Room, User } from '@/types/database'
import { WORDS } from '@/lib/constants'
import { getRandomImposter, getRandomWord } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

interface Participant extends User {
  is_participant: boolean
}

export default function Lobby() {
  const router = useRouter()
  const params = useParams()
  const roomCode = params.code as string
  const { user } = useAuth()
  const supabase = createClient()

  const [room, setRoom] = useState<Room | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!user) return

    loadRoom()
    subscribeToRoom()
  }, [user, roomCode])

  const loadRoom = async () => {
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', roomCode.toUpperCase())
      .single()

    if (roomError || !roomData) {
      console.error('Room not found')
      router.push('/')
      return
    }

    setRoom(roomData)

    // Load participants
    const { data: participantsData } = await supabase
      .from('room_participants')
      .select('user_id')
      .eq('room_id', roomData.id)

    if (participantsData) {
      const userIds = participantsData.map((p) => p.user_id)
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds)

      if (users) {
        setParticipants(users.map((u) => ({ ...u, is_participant: true })))
      }
    }

    setLoading(false)
  }

  const subscribeToRoom = () => {
    // Subscribe to room changes
    const roomChannel = supabase
      .channel(`room:${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `code=eq.${roomCode.toUpperCase()}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setRoom(payload.new as Room)
            
            // If game started, redirect to game page
            if ((payload.new as Room).status === 'IN_PROGRESS') {
              router.push(`/game/${roomCode}`)
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_participants',
        },
        async () => {
          // Reload participants when someone joins/leaves
          await loadRoom()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(roomChannel)
    }
  }

  const handleStartGame = async () => {
    if (!room || !user || room.host_id !== user.id) return

    if (participants.length < room.min_players) {
      alert(`Need at least ${room.min_players} players to start`)
      return
    }

    setStarting(true)

    try {
      // Select random imposter
      const playerIds = participants.map((p) => p.id)
      const imposterId = getRandomImposter(playerIds)

      // Select random word from topic
      const words = WORDS[room.topic]
      const word = getRandomWord(words)

      // Create game round
      const { data: round, error: roundError } = await supabase
        .from('game_rounds')
        .insert({
          room_id: room.id,
          round_number: 1,
          word,
          imposter_id: imposterId,
          status: 'DISCUSSION',
        })
        .select()
        .single()

      if (roundError) throw roundError

      // Update participants with imposter status
      await supabase
        .from('room_participants')
        .update({ is_imposter: false })
        .eq('room_id', room.id)

      await supabase
        .from('room_participants')
        .update({ is_imposter: true })
        .eq('room_id', room.id)
        .eq('user_id', imposterId)

      // Update room status
      await supabase
        .from('rooms')
        .update({ status: 'IN_PROGRESS' })
        .eq('id', room.id)

      // Router will redirect automatically from subscription
    } catch (err) {
      console.error('Error starting game:', err)
      alert('Failed to start game')
      setStarting(false)
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode.toUpperCase())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-2xl">Loading lobby...</div>
      </div>
    )
  }

  if (!room || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="card text-center">
          <h2 className="text-2xl font-bold mb-4">Room not found</h2>
          <Link href="/" className="btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  const isHost = room.host_id === user.id
  const canStart = participants.length >= room.min_players

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-blue-400 hover:text-blue-300 mb-6 inline-block">
          ← Leave Room
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Room Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <h1 className="text-4xl font-bold mb-4 text-center">Game Lobby</h1>
              
              {/* Room Code */}
              <div className="bg-slate-900 rounded-lg p-6 mb-6 text-center">
                <div className="text-sm text-gray-400 mb-2">Room Code</div>
                <div className="flex items-center justify-center gap-4">
                  <div className="text-5xl font-mono font-bold tracking-widest">
                    {roomCode.toUpperCase()}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="btn-secondary"
                  >
                    {copied ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
              </div>

              {/* Room Settings */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-900 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-1">📚</div>
                  <div className="text-xs text-gray-400">Topic</div>
                  <div className="font-semibold">{room.topic}</div>
                </div>
                <div className="bg-slate-900 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-1">👥</div>
                  <div className="text-xs text-gray-400">Players</div>
                  <div className="font-semibold">{room.min_players}-{room.max_players}</div>
                </div>
                <div className="bg-slate-900 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-1">⏱️</div>
                  <div className="text-xs text-gray-400">Timer</div>
                  <div className="font-semibold">{room.round_timer}s</div>
                </div>
                <div className="bg-slate-900 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-1">👤</div>
                  <div className="text-xs text-gray-400">Joined</div>
                  <div className="font-semibold">{participants.length}/{room.max_players}</div>
                </div>
              </div>

              {/* Start Button */}
              {isHost ? (
                <button
                  onClick={handleStartGame}
                  disabled={!canStart || starting}
                  className="btn-primary w-full text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {starting ? 'Starting Game...' : canStart ? '🎮 Start Game' : `Need ${room.min_players - participants.length} more players`}
                </button>
              ) : (
                <div className="bg-blue-900/30 border border-blue-500 text-blue-200 px-4 py-3 rounded text-center">
                  Waiting for host to start the game...
                </div>
              )}
            </div>
          </div>

          {/* Participants List */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-6">Players ({participants.length})</h2>
            <div className="space-y-3">
              {participants.map((participant, index) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 bg-slate-900 p-3 rounded-lg"
                >
                  {participant.avatar_url ? (
                    <Image
                      src={participant.avatar_url}
                      alt={participant.display_name || 'Player'}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                      👤
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-semibold">
                      {participant.display_name}
                      {participant.id === room.host_id && (
                        <span className="ml-2 text-xs bg-yellow-600 px-2 py-1 rounded">
                          HOST
                        </span>
                      )}
                    </div>
                  </div>
                  {index === 0 && <div className="text-2xl">👑</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
