<template>
  <div class="min-h-screen p-4 bg-black">
    <div class="max-w-5xl mx-auto">
      <!-- Arcade Title -->
      <div class="text-center mb-8">
        <div class="inline-block bg-yellow-400 border-8 border-yellow-300 p-6 shadow-[8px_8px_0_0_rgba(0,0,0,0.8)]">
          <h1 class="text-5xl font-bold text-black score-display tracking-wider">
            ★ HIGH SCORES ★
          </h1>
        </div>
        <p class="text-green-400 mt-4 text-lg score-display uppercase tracking-wider">Top Players Ranked By Total Score</p>
      </div>

      <!-- Podium (Top 3) - Arcade Style Blocks -->
      <div v-if="topThree.length" class="flex items-end justify-center gap-8 mb-12">
        <!-- 2nd Place -->
        <div v-if="topThree[1]" class="flex flex-col items-center">
          <img :src="topThree[1].avatar_url" class="w-20 h-20 border-4 border-gray-400 mb-3 shadow-[4px_4px_0_0_rgba(0,0,0,0.8)]" style="image-rendering: pixelated;" />
          <p class="font-bold text-sm text-white uppercase mb-3 score-display">{{ topThree[1].full_name }}</p>
          <div class="bg-gray-400 w-32 h-36 flex flex-col items-center justify-center border-8 border-gray-300 shadow-[8px_8px_0_0_rgba(0,0,0,0.8)]">
            <div class="w-16 h-16 bg-white border-4 border-black flex items-center justify-center font-bold text-2xl text-black mb-2 score-display shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]">
              2ND
            </div>
            <span class="text-3xl font-bold text-black score-display">{{ topThree[1].total_score }}</span>
            <span class="text-xs text-black uppercase tracking-wide score-display">POINTS</span>
          </div>
        </div>

        <!-- 1st Place -->
        <div v-if="topThree[0]" class="flex flex-col items-center">
          <img :src="topThree[0].avatar_url" class="w-28 h-28 border-8 border-yellow-400 mb-3 shadow-[8px_8px_0_0_rgba(0,0,0,0.8)]" style="image-rendering: pixelated;" />
          <p class="font-bold text-xl text-yellow-400 uppercase mb-3 score-display">{{ topThree[0].full_name }}</p>
          <div class="bg-yellow-400 w-36 h-44 flex flex-col items-center justify-center border-8 border-yellow-300 shadow-[12px_12px_0_0_rgba(0,0,0,0.8)] relative">
            <div class="absolute -top-6 w-20 h-20 bg-yellow-300 border-8 border-yellow-400 flex items-center justify-center font-bold text-xl text-black score-display shadow-[6px_6px_0_0_rgba(0,0,0,0.8)]">
              1ST
            </div>
            <span class="text-4xl font-bold text-black mt-8 score-display">{{ topThree[0].total_score }}</span>
            <span class="text-sm text-black uppercase tracking-wide score-display">POINTS</span>
          </div>
        </div>

        <!-- 3rd Place -->
        <div v-if="topThree[2]" class="flex flex-col items-center">
          <img :src="topThree[2].avatar_url" class="w-20 h-20 border-4 border-orange-500 mb-3 shadow-[4px_4px_0_0_rgba(0,0,0,0.8)]" style="image-rendering: pixelated;" />
          <p class="font-bold text-sm text-white uppercase mb-3 score-display">{{ topThree[2].full_name }}</p>
          <div class="bg-orange-500 w-32 h-28 flex flex-col items-center justify-center border-8 border-orange-400 shadow-[8px_8px_0_0_rgba(0,0,0,0.8)]">
            <div class="w-16 h-16 bg-white border-4 border-black flex items-center justify-center font-bold text-2xl text-black mb-2 score-display shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]">
              3RD
            </div>
            <span class="text-3xl font-bold text-white score-display">{{ topThree[2].total_score }}</span>
            <span class="text-xs text-white uppercase tracking-wide score-display">POINTS</span>
          </div>
        </div>
      </div>

      <!-- Full Leaderboard - Arcade High Score Table -->
      <div class="bg-blue-900 border-8 border-blue-600 p-6 shadow-[12px_12px_0_0_rgba(0,0,0,0.8)]">
        <h2 class="text-3xl font-bold mb-6 text-yellow-400 uppercase text-center score-display tracking-wider border-b-4 border-yellow-400 pb-4">
          ALL PLAYERS
        </h2>
        
        <div v-if="loading" class="text-center py-12">
          <div class="inline-block">
            <div class="w-16 h-16 border-8 border-yellow-400 border-t-transparent animate-spin"></div>
            <p class="text-yellow-400 mt-4 score-display uppercase">LOADING...</p>
          </div>
        </div>

        <div v-else-if="players.length === 0" class="text-center py-12">
          <p class="text-2xl text-red-400 score-display uppercase mb-4">NO PLAYERS YET</p>
          <p class="text-lg text-green-400 score-display uppercase">BE THE FIRST TO PLAY!</p>
        </div>

        <div v-else class="space-y-3">
          <div 
            v-for="(player, index) in players"
            :key="player.id"
            class="flex items-center gap-4 p-4 border-4 transition-all"
            :class="index < 3 ? 'bg-yellow-500 border-yellow-300' : 'bg-gray-800 border-gray-600 hover:border-green-400'"
          >
            <!-- Rank Badge -->
            <div class="w-12 h-12 border-4 flex items-center justify-center font-bold text-xl score-display shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]" 
              :class="index === 0 ? 'bg-yellow-400 border-yellow-300 text-black' : 
                      index === 1 ? 'bg-gray-400 border-gray-300 text-black' : 
                      index === 2 ? 'bg-orange-500 border-orange-400 text-white' : 
                      'bg-gray-700 border-gray-600 text-white'">
              {{ index + 1 }}
            </div>
            
            <!-- Avatar -->
            <img :src="player.avatar_url" class="w-16 h-16 border-4" 
              :class="index < 3 ? 'border-yellow-300' : 'border-gray-500'"
              style="image-rendering: pixelated;" />
            
            <!-- Player Info -->
            <div class="flex-1">
              <p class="font-bold text-xl uppercase score-display" 
                :class="index < 3 ? 'text-black' : 'text-white'">
                {{ player.full_name }}
              </p>
              <p class="text-sm score-display uppercase tracking-wide" 
                :class="index < 3 ? 'text-black/70' : 'text-green-400'">
                {{ player.games_played }} GAMES • {{ player.games_won }} WINS
                <span v-if="player.games_played > 0" class="ml-2">
                  • {{ Math.round((player.games_won / player.games_played) * 100) }}% WIN RATE
                </span>
              </p>
            </div>
            
            <!-- Score -->
            <div class="text-right">
              <p class="text-4xl font-bold score-display" 
                :class="index < 3 ? 'text-black' : 'text-yellow-400'">
                {{ player.total_score }}
              </p>
              <p class="text-xs uppercase tracking-wider score-display"
                :class="index < 3 ? 'text-black/70' : 'text-gray-400'">
                POINTS
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Back Button -->
      <div class="text-center mt-8">
        <router-link 
          to="/"
          class="btn-retro inline-block"
        >
          ← BACK
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
