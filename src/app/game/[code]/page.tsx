'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Room, User, GameRound, RoomParticipant, ChatMessage, Vote } from '@/types/database'
import { formatTime, getRandomImposter, getRandomWord } from '@/lib/utils'
import { WORDS } from '@/lib/constants'
import Image from 'next/image'
import WebRTCVoiceChat from '@/components/WebRTCVoiceChat'

interface ParticipantWithUser extends RoomParticipant {
  user: User
  isSpeaking?: boolean
}

export default function Game() {
  const router = useRouter()
  const params = useParams()
  const roomCode = params.code as string
  const { user } = useAuth()
  const supabase = createClient()

  const [room, setRoom] = useState<Room | null>(null)
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null)
  const [participants, setParticipants] = useState<ParticipantWithUser[]>([])
  const [myRole, setMyRole] = useState<'NORMAL' | 'IMPOSTER'>('NORMAL')
  const [myWord, setMyWord] = useState<string>('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [phase, setPhase] = useState<'DISCUSSION' | 'VOTING' | 'RESULTS'>('DISCUSSION')
  const [selectedVote, setSelectedVote] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [votes, setVotes] = useState<Vote[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return
    loadGameData()
    subscribeToGame()
  }, [user, roomCode])

  useEffect(() => {
    if (timeLeft > 0 && phase === 'DISCUSSION') {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Time's up, move to voting
            if (room && user && room.host_id === user.id) {
              handleMoveToVoting()
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [timeLeft, phase])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const loadGameData = async () => {
    // Load room
    const { data: roomData } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', roomCode.toUpperCase())
      .single()

    if (!roomData) {
      router.push('/')
      return
    }
    setRoom(roomData)

    // Load current round
    const { data: roundData } = await supabase
      .from('game_rounds')
      .select('*')
      .eq('room_id', roomData.id)
      .order('round_number', { ascending: false })
      .limit(1)
      .single()

    if (roundData) {
      setCurrentRound(roundData)
      setPhase(roundData.status as any)
      
      // Calculate time left
      const roundStartTime = new Date(roundData.started_at).getTime()
      const now = Date.now()
      const elapsed = Math.floor((now - roundStartTime) / 1000)
      const remaining = Math.max(0, roomData.round_timer - elapsed)
      setTimeLeft(remaining)
    }

    // Load participants
    const { data: participantsData } = await supabase
      .from('room_participants')
      .select('*, user:users(*)')
      .eq('room_id', roomData.id)

    if (participantsData) {
      setParticipants(participantsData as any)

      // Check if I'm the imposter
      const me = participantsData.find((p) => p.user_id === user?.id)
      if (me) {
        if (me.is_imposter) {
          setMyRole('IMPOSTER')
          setMyWord('IMPOSTER')
        } else {
          setMyRole('NORMAL')
          setMyWord(roundData?.word || '')
        }
      }
    }

    // Load chat messages
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomData.id)
      .order('created_at', { ascending: true })

    if (messages) {
      setChatMessages(messages)
    }

    // Load votes if in voting/results phase
    if (roundData && (roundData.status === 'VOTING' || roundData.status === 'FINISHED')) {
      const { data: votesData } = await supabase
        .from('votes')
        .select('*')
        .eq('room_id', roomData.id)
        .eq('round_number', roundData.round_number)

      if (votesData) {
        setVotes(votesData)
        const myVote = votesData.find((v) => v.voter_id === user?.id)
        if (myVote) {
          setHasVoted(true)
          setSelectedVote(myVote.voted_for_id)
        }
      }
    }
  }

  const subscribeToGame = () => {
    const channel = supabase
      .channel(`game:${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_rounds',
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setCurrentRound(payload.new as GameRound)
            setPhase((payload.new as GameRound).status as any)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          setChatMessages((prev) => [...prev, payload.new as ChatMessage])
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
        },
        async () => {
          await loadGameData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleMoveToVoting = async () => {
    if (!currentRound || !room) return

    await supabase
      .from('game_rounds')
      .update({ status: 'VOTING' })
      .eq('id', currentRound.id)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !room || !user) return

    await supabase
      .from('chat_messages')
      .insert({
        room_id: room.id,
        user_id: user.id,
        message: newMessage.trim(),
      })

    setNewMessage('')
  }

  const handleVote = async () => {
    if (!selectedVote || !currentRound || !room || !user || hasVoted) return

    await supabase
      .from('votes')
      .insert({
        room_id: room.id,
        voter_id: user.id,
        voted_for_id: selectedVote,
        round_number: currentRound.round_number,
      })

    setHasVoted(true)

    // Check if all players have voted
    const totalPlayers = participants.length
    const currentVotes = votes.length + 1

    if (currentVotes >= totalPlayers && room.host_id === user.id) {
      // Move to results
      await handleShowResults()
    }
  }

  const handleShowResults = async () => {
    if (!currentRound || !room) return

    // Calculate results
    const { data: allVotes } = await supabase
      .from('votes')
      .select('*')
      .eq('room_id', room.id)
      .eq('round_number', currentRound.round_number)

    if (!allVotes) return

    // Count votes
    const voteCounts: Record<string, number> = {}
    allVotes.forEach((v) => {
      voteCounts[v.voted_for_id] = (voteCounts[v.voted_for_id] || 0) + 1
    })

    // Find player with most votes
    let maxVotes = 0
    let votedOutId = ''
    for (const [playerId, count] of Object.entries(voteCounts)) {
      if (count > maxVotes) {
        maxVotes = count
        votedOutId = playerId
      }
    }

    // Award points
    const imposterCaught = votedOutId === currentRound.imposter_id

    if (imposterCaught) {
      // Normal players who voted correctly get points
      const correctVoters = allVotes
        .filter((v) => v.voted_for_id === currentRound.imposter_id)
        .map((v) => v.voter_id)

      for (const voterId of correctVoters) {
        const participant = participants.find((p) => p.user_id === voterId)
        if (participant) {
          await supabase
            .from('room_participants')
            .update({ points: participant.points + 2 })
            .eq('id', participant.id)

          await supabase
            .from('users')
            .update({ total_points: supabase.rpc('increment', { amount: 2 }) } as any)
            .eq('id', voterId)
        }
      }
    } else {
      // Imposter wins
      await supabase
        .from('room_participants')
        .update({ points: currentRound.imposter_id === user?.id ? 2 : 0 })
        .eq('room_id', room.id)
        .eq('user_id', currentRound.imposter_id)

      await supabase
        .from('users')
        .update({ total_points: supabase.rpc('increment', { amount: 2 }) } as any)
        .eq('id', currentRound.imposter_id)
    }

    // Update round status
    await supabase
      .from('game_rounds')
      .update({ status: 'FINISHED', ended_at: new Date().toISOString() })
      .eq('id', currentRound.id)

    setPhase('RESULTS')
  }

  const handleNextRound = async () => {
    if (!room || !user || room.host_id !== user.id) return

    // Reset for new round
    const playerIds = participants.map((p) => p.user_id)
    const imposterId = getRandomImposter(playerIds)
    const words = WORDS[room.topic]
    const word = getRandomWord(words)

    const { data: newRound } = await supabase
      .from('game_rounds')
      .insert({
        room_id: room.id,
        round_number: (currentRound?.round_number || 0) + 1,
        word,
        imposter_id: imposterId,
        status: 'DISCUSSION',
      })
      .select()
      .single()

    if (newRound) {
      // Update participants
      await supabase
        .from('room_participants')
        .update({ is_imposter: false })
        .eq('room_id', room.id)

      await supabase
        .from('room_participants')
        .update({ is_imposter: true })
        .eq('room_id', room.id)
        .eq('user_id', imposterId)

      // Reload game
      setHasVoted(false)
      setSelectedVote(null)
      setVotes([])
      await loadGameData()
    }
  }

  if (!room || !user || !currentRound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-2xl">Loading game...</div>
      </div>
    )
  }

  const isHost = room.host_id === user.id

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Discussion Phase */}
        {phase === 'DISCUSSION' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-screen max-h-screen">
            {/* Left: Players */}
            <div className="card lg:col-span-1 overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Players</h3>
              <div className="space-y-2">
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-2 p-2 rounded ${
                      p.isSpeaking ? 'speaking-indicator border-4' : 'border border-slate-700'
                    }`}
                  >
                    {p.user.avatar_url ? (
                      <Image
                        src={p.user.avatar_url}
                        alt={p.user.display_name || 'Player'}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-xs">
                        👤
                      </div>
                    )}
                    <div className="flex-1 text-sm">
                      {p.user.display_name}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <WebRTCVoiceChat
                  roomCode={roomCode}
                  userId={user.id}
                  participants={participants}
                />
              </div>
            </div>

            {/* Center: Timer & Word */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center">
              {/* Timer */}
              <div className={`text-8xl font-bold mb-8 ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                {formatTime(timeLeft)}
              </div>

              {/* Word Card */}
              <div className={`card max-w-md w-full text-center p-12 ${
                myRole === 'IMPOSTER' ? 'bg-red-900 border-red-500' : 'bg-blue-900 border-blue-500'
              }`}>
                {myRole === 'IMPOSTER' ? (
                  <>
                    <div className="text-6xl mb-4">🕵️</div>
                    <h2 className="text-4xl font-bold text-red-300">YOU ARE THE</h2>
                    <h1 className="text-6xl font-bold text-red-100 mt-4">IMPOSTER!</h1>
                    <p className="text-red-300 mt-4">Try to blend in without knowing the word</p>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-4">📝</div>
                    <h2 className="text-2xl font-semibold text-blue-300 mb-4">Your word is:</h2>
                    <h1 className="text-6xl font-bold text-blue-100">{myWord}</h1>
                    <p className="text-blue-300 mt-4">Find the imposter!</p>
                  </>
                )}
              </div>
            </div>

            {/* Right: Chat */}
            <div className="card lg:col-span-1 flex flex-col">
              <h3 className="text-xl font-bold mb-4">💬 Chat</h3>
              <div className="flex-1 overflow-y-auto mb-4 space-y-2">
                {chatMessages.map((msg) => {
                  const sender = participants.find((p) => p.user_id === msg.user_id)
                  return (
                    <div key={msg.id} className="bg-slate-900 p-2 rounded text-sm">
                      <div className="font-semibold text-blue-400">
                        {sender?.user.display_name || 'Unknown'}
                      </div>
                      <div className="text-gray-300">{msg.message}</div>
                    </div>
                  )
                })}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type message..."
                  className="input flex-1 text-sm"
                />
                <button type="submit" className="btn-primary px-4 py-2 text-sm">
                  Send
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Voting Phase */}
        {phase === 'VOTING' && (
          <div className="max-w-4xl mx-auto py-8">
            <div className="card">
              <h1 className="text-4xl font-bold mb-8 text-center">🗳️ Vote for the Imposter</h1>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {participants
                  .filter((p) => p.user_id !== user.id)
                  .map((p) => (
                    <button
                      key={p.id}
                      onClick={() => !hasVoted && setSelectedVote(p.user_id)}
                      disabled={hasVoted}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedVote === p.user_id
                          ? 'border-yellow-500 bg-yellow-900/50'
                          : 'border-slate-700 bg-slate-900 hover:border-slate-500'
                      } ${hasVoted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {p.user.avatar_url ? (
                        <Image
                          src={p.user.avatar_url}
                          alt={p.user.display_name || 'Player'}
                          width={64}
                          height={64}
                          className="rounded-full mx-auto mb-2"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-2">
                          👤
                        </div>
                      )}
                      <div className="font-semibold text-center">{p.user.display_name}</div>
                    </button>
                  ))}
              </div>

              {!hasVoted ? (
                <button
                  onClick={handleVote}
                  disabled={!selectedVote}
                  className="btn-primary w-full text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Vote
                </button>
              ) : (
                <div className="bg-blue-900/30 border border-blue-500 text-blue-200 px-4 py-3 rounded text-center">
                  Waiting for other players to vote... ({votes.length}/{participants.length})
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Phase */}
        {phase === 'RESULTS' && (
          <div className="max-w-4xl mx-auto py-8">
            <div className="card">
              <h1 className="text-4xl font-bold mb-8 text-center">📊 Results</h1>

              {/* Reveal Imposter */}
              <div className="mb-8 text-center">
                {(() => {
                  const imposter = participants.find((p) => p.user_id === currentRound.imposter_id)
                  return (
                    <div className="bg-red-900/50 border border-red-500 rounded-lg p-6">
                      <h2 className="text-2xl font-bold mb-4">The Imposter Was...</h2>
                      <div className="flex items-center justify-center gap-4">
                        {imposter?.user.avatar_url && (
                          <Image
                            src={imposter.user.avatar_url}
                            alt={imposter.user.display_name || 'Imposter'}
                            width={64}
                            height={64}
                            className="rounded-full"
                          />
                        )}
                        <div className="text-4xl font-bold">
                          {imposter?.user.display_name}
                        </div>
                      </div>
                      <div className="mt-4 text-xl">
                        The word was: <span className="font-bold text-yellow-400">{currentRound.word}</span>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Vote Results */}
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4">Vote Results</h3>
                <div className="space-y-2">
                  {participants.map((p) => {
                    const voteCount = votes.filter((v) => v.voted_for_id === p.user_id).length
                    return (
                      <div key={p.id} className="flex items-center gap-4 bg-slate-900 p-3 rounded">
                        {p.user.avatar_url ? (
                          <Image
                            src={p.user.avatar_url}
                            alt={p.user.display_name || 'Player'}
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
                          {p.user.display_name}
                          {p.user_id === currentRound.imposter_id && (
                            <span className="ml-2 text-xs bg-red-600 px-2 py-1 rounded">
                              IMPOSTER
                            </span>
                          )}
                        </div>
                        <div className="text-xl font-bold">{voteCount} votes</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Next Round */}
              {isHost && (
                <button onClick={handleNextRound} className="btn-primary w-full text-xl">
                  🎮 Start Next Round
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
