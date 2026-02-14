<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="max-w-2xl w-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
      <h1 class="text-4xl font-bold mb-2 text-center bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">Create New Room</h1>
      <p class="text-center text-gray-400 mb-8">Configure your game settings</p>
      
      <form @submit.prevent="createRoom" class="space-y-6">
        <div>
          <label class="block text-sm font-semibold mb-2 text-gray-300">Room Name</label>
          <input 
            v-model="roomName"
            type="text"
            required
            maxlength="50"
            class="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
            placeholder="Enter room name..."
          />
        </div>

        <div class="grid md:grid-cols-2 gap-6">
          <div class="bg-white/5 rounded-xl p-4 border border-white/10">
            <label class="block text-sm font-semibold mb-3 text-gray-300">
              Max Players
            </label>
            <div class="text-center mb-3">
              <span class="text-4xl font-bold text-purple-400">{{ maxPlayers }}</span>
              <span class="text-gray-400 text-sm ml-2">players</span>
            </div>
            <input 
              v-model.number="maxPlayers"
              type="range"
              min="3"
              max="10"
              class="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer slider-purple"
            />
            <div class="flex justify-between text-xs text-gray-500 mt-2">
              <span>3</span>
              <span>10</span>
            </div>
          </div>

          <div class="bg-white/5 rounded-xl p-4 border border-white/10">
            <label class="block text-sm font-semibold mb-3 text-gray-300">
              Impostors
            </label>
            <div class="text-center mb-3">
              <span class="text-4xl font-bold text-pink-400">{{ impostorCount }}</span>
              <span class="text-gray-400 text-sm ml-2">impostor{{ impostorCount > 1 ? 's' : '' }}</span>
            </div>
            <input 
              v-model.number="impostorCount"
              type="range"
              min="1"
              :max="Math.max(1, Math.floor(maxPlayers / 2))"
              class="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer slider-pink"
            />
            <div class="flex justify-between text-xs text-gray-500 mt-2">
              <span>1</span>
              <span>{{ Math.floor(maxPlayers / 2) }}</span>
            </div>
          </div>
        </div>

        <div class="grid md:grid-cols-2 gap-6">
          <div class="bg-white/5 rounded-xl p-4 border border-white/10">
            <label class="block text-sm font-semibold mb-3 text-gray-300">
              Discussion Time
            </label>
            <div class="text-center mb-3">
              <span class="text-4xl font-bold text-blue-400">{{ Math.floor(discussionTime / 60) }}:{{ String(discussionTime % 60).padStart(2, '0') }}</span>
            </div>
            <input 
              v-model.number="discussionTime"
              type="range"
              min="30"
              max="300"
              step="30"
              class="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer slider-blue"
            />
            <div class="flex justify-between text-xs text-gray-500 mt-2">
              <span>30s</span>
              <span>5min</span>
            </div>
          </div>

          <div class="bg-white/5 rounded-xl p-4 border border-white/10">
            <label class="block text-sm font-semibold mb-3 text-gray-300">
              Voting Time
            </label>
            <div class="text-center mb-3">
              <span class="text-4xl font-bold text-green-400">{{ votingTime }}s</span>
            </div>
            <input 
              v-model.number="votingTime"
              type="range"
              min="20"
              max="120"
              step="10"
              class="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer slider-green"
            />
            <div class="flex justify-between text-xs text-gray-500 mt-2">
              <span>20s</span>
              <span>2min</span>
            </div>
          </div>
        </div>

        <div class="flex items-center bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-colors">
          <input 
            v-model="voiceChatEnabled"
            type="checkbox"
            id="voice"
            class="w-5 h-5 rounded accent-purple-600 cursor-pointer"
          />
          <label for="voice" class="ml-3 cursor-pointer flex-1 font-medium">Enable Voice Chat</label>
          <span v-if="voiceChatEnabled" class="text-green-400 text-sm font-semibold">ON</span>
          <span v-else class="text-gray-500 text-sm">OFF</span>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-4 rounded-xl font-bold text-lg hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/50 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {{ loading ? 'Creating Room...' : 'Create Room' }}
        </button>

        <router-link 
          to="/"
          class="block text-center text-gray-400 hover:text-gray-300 transition-colors"
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
