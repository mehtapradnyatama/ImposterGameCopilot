<template>
  <div class="min-h-screen p-4">
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-8">
        <h1 class="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-600 bg-clip-text text-transparent">
          🏆 Leaderboard
        </h1>
        <p class="text-gray-400">Top players ranked by total score</p>
      </div>

      <!-- Podium (Top 3) -->
      <div v-if="topThree.length" class="flex items-end justify-center gap-4 mb-12">
        <!-- 2nd Place -->
        <div v-if="topThree[1]" class="flex flex-col items-center">
          <img :src="topThree[1].avatar_url" class="w-20 h-20 rounded-full border-4 border-gray-400 mb-2" />
          <p class="font-bold">{{ topThree[1].full_name }}</p>
          <div class="bg-gray-400 w-24 h-32 flex flex-col items-center justify-center rounded-t-lg mt-2">
            <span class="text-3xl">🥈</span>
            <span class="text-xl font-bold">{{ topThree[1].total_score }}</span>
          </div>
        </div>

        <!-- 1st Place -->
        <div v-if="topThree[0]" class="flex flex-col items-center">
          <img :src="topThree[0].avatar_url" class="w-24 h-24 rounded-full border-4 border-yellow-400 mb-2" />
          <p class="font-bold text-lg">{{ topThree[0].full_name }}</p>
          <div class="bg-yellow-400 w-28 h-40 flex flex-col items-center justify-center rounded-t-lg mt-2">
            <span class="text-4xl">🥇</span>
            <span class="text-2xl font-bold text-gray-900">{{ topThree[0].total_score }}</span>
          </div>
        </div>

        <!-- 3rd Place -->
        <div v-if="topThree[2]" class="flex flex-col items-center">
          <img :src="topThree[2].avatar_url" class="w-20 h-20 rounded-full border-4 border-orange-600 mb-2" />
          <p class="font-bold">{{ topThree[2].full_name }}</p>
          <div class="bg-orange-600 w-24 h-24 flex flex-col items-center justify-center rounded-t-lg mt-2">
            <span class="text-3xl">🥉</span>
            <span class="text-xl font-bold">{{ topThree[2].total_score }}</span>
          </div>
        </div>
      </div>

      <!-- Full Leaderboard -->
      <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6">
        <h2 class="text-2xl font-bold mb-4">All Players</h2>
        
        <div v-if="loading" class="text-center py-8">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
        </div>

        <div v-else-if="players.length === 0" class="text-center py-8 text-gray-400">
          No players yet. Be the first to play!
        </div>

        <div v-else class="space-y-2">
          <div 
            v-for="(player, index) in players"
            :key="player.id"
            class="flex items-center gap-4 bg-white/5 hover:bg-white/10 rounded-lg p-4 transition"
          >
            <span class="text-2xl font-bold text-gray-400 w-8">{{ index + 1 }}</span>
            <img :src="player.avatar_url" class="w-12 h-12 rounded-full" />
            <div class="flex-1">
              <p class="font-bold">{{ player.full_name }}</p>
              <p class="text-sm text-gray-400">
                {{ player.games_played }} games • {{ player.games_won }} wins
                <span v-if="player.games_played > 0" class="ml-2">
                  ({{ Math.round((player.games_won / player.games_played) * 100) }}% win rate)
                </span>
              </p>
            </div>
            <div class="text-right">
              <p class="text-2xl font-bold text-yellow-400">{{ player.total_score }}</p>
              <p class="text-xs text-gray-400">points</p>
            </div>
          </div>
        </div>
      </div>

      <div class="text-center mt-8">
        <router-link 
          to="/"
          class="bg-purple-600 px-8 py-3 rounded-lg font-bold hover:bg-purple-700 transition inline-block"
        >
          Back to Home
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/supabase'

const players = ref([])
const loading = ref(true)

const topThree = computed(() => players.value.slice(0, 3))

onMounted(async () => {
  await loadLeaderboard()
})

const loadLeaderboard = async () => {
  loading.value = true
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('total_score', { ascending: false })
    .limit(100)
  
  if (error) {
    console.error('Error loading leaderboard:', error)
  } else {
    players.value = data || []
  }
  
  loading.value = false
}
</script>
