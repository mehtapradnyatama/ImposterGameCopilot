<template>
  <div class="min-h-screen flex items-center justify-center p-4 pixel-grid">
    <div class="max-w-lg w-full bg-black border-8 border-yellow-400 p-10 animate-slide-in-up" style="box-shadow: 8px 8px 0 rgba(234, 179, 8, 0.5);">
      
      <!-- Title Screen -->
      <div class="text-center mb-8">
        <div class="text-yellow-400 text-xs mb-4 animate-blink score-display">
          █ ENTER ROOM CODE █
        </div>
        <h1 class="text-4xl md:text-5xl font-bold mb-4 text-arcade text-yellow-400 score-display">
          JOIN GAME
        </h1>
      </div>
      
      <form @submit.prevent="joinRoom" class="space-y-6">
        
        <!-- Room Code Input - Arcade High Score Style -->
        <div>
          <label class="block text-xs mb-4 text-center text-yellow-400 score-display">
            ■ ROOM CODE ■
          </label>
          <div class="bg-gray-900 border-4 border-yellow-400 p-4" style="box-shadow: 6px 6px 0 rgba(234, 179, 8, 0.8);">
            <input 
              v-model="roomCode"
              type="text"
              required
              maxlength="6"
              class="w-full px-6 py-6 bg-black border-4 border-yellow-500 focus:border-yellow-300 focus:outline-none text-5xl text-center uppercase tracking-widest font-black transition-all placeholder-gray-700 score-display text-yellow-400"
              placeholder="------"
              @input="roomCode = roomCode.toUpperCase()"
            />
          </div>
          <p class="text-xs text-gray-400 mt-4 text-center score-display">ENTER 6 CHARACTERS</p>
        </div>

        <!-- Enter Button - Blue Arcade Style -->
        <button
          type="submit"
          :disabled="loading || roomCode.length !== 6"
          class="w-full bg-blue-500 border-4 border-blue-700 px-8 py-6 text-2xl hover:bg-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed score-display text-white btn-retro"
        >
          <span class="animate-blink">▶</span> {{ loading ? 'LOADING...' : 'ENTER GAME' }}
        </button>

        <router-link 
          to="/"
          class="block text-center text-gray-400 hover:text-white transition-colors text-xs score-display"
        >
          [PRESS ESC TO EXIT]
        </router-link>
      </form>

      <!-- Error Message - Red Arcade Alert -->
      <div v-if="error" class="mt-6 bg-red-600 border-4 border-red-800 p-4 animate-pixel-pulse" style="box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.8);">
        <p class="text-white text-xs text-center font-black score-display flex items-center justify-center gap-2">
          <span class="text-xl">!</span>
          {{ error.toUpperCase() }}
          <span class="text-xl">!</span>
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
      const { error: insertError } = await supabase.from('room_participants').insert({
        room_id: room.id,
        user_id: session.user.id,
        is_host: false
      })
      
      if (insertError) {
        console.error('Error inserting participant:', insertError)
        error.value = 'Failed to join room'
        return
      }
      
      // Wait for database to sync
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    
    router.push(`/lobby/${roomCode.value}`)
  } catch (err) {
    error.value = 'Error joining room: ' + err.message
  } finally {
    loading.value = false
  }
}
</script>
