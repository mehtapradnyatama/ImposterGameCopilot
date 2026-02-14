<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white/10 backdrop-blur-sm rounded-xl p-8">
      <h1 class="text-4xl font-bold mb-8 text-center">Join Room</h1>
      
      <form @submit.prevent="joinRoom" class="space-y-6">
        <div>
          <label class="block text-sm font-medium mb-2">Room Code</label>
          <input 
            v-model="roomCode"
            type="text"
            required
            maxlength="6"
            class="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none text-2xl text-center uppercase tracking-widest font-bold"
            placeholder="ABC123"
            @input="roomCode = roomCode.toUpperCase()"
          />
          <p class="text-xs text-gray-400 mt-2">Enter the 6-character room code</p>
        </div>

        <button
          type="submit"
          :disabled="loading || roomCode.length !== 6"
          class="w-full bg-pink-600 py-4 rounded-lg font-bold text-lg hover:bg-pink-700 transition disabled:opacity-50"
        >
          {{ loading ? 'Joining...' : 'Join Room' }}
        </button>

        <router-link 
          to="/"
          class="block text-center text-gray-400 hover:text-gray-300"
        >
          Back to Home
        </router-link>
      </form>

      <div v-if="error" class="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const router = useRouter()

const roomCode = ref('')
const loading = ref(false)
const error = ref('')

const joinRoom = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    // Check if room exists
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', roomCode.value)
      .single()
    
    if (roomError || !room) {
      error.value = 'Room not found'
      return
    }
    
    if (room.status !== 'WAITING') {
      error.value = 'Room has already started or ended'
      return
    }
    
    // Check current participants count
    const { count } = await supabase
      .from('room_participants')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', room.id)
    
    if (count >= room.max_players) {
      error.value = 'Room is full'
      return
    }
    
    // Check if already joined
    const { data: existing } = await supabase
      .from('room_participants')
      .select('*')
      .eq('room_id', room.id)
      .eq('user_id', session.user.id)
      .single()
    
    if (!existing) {
      // Add participant
      await supabase.from('room_participants').insert({
        room_id: room.id,
        user_id: session.user.id,
        is_host: false
      })
    }
    
    router.push(`/lobby/${roomCode.value}`)
  } catch (err) {
    error.value = 'Error joining room: ' + err.message
  } finally {
    loading.value = false
  }
}
</script>
