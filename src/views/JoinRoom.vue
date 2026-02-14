<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
      <h1 class="text-4xl font-bold mb-2 text-center bg-gradient-to-r from-pink-400 to-purple-600 bg-clip-text text-transparent">Join Room</h1>
      <p class="text-center text-gray-400 mb-8">Enter the room code to join</p>
      
      <form @submit.prevent="joinRoom" class="space-y-6">
        <div>
          <label class="block text-sm font-semibold mb-3 text-gray-300">Room Code</label>
          <input 
            v-model="roomCode"
            type="text"
            required
            maxlength="6"
            class="w-full px-6 py-4 rounded-xl bg-white/5 border-2 border-white/20 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 text-3xl text-center uppercase tracking-[0.5em] font-bold transition-all"
            placeholder="ABC123"
            @input="roomCode = roomCode.toUpperCase()"
          />
          <p class="text-xs text-gray-500 mt-2 text-center">Enter the 6-character code</p>
        </div>

        <button
          type="submit"
          :disabled="loading || roomCode.length !== 6"
          class="w-full bg-gradient-to-r from-pink-600 to-purple-600 py-4 rounded-xl font-bold text-lg hover:from-pink-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-pink-500/50 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {{ loading ? 'Joining...' : 'Join Room' }}
        </button>

        <router-link 
          to="/"
          class="block text-center text-gray-400 hover:text-gray-300 transition-colors"
        >
          ← Back to Home
        </router-link>
      </form>

      <div v-if="error" class="mt-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl backdrop-blur-sm">
        <p class="text-red-400 text-sm text-center font-medium">{{ error }}</p>
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
