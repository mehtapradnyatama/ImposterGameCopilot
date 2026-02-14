<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white/10 backdrop-blur-sm rounded-xl p-8">
      <h1 class="text-4xl font-bold mb-8 text-center">Create Room</h1>
      
      <form @submit.prevent="createRoom" class="space-y-6">
        <div>
          <label class="block text-sm font-medium mb-2">Room Name</label>
          <input 
            v-model="roomName"
            type="text"
            required
            maxlength="50"
            class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none"
            placeholder="My Awesome Room"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">
            Max Players: {{ maxPlayers }}
            <span class="text-gray-400 text-xs ml-2">(min: 3)</span>
          </label>
          <input 
            v-model.number="maxPlayers"
            type="range"
            min="3"
            max="10"
            class="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
          />
          <div class="flex justify-between text-xs text-gray-400 mt-1">
            <span>3</span>
            <span>10</span>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">
            Impostor Count: {{ impostorCount }}
          </label>
          <input 
            v-model.number="impostorCount"
            type="range"
            min="1"
            :max="Math.max(1, Math.floor(maxPlayers / 2))"
            class="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
          />
          <div class="flex justify-between text-xs text-gray-400 mt-1">
            <span>1</span>
            <span>{{ Math.floor(maxPlayers / 2) }}</span>
          </div>
          <p class="text-xs text-gray-400 mt-1">Max: half of max players</p>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">
            Discussion Time: {{ discussionTime }}s
          </label>
          <input 
            v-model.number="discussionTime"
            type="range"
            min="30"
            max="300"
            step="30"
            class="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
          />
          <div class="flex justify-between text-xs text-gray-400 mt-1">
            <span>30s</span>
            <span>5min</span>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">
            Voting Time: {{ votingTime }}s
          </label>
          <input 
            v-model.number="votingTime"
            type="range"
            min="20"
            max="120"
            step="10"
            class="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
          />
          <div class="flex justify-between text-xs text-gray-400 mt-1">
            <span>20s</span>
            <span>2min</span>
          </div>
        </div>

        <div class="flex items-center">
          <input 
            v-model="voiceChatEnabled"
            type="checkbox"
            id="voice"
            class="w-5 h-5 rounded"
          />
          <label for="voice" class="ml-2">Enable Voice Chat</label>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-purple-600 py-4 rounded-lg font-bold text-lg hover:bg-purple-700 transition disabled:opacity-50"
        >
          {{ loading ? 'Creating...' : 'Create Room' }}
        </button>

        <router-link 
          to="/"
          class="block text-center text-gray-400 hover:text-gray-300"
        >
          Back to Home
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
/* Custom slider styling */
.slider::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #a855f7;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #a855f7;
  cursor: pointer;
  border: none;
}

.slider::-webkit-slider-runnable-track {
  background: linear-gradient(to right, #a855f7 0%, #a855f7 var(--value), rgba(255,255,255,0.2) var(--value), rgba(255,255,255,0.2) 100%);
  height: 8px;
  border-radius: 4px;
}
</style>
