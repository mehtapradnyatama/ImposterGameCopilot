<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="max-w-2xl w-full bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-lg rounded-3xl p-8 border-4 border-purple-500/40 shadow-2xl shadow-purple-500/30">
      <div class="text-center mb-8 animate-bounce-slow">
        <h1 class="text-6xl font-black mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent drop-shadow-2xl">CREATE ROOM</h1>
        <div class="relative inline-block">
          <div class="absolute -inset-4 bg-gradient-to-r from-purple-600/50 to-pink-600/50 rounded-full blur-2xl animate-pulse"></div>
          <p class="relative text-gray-300 text-xl font-bold tracking-wide px-6 py-2 bg-gray-900/60 rounded-full border-2 border-purple-500/50">
            Set up your game
          </p>
        </div>
      </div>
      
      <form @submit.prevent="createRoom" class="space-y-6">
        <div class="group">
          <label class="block text-lg font-black mb-3 text-purple-300 flex items-center gap-2">
            <span class="text-2xl">🏠</span> ROOM NAME
          </label>
          <input 
            v-model="roomName"
            type="text"
            required
            maxlength="50"
            class="w-full px-6 py-4 rounded-2xl bg-gray-900/80 border-4 border-purple-500/40 focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-500/50 transition-all text-xl font-bold placeholder-gray-600 hover:border-purple-500/60"
            placeholder="Your Epic Room..."
          />
        </div>

        <div class="grid md:grid-cols-2 gap-6">
          <div class="group bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-2xl p-6 border-4 border-purple-500/40 hover:border-purple-400/60 transition-all hover:shadow-xl hover:shadow-purple-500/30">
            <label class="block text-lg font-black mb-4 text-purple-300 flex items-center gap-2">
              <span class="text-2xl">👥</span> MAX PLAYERS
            </label>
            <div class="text-center mb-4 relative">
              <div class="absolute inset-0 bg-purple-600 rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity"></div>
              <span class="relative text-6xl font-black text-white drop-shadow-2xl">{{ maxPlayers }}</span>
              <span class="relative text-gray-400 text-sm ml-2 font-bold">players</span>
            </div>
            <input 
              v-model.number="maxPlayers"
              type="range"
              min="3"
              max="10"
              class="w-full h-4 bg-purple-900/50 rounded-full appearance-none cursor-pointer slider-purple hover:h-5 transition-all"
            />
            <div class="flex justify-between text-sm text-gray-400 mt-2 font-bold">
              <span>3</span>
              <span>10</span>
            </div>
          </div>

          <div class="group bg-gradient-to-br from-pink-900/30 to-pink-800/20 rounded-2xl p-6 border-4 border-pink-500/40 hover:border-pink-400/60 transition-all hover:shadow-xl hover:shadow-pink-500/30">
            <label class="block text-lg font-black mb-4 text-pink-300 flex items-center gap-2">
              <span class="text-2xl">🎭</span> IMPOSTORS
            </label>
            <div class="text-center mb-4 relative">
              <div class="absolute inset-0 bg-pink-600 rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity"></div>
              <span class="relative text-6xl font-black text-white drop-shadow-2xl">{{ impostorCount }}</span>
              <span class="relative text-gray-400 text-sm ml-2 font-bold">impostor{{ impostorCount > 1 ? 's' : '' }}</span>
            </div>
            <input 
              v-model.number="impostorCount"
              type="range"
              min="1"
              :max="Math.max(1, Math.floor(maxPlayers / 2))"
              class="w-full h-4 bg-pink-900/50 rounded-full appearance-none cursor-pointer slider-pink hover:h-5 transition-all"
            />
            <div class="flex justify-between text-sm text-gray-400 mt-2 font-bold">
              <span>1</span>
              <span>{{ Math.floor(maxPlayers / 2) }}</span>
            </div>
          </div>
        </div>

        <div class="grid md:grid-cols-2 gap-6">
          <div class="group bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-2xl p-6 border-4 border-blue-500/40 hover:border-blue-400/60 transition-all hover:shadow-xl hover:shadow-blue-500/30">
            <label class="block text-lg font-black mb-4 text-blue-300 flex items-center gap-2">
              <span class="text-2xl">💬</span> DISCUSSION
            </label>
            <div class="text-center mb-4 relative">
              <div class="absolute inset-0 bg-blue-600 rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity"></div>
              <span class="relative text-6xl font-black text-white drop-shadow-2xl">{{ Math.floor(discussionTime / 60) }}:{{ String(discussionTime % 60).padStart(2, '0') }}</span>
            </div>
            <input 
              v-model.number="discussionTime"
              type="range"
              min="30"
              max="300"
              step="30"
              class="w-full h-4 bg-blue-900/50 rounded-full appearance-none cursor-pointer slider-blue hover:h-5 transition-all"
            />
            <div class="flex justify-between text-sm text-gray-400 mt-2 font-bold">
              <span>30s</span>
              <span>5min</span>
            </div>
          </div>

          <div class="group bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-2xl p-6 border-4 border-green-500/40 hover:border-green-400/60 transition-all hover:shadow-xl hover:shadow-green-500/30">
            <label class="block text-lg font-black mb-4 text-green-300 flex items-center gap-2">
              <span class="text-2xl">🗳️</span> VOTING
            </label>
            <div class="text-center mb-4 relative">
              <div class="absolute inset-0 bg-green-600 rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity"></div>
              <span class="relative text-6xl font-black text-white drop-shadow-2xl">{{ votingTime }}</span>
              <span class="relative text-gray-400 text-sm ml-1 font-bold">s</span>
            </div>
            <input 
              v-model.number="votingTime"
              type="range"
              min="20"
              max="120"
              step="10"
              class="w-full h-4 bg-green-900/50 rounded-full appearance-none cursor-pointer slider-green hover:h-5 transition-all"
            />
            <div class="flex justify-between text-sm text-gray-400 mt-2 font-bold">
              <span>20s</span>
              <span>2min</span>
            </div>
          </div>
        </div>

        <div class="group flex items-center bg-gradient-to-r from-cyan-900/30 to-cyan-800/20 rounded-2xl p-6 border-4 border-cyan-500/40 hover:border-cyan-400/60 transition-all cursor-pointer hover:shadow-xl hover:shadow-cyan-500/30">
          <input 
            v-model="voiceChatEnabled"
            type="checkbox"
            id="voice"
            class="w-7 h-7 rounded-lg accent-cyan-600 cursor-pointer"
          />
          <label for="voice" class="ml-4 cursor-pointer flex-1 font-black text-xl text-cyan-300 flex items-center gap-2">
            <span class="text-2xl">🎤</span> VOICE CHAT
          </label>
          <span v-if="voiceChatEnabled" class="text-green-400 text-lg font-black px-4 py-1 bg-green-900/50 rounded-full border-2 border-green-500/50">ON</span>
          <span v-else class="text-gray-500 text-lg font-bold px-4 py-1 bg-gray-900/50 rounded-full border-2 border-gray-700/50">OFF</span>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="group relative w-full bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 py-6 rounded-2xl font-black text-3xl hover:from-purple-500 hover:via-purple-400 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:shadow-purple-500/60 transform hover:scale-105 active:scale-95 overflow-hidden"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <span class="relative flex items-center justify-center gap-3">
            <span class="text-4xl group-hover:rotate-90 transition-all duration-300">{{ loading ? '⏳' : '🚀' }}</span>
            <span class="tracking-wider">{{ loading ? 'CREATING...' : 'CREATE ROOM' }}</span>
          </span>
        </button>

        <router-link 
          to="/"
          class="block text-center text-gray-400 hover:text-gray-200 transition-colors font-bold text-lg hover:scale-110 transform inline-block"
        >
          ← Back to Home
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
const discussionTime = ref(120)
const votingTime = ref(60)
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
        discussion_time: discussionTime.value,
        voting_time: votingTime.value,
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
    
    if (participantError) throw participantError
    
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
/* Custom slider styling - Purple */
.slider-purple::-webkit-slider-thumb {
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #a855f7, #9333ea);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(168, 85, 247, 0.5);
  transition: all 0.2s;
}

.slider-purple::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.7);
}

.slider-purple::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #a855f7, #9333ea);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(168, 85, 247, 0.5);
  transition: all 0.2s;
}

.slider-purple::-moz-range-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.7);
}

/* Pink slider */
.slider-pink::-webkit-slider-thumb {
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ec4899, #db2777);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(236, 72, 153, 0.5);
  transition: all 0.2s;
}

.slider-pink::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.7);
}

.slider-pink::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ec4899, #db2777);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(236, 72, 153, 0.5);
  transition: all 0.2s;
}

/* Blue slider */
.slider-blue::-webkit-slider-thumb {
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
  transition: all 0.2s;
}

.slider-blue::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
}

/* Green slider */
.slider-green::-webkit-slider-thumb {
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.5);
  transition: all 0.2s;
}

.slider-green::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.5);
}
</style>
