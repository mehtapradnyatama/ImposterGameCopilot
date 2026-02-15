<template>
  <div class="min-h-screen flex items-center justify-center p-4 pixel-grid">
    <div class="max-w-3xl w-full bg-black border-8 border-yellow-400 p-8 animate-slide-in-up" style="box-shadow: 8px 8px 0 rgba(234, 179, 8, 0.5);">
      
      <!-- Title Screen -->
      <div class="text-center mb-8">
        <div class="text-yellow-400 text-xs mb-4 animate-blink score-display">
          █ SELECT OPTIONS █
        </div>
        <h1 class="text-4xl md:text-5xl font-bold mb-4 text-arcade text-yellow-400 score-display">
          CREATE GAME
        </h1>
      </div>
      
      <form @submit.prevent="createRoom" class="space-y-6">
        
        <!-- Room Name -->
        <div>
          <label class="block text-sm mb-3 text-white score-display">
            ■ ROOM NAME
          </label>
          <input 
            v-model="roomName"
            type="text"
            required
            maxlength="50"
            class="w-full px-6 py-4 bg-gray-900 border-4 border-white focus:border-yellow-400 focus:outline-none transition-all text-lg font-bold placeholder-gray-600 score-display uppercase"
            placeholder="ARCADE ZONE"
          />
        </div>

        <!-- Settings Grid -->
        <div class="grid md:grid-cols-2 gap-6">
          
          <!-- Max Players - Blue -->
          <div class="bg-blue-600 border-4 border-blue-800 p-6 animate-slide-in-left" style="box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.8);">
            <label class="block text-xs mb-4 text-white score-display text-center">
              ■ MAX PLAYERS
            </label>
            <div class="text-center mb-4">
              <span class="text-6xl font-black text-white score-display">{{ maxPlayers }}</span>
            </div>
            <input 
              v-model.number="maxPlayers"
              type="range"
              min="3"
              max="10"
              class="w-full h-3 bg-blue-900 appearance-none cursor-pointer slider-retro"
            />
            <div class="flex justify-between text-xs text-white mt-2 score-display">
              <span>3</span>
              <span>10</span>
            </div>
          </div>

          <!-- Impostors - Red -->
          <div class="bg-red-600 border-4 border-red-800 p-6 animate-slide-in-right" style="box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.8);">
            <label class="block text-xs mb-4 text-white score-display text-center">
              ● IMPOSTORS
            </label>
            <div class="text-center mb-4">
              <span class="text-6xl font-black text-white score-display">{{ impostorCount }}</span>
            </div>
            <input 
              v-model.number="impostorCount"
              type="range"
              min="1"
              :max="Math.max(1, Math.floor(maxPlayers / 2))"
              class="w-full h-3 bg-red-900 appearance-none cursor-pointer slider-retro"
            />
            <div class="flex justify-between text-xs text-white mt-2 score-display">
              <span>1</span>
              <span>{{ Math.floor(maxPlayers / 2) }}</span>
            </div>
          </div>
        </div>

        <!-- Voice Chat Toggle -->
        <div class="flex items-center bg-cyan-600 border-4 border-cyan-800 p-6 cursor-pointer" style="box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.8);">
          <input 
            v-model="voiceChatEnabled"
            type="checkbox"
            id="voice"
            class="w-6 h-6 accent-cyan-900 cursor-pointer border-4"
          />
          <label for="voice" class="ml-4 cursor-pointer flex-1 text-xs text-white score-display">
            ◆ VOICE CHAT
          </label>
          <span v-if="voiceChatEnabled" class="text-white text-xs font-black px-4 py-2 bg-green-600 border-4 border-green-800 score-display">ON</span>
          <span v-else class="text-white text-xs font-black px-4 py-2 bg-gray-700 border-4 border-gray-900 score-display">OFF</span>
        </div>

        <!-- Start Button -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-green-500 border-4 border-green-700 px-8 py-6 text-2xl hover:bg-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed score-display text-white btn-retro"
        >
          <span class="animate-blink">▶</span> {{ loading ? 'LOADING...' : 'START GAME' }}
        </button>

        <router-link 
          to="/"
          class="block text-center text-gray-400 hover:text-white transition-colors text-xs score-display"
        >
          [PRESS ESC TO EXIT]
        </router-link>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const router = useRouter()

const roomName = ref('')
const maxPlayers = ref(8)
const impostorCount = ref(2)
const voiceChatEnabled = ref(true)
const loading = ref(false)

// Watch maxPlayers to adjust impostorCount if needed
watch(maxPlayers, (newMax) => {
  const maxImpostors = Math.floor(newMax / 2)
  if (impostorCount.value > maxImpostors) {
    impostorCount.value = maxImpostors
  }
})

const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

const createRoom = async () => {
  loading.value = true
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      alert('Please sign in first!')
      router.push('/')
      return
    }
    
    // Ensure user profile exists
    await supabase.from('users').upsert({
      id: session.user.id,
      email: session.user.email,
      full_name: session.user.user_metadata.full_name,
      avatar_url: session.user.user_metadata.avatar_url,
      total_score: 0,
      games_played: 0,
      games_won: 0
    }, {
      onConflict: 'id'
    })
    
    const roomCode = generateRoomCode()
    
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({
        code: roomCode,
        name: roomName.value,
        host_id: session.user.id,
        min_players: 3, // Always 3
        max_players: maxPlayers.value,
        impostor_count: impostorCount.value,
        voice_chat_enabled: voiceChatEnabled.value,
        status: 'WAITING',
        topic: null // Random, no selection
      })
      .select()
      .single()
    
    if (roomError) throw roomError
    
    // Add host as participant
    const { error: participantError } = await supabase
      .from('room_participants')
      .insert({
        room_id: room.id,
        user_id: session.user.id,
        is_host: true
      })
    
    if (participantError) {
      console.error('Error adding host as participant:', participantError)
      throw participantError
    }
    
    // Wait for database to sync
    await new Promise(resolve => setTimeout(resolve, 300))
    
    router.push(`/lobby/${roomCode}`)
  } catch (error) {
    console.error('Create room error:', error)
    alert('Error creating room: ' + error.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Retro 8-bit slider styling */
.slider-retro::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  background: white;
  cursor: pointer;
  border: 4px solid black;
  transition: all 0.1s;
}

.slider-retro::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.slider-retro::-webkit-slider-thumb:active {
  transform: scale(0.9);
}

.slider-retro::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: white;
  cursor: pointer;
  border: 4px solid black;
  transition: all 0.1s;
}

.slider-retro::-moz-range-thumb:hover {
  transform: scale(1.2);
}

.slider-retro::-moz-range-thumb:active {
  transform: scale(0.9);
}
</style>
