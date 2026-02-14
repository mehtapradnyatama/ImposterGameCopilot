<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-lg rounded-3xl p-10 border-4 border-pink-500/40 shadow-2xl shadow-pink-500/30 animate-popup">
      <div class="text-center mb-8 animate-bounce-slow">
        <h1 class="text-6xl font-black mb-3 bg-gradient-to-r from-pink-400 via-rose-400 to-purple-400 bg-clip-text text-transparent drop-shadow-2xl">JOIN ROOM</h1>
        <div class="relative inline-block">
          <div class="absolute -inset-4 bg-gradient-to-r from-pink-600/50 to-purple-600/50 rounded-full blur-2xl animate-pulse"></div>
          <p class="relative text-gray-300 text-xl font-bold tracking-wide px-6 py-2 bg-gray-900/60 rounded-full border-2 border-pink-500/50">
            Enter the code
          </p>
        </div>
      </div>
      
      <form @submit.prevent="joinRoom" class="space-y-6">
        <div class="group">
          <label class="block text-lg font-black mb-3 text-pink-300 flex items-center justify-center gap-2">
            <span class="text-2xl">🔑</span> ROOM CODE
          </label>
          <div class="relative">
            <div class="absolute inset-0 bg-pink-600 rounded-2xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <input 
              v-model="roomCode"
              type="text"
              required
              maxlength="6"
              class="relative w-full px-6 py-6 rounded-2xl bg-gray-900/90 border-4 border-pink-500/50 focus:border-pink-400 focus:outline-none focus:ring-4 focus:ring-pink-500/50 text-5xl text-center uppercase tracking-[0.3em] font-black transition-all placeholder-gray-700 hover:border-pink-500/70"
              placeholder="ABC123"
              @input="roomCode = roomCode.toUpperCase()"
            />
          </div>
          <p class="text-sm text-gray-400 mt-3 text-center font-bold">Enter the 6-character code</p>
        </div>

        <button
          type="submit"
          :disabled="loading || roomCode.length !== 6"
          class="group relative w-full bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 py-6 rounded-2xl font-black text-3xl hover:from-pink-500 hover:via-rose-400 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:shadow-pink-500/60 transform hover:scale-105 active:scale-95 overflow-hidden"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <span class="relative flex items-center justify-center gap-3">
            <span class="text-3xl group-hover:translate-x-2 transition-all duration-300">{{ loading ? '⏳' : '🚪' }}</span>
            <span class="tracking-wider">{{ loading ? 'JOINING...' : 'JOIN ROOM' }}</span>
          </span>
        </button>

        <router-link 
          to="/"
          class="block text-center text-gray-400 hover:text-gray-200 transition-colors font-bold text-lg hover:scale-110 transform inline-block"
        >
          ← Back to Home
        </router-link>
      </form>

      <div v-if="error" class="mt-6 p-4 bg-red-900/50 border-4 border-red-500/60 rounded-2xl backdrop-blur-sm animate-shake">
        <p class="text-red-300 text-base text-center font-black flex items-center justify-center gap-2">
          <span class="text-2xl">⚠️</span>
          {{ error }}
        </p>
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
