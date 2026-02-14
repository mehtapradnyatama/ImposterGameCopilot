<template>
  <div class="min-h-screen p-4 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
    <div class="max-w-5xl mx-auto">
      <div class="text-center mb-8">
        <h1 class="text-5xl font-bold mb-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-600 bg-clip-text text-transparent">
          Leaderboard
        </h1>
        <p class="text-gray-400">Top players ranked by total score</p>
      </div>

      <!-- Podium (Top 3) -->
      <div v-if="topThree.length" class="flex items-end justify-center gap-6 mb-12">
        <!-- 2nd Place -->
        <div v-if="topThree[1]" class="flex flex-col items-center transform hover:scale-105 transition-transform">
          <img :src="topThree[1].avatar_url" class="w-20 h-20 rounded-full border-4 border-gray-400 mb-2 shadow-lg" />
          <p class="font-bold text-sm">{{ topThree[1].full_name }}</p>
          <div class="bg-gradient-to-b from-gray-400 to-gray-500 w-28 h-32 flex flex-col items-center justify-center rounded-t-xl mt-3 shadow-xl">
            <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-2xl text-gray-700 mb-2">2</div>
            <span class="text-2xl font-bold text-white">{{ topThree[1].total_score }}</span>
            <span class="text-xs text-gray-200">points</span>
          </div>
        </div>

        <!-- 1st Place -->
        <div v-if="topThree[0]" class="flex flex-col items-center transform hover:scale-105 transition-transform">
          <img :src="topThree[0].avatar_url" class="w-28 h-28 rounded-full border-4 border-yellow-400 mb-3 shadow-2xl" />
          <p class="font-bold text-lg">{{ topThree[0].full_name }}</p>
          <div class="bg-gradient-to-b from-yellow-400 to-yellow-600 w-32 h-40 flex flex-col items-center justify-center rounded-t-xl mt-3 shadow-2xl relative">
            <div class="absolute -top-4 w-14 h-14 bg-yellow-300 rounded-full flex items-center justify-center font-bold text-3xl text-yellow-900 shadow-lg">1</div>
            <span class="text-3xl font-bold text-yellow-900 mt-6">{{ topThree[0].total_score }}</span>
            <span class="text-sm text-yellow-900">points</span>
          </div>
        </div>

        <!-- 3rd Place -->
        <div v-if="topThree[2]" class="flex flex-col items-center transform hover:scale-105 transition-transform">
          <img :src="topThree[2].avatar_url" class="w-20 h-20 rounded-full border-4 border-orange-600 mb-2 shadow-lg" />
          <p class="font-bold text-sm">{{ topThree[2].full_name }}</p>
          <div class="bg-gradient-to-b from-orange-600 to-orange-700 w-28 h-24 flex flex-col items-center justify-center rounded-t-xl mt-3 shadow-xl">
            <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-2xl text-orange-700 mb-2">3</div>
            <span class="text-2xl font-bold text-white">{{ topThree[2].total_score }}</span>
            <span class="text-xs text-orange-200">points</span>
          </div>
        </div>
      </div>

      <!-- Full Leaderboard -->
      <div class="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
        <h2 class="text-2xl font-bold mb-4">All Players</h2>
        
        <div v-if="loading" class="text-center py-12">
          <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mx-auto"></div>
        </div>

        <div v-else-if="players.length === 0" class="text-center py-12 text-gray-400">
          <p class="text-lg">No players yet.</p>
          <p class="text-sm mt-2">Be the first to play!</p>
        </div>

        <div v-else class="space-y-2">
          <div 
            v-for="(player, index) in players"
            :key="player.id"
            class="flex items-center gap-4 rounded-xl p-4 transition-all border-2"
            :class="index < 3 ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-500/30 hover:border-yellow-500/50' : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'"
          >
            <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl" :class="index === 0 ? 'bg-yellow-500 text-yellow-900' : index === 1 ? 'bg-gray-400 text-gray-900' : index === 2 ? 'bg-orange-600 text-orange-100' : 'bg-gray-700 text-gray-300'">
              {{ index + 1 }}
            </div>
            <img :src="player.avatar_url" class="w-14 h-14 rounded-full border-2" :class="index < 3 ? 'border-yellow-400' : 'border-gray-600'" />
            <div class="flex-1">
              <p class="font-bold text-lg">{{ player.full_name }}</p>
              <p class="text-sm text-gray-400">
                {{ player.games_played }} games · {{ player.games_won }} wins
                <span v-if="player.games_played > 0" class="ml-2">
                  ({{ Math.round((player.games_won / player.games_played) * 100) }}% win rate)
                </span>
              </p>
            </div>
            <div class="text-right">
              <p class="text-3xl font-bold" :class="index < 3 ? 'text-yellow-400' : 'text-purple-400'">{{ player.total_score }}</p>
              <p class="text-xs text-gray-400 uppercase tracking-wide">points</p>
            </div>
          </div>
        </div>
      </div>

      <div class="text-center mt-8">
        <router-link 
          to="/"
          class="bg-gradient-to-r from-purple-600 to-pink-600 px-10 py-4 rounded-xl font-bold hover:from-purple-500 hover:to-pink-500 transition-all inline-block shadow-lg hover:shadow-purple-500/50 transform hover:scale-105"
        >
          ← Back to Home
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
