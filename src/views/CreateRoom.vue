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
          <label class="block text-sm font-medium mb-2">Max Players (4-10)</label>
          <input 
            v-model.number="maxPlayers"
            type="number"
            min="4"
            max="10"
            required
            class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Discussion Time (seconds)</label>
          <input 
            v-model.number="discussionTime"
            type="number"
            min="30"
            max="300"
            required
            class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Voting Time (seconds)</label>
          <input 
            v-model.number="votingTime"
            type="number"
            min="20"
            max="120"
            required
            class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Number of Rounds</label>
          <input 
            v-model.number="rounds"
            type="number"
            min="1"
            max="10"
            required
            class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Topic (Optional)</label>
          <input 
            v-model="topic"
            type="text"
            maxlength="50"
            class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none"
            placeholder="e.g., Animals, Countries, Food"
          />
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const router = useRouter()

const roomName = ref('')
const maxPlayers = ref(8)
const discussionTime = ref(120)
const votingTime = ref(60)
const rounds = ref(3)
const topic = ref('')
const voiceChatEnabled = ref(true)
const loading = ref(false)

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
    const roomCode = generateRoomCode()
    
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({
        code: roomCode,
        name: roomName.value,
        host_id: session.user.id,
        max_players: maxPlayers.value,
        discussion_time: discussionTime.value,
        voting_time: votingTime.value,
        rounds: rounds.value,
        topic: topic.value || null,
        voice_chat_enabled: voiceChatEnabled.value,
        status: 'WAITING'
      })
      .select()
      .single()
    
    if (roomError) throw roomError
    
    // Add host as participant
    await supabase.from('room_participants').insert({
      room_id: room.id,
      user_id: session.user.id,
      is_host: true
    })
    
    router.push(`/lobby/${roomCode}`)
  } catch (error) {
    alert('Error creating room: ' + error.message)
  } finally {
    loading.value = false
  }
}
</script>
