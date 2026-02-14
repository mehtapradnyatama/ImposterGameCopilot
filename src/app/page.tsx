'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types/database'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  const { user, loading, signInWithGoogle, signOut } = useAuth()
  const [leaderboard, setLeaderboard] = useState<User[]>([])
  const supabase = createClient()

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('total_points', { ascending: false })
      .limit(10)

    if (data) {
      setLeaderboard(data)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-5xl font-bold text-white">
            🕵️ Imposter Word Game
          </h1>
          {user ? (
            <div className="flex items-center gap-4">
              {user.user_metadata.avatar_url && (
                <Image
                  src={user.user_metadata.avatar_url}
                  alt="Avatar"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              )}
              <span className="text-white">{user.user_metadata.full_name || user.email}</span>
              <button onClick={signOut} className="btn-secondary">
                Sign Out
              </button>
            </div>
          ) : (
            <button onClick={signInWithGoogle} className="btn-primary">
              Sign in with Google
            </button>
          )}
        </header>

        {!user ? (
          <div className="card text-center max-w-2xl mx-auto mt-20">
            <h2 className="text-3xl font-bold mb-4">Welcome!</h2>
            <p className="text-gray-300 mb-6">
              Sign in with Google to start playing Imposter Word Game
            </p>
            <button onClick={signInWithGoogle} className="btn-primary text-xl">
              🚀 Sign in with Google
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Main Actions */}
            <div className="space-y-6">
              <Link href="/create-room">
                <div className="card hover:border-blue-500 cursor-pointer transition-all transform hover:scale-105">
                  <h2 className="text-3xl font-bold mb-4">🎮 Create Room</h2>
                  <p className="text-gray-300">
                    Start a new game and invite your friends
                  </p>
                </div>
              </Link>

              <Link href="/join-room">
                <div className="card hover:border-green-500 cursor-pointer transition-all transform hover:scale-105">
                  <h2 className="text-3xl font-bold mb-4">🚪 Join Room</h2>
                  <p className="text-gray-300">
                    Enter a room code to join an existing game
                  </p>
                </div>
              </Link>

              <Link href="/leaderboard">
                <div className="card hover:border-yellow-500 cursor-pointer transition-all transform hover:scale-105">
                  <h2 className="text-3xl font-bold mb-4">🏆 Leaderboard</h2>
                  <p className="text-gray-300">
                    View top players and rankings
                  </p>
                </div>
              </Link>
            </div>

            {/* Leaderboard Preview */}
            <div className="card">
              <h2 className="text-2xl font-bold mb-6">🌟 Top 10 Players</h2>
              <div className="space-y-3">
                {leaderboard.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No players yet. Be the first!</p>
                ) : (
                  leaderboard.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-4 bg-slate-900 p-3 rounded-lg"
                    >
                      <div className="text-2xl font-bold w-8">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                      </div>
                      {player.avatar_url ? (
                        <Image
                          src={player.avatar_url}
                          alt={player.display_name || 'Player'}
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
                        <div className="font-semibold">{player.display_name}</div>
                      </div>
                      <div className="text-yellow-400 font-bold">
                        {player.total_points} pts
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* How to Play */}
        <div className="card mt-12">
          <h2 className="text-2xl font-bold mb-4">📖 How to Play</h2>
          <div className="grid md:grid-cols-3 gap-6 text-gray-300">
            <div>
              <h3 className="font-bold text-white mb-2">1. Setup</h3>
              <p>Create or join a room with 4-10 players. The host selects a topic and timer.</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">2. Play</h3>
              <p>Everyone gets the same word except one imposter. Discuss using voice or text chat.</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">3. Vote</h3>
              <p>Vote for who you think is the imposter. Correct votes earn points!</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
