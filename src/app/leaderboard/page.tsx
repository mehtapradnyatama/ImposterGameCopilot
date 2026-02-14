'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types/database'
import Image from 'next/image'
import Link from 'next/link'

export default function Leaderboard() {
  const supabase = createClient()
  const [globalLeaderboard, setGlobalLeaderboard] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('total_points', { ascending: false })
      .limit(50)

    if (data) {
      setGlobalLeaderboard(data)
    }
    setLoading(false)
  }

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `${rank}.`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-blue-400 hover:text-blue-300 mb-6 inline-block">
          ← Back to Home
        </Link>

        <div className="card">
          <h1 className="text-4xl font-bold mb-8 text-center">🏆 Global Leaderboard</h1>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-2xl">Loading leaderboard...</div>
            </div>
          ) : globalLeaderboard.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎮</div>
              <div className="text-2xl text-gray-400">No players yet!</div>
              <p className="text-gray-500 mt-2">Be the first to play and earn points</p>
            </div>
          ) : (
            <div className="space-y-3">
              {globalLeaderboard.map((player, index) => {
                const rank = index + 1
                const isTopThree = rank <= 3

                return (
                  <div
                    key={player.id}
                    className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                      isTopThree
                        ? 'bg-gradient-to-r from-yellow-900/50 to-slate-900 border-2 border-yellow-600'
                        : 'bg-slate-900 border border-slate-700'
                    }`}
                  >
                    {/* Rank */}
                    <div className={`text-3xl font-bold w-16 text-center ${
                      isTopThree ? 'text-yellow-400' : 'text-gray-400'
                    }`}>
                      {getMedalEmoji(rank)}
                    </div>

                    {/* Avatar */}
                    {player.avatar_url ? (
                      <Image
                        src={player.avatar_url}
                        alt={player.display_name || 'Player'}
                        width={56}
                        height={56}
                        className={`rounded-full ${isTopThree ? 'ring-4 ring-yellow-500' : ''}`}
                      />
                    ) : (
                      <div className={`w-14 h-14 bg-gray-600 rounded-full flex items-center justify-center text-2xl ${
                        isTopThree ? 'ring-4 ring-yellow-500' : ''
                      }`}>
                        👤
                      </div>
                    )}

                    {/* Name */}
                    <div className="flex-1">
                      <div className={`font-bold text-xl ${
                        isTopThree ? 'text-yellow-100' : 'text-white'
                      }`}>
                        {player.display_name}
                      </div>
                      {player.email && (
                        <div className="text-sm text-gray-400">{player.email}</div>
                      )}
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${
                        isTopThree ? 'text-yellow-400' : 'text-blue-400'
                      }`}>
                        {player.total_points}
                      </div>
                      <div className="text-sm text-gray-400">points</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Refresh Button */}
          <div className="mt-8 text-center">
            <button
              onClick={loadLeaderboard}
              className="btn-secondary"
            >
              🔄 Refresh Leaderboard
            </button>
          </div>
        </div>

        {/* Stats Card */}
        <div className="card mt-8">
          <h2 className="text-2xl font-bold mb-4">📊 Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">
                {globalLeaderboard.length}
              </div>
              <div className="text-sm text-gray-400 mt-1">Total Players</div>
            </div>
            <div className="bg-slate-900 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-400">
                {globalLeaderboard.reduce((sum, p) => sum + p.total_points, 0)}
              </div>
              <div className="text-sm text-gray-400 mt-1">Total Points</div>
            </div>
            <div className="bg-slate-900 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-yellow-400">
                {globalLeaderboard.length > 0 ? Math.max(...globalLeaderboard.map(p => p.total_points)) : 0}
              </div>
              <div className="text-sm text-gray-400 mt-1">Highest Score</div>
            </div>
            <div className="bg-slate-900 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-purple-400">
                {globalLeaderboard.length > 0 
                  ? Math.round(globalLeaderboard.reduce((sum, p) => sum + p.total_points, 0) / globalLeaderboard.length)
                  : 0}
              </div>
              <div className="text-sm text-gray-400 mt-1">Average Score</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
