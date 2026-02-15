<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-4 pixel-grid">
    
    <!-- BGM Toggle Button (Fixed Top-Right) -->
    <button 
      @click="toggleBGM"
      class="fixed top-4 right-4 z-50 bg-black border-4 px-4 py-2 transition-all hover:scale-110 score-display text-sm"
      :class="isBgmPlaying ? 'border-green-400 text-green-400' : 'border-gray-600 text-gray-600'"
      style="box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.8);"
    >
      {{ isBgmPlaying ? '🔊 BGM ON' : '🔇 BGM OFF' }}
    </button>
    
    <div class="max-w-4xl w-full text-center space-y-8">
      
      <!-- Arcade Title Screen -->
      <div class="arcade-screen border-8 border-yellow-400 p-8 mb-8 animate-slide-in-up" style="box-shadow: 8px 8px 0 rgba(234, 179, 8, 0.5);">
        <!-- Blinking "INSERT COIN" -->
        <div class="text-yellow-400 text-sm mb-4 animate-blink score-display">
          █ INSERT COIN █
        </div>
        
        <!-- Game Title -->
        <h1 class="text-5xl md:text-7xl font-bold mb-6 text-arcade" style="color: #FFD700; line-height: 1.4;">
          IMPOSTOR<br/>
          WORD<br/>
          GAME
        </h1>
        
        <!-- Subtitle -->
        <div class="text-white text-xs md:text-sm score-display max-w-2xl mx-auto mb-6" style="line-height: 1.8;">
          FIND THE IMPOSTOR<br/>
          THROUGH WORDS
        </div>

        <!-- High Score Display -->
        <div class="flex justify-center gap-8 mb-6">
          <div class="text-left">
            <div class="text-red-500 text-xs score-display">1UP</div>
            <div class="text-white text-lg score-display">000000</div>
          </div>
          <div class="text-left">
            <div class="text-cyan-400 text-xs score-display">HI-SCORE</div>
            <div class="text-white text-lg score-display">999999</div>
          </div>
        </div>
      </div>

      <!-- Feature Cards - Retro Style -->
      <div class="grid md:grid-cols-3 gap-6 mb-8">
        <div class="bg-blue-600 border-4 border-blue-800 p-6 animate-slide-in-left" style="box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.8);">
          <div class="text-6xl mb-4">■</div>
          <div class="text-white text-xs score-display" style="line-height: 1.8;">
            STRATEGIC<br/>GAMEPLAY
          </div>
        </div>
        <div class="bg-red-600 border-4 border-red-800 p-6 animate-slide-in-up" style="box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.8); animation-delay: 0.1s;">
          <div class="text-6xl mb-4">●</div>
          <div class="text-white text-xs score-display" style="line-height: 1.8;">
            VOICE<br/>CHAT
          </div>
        </div>
        <div class="bg-green-600 border-4 border-green-800 p-6 animate-slide-in-right" style="box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.8); animation-delay: 0.2s;">
          <div class="text-6xl mb-4">▲</div>
          <div class="text-white text-xs score-display" style="line-height: 1.8;">
            REAL-TIME<br/>SYNC
          </div>
        </div>
      </div>

      <!-- Auth Section -->
      <div class="mt-12 space-y-6">
        <button 
          v-if="!user"
          @click="signInWithGoogle"
          :disabled="loading"
          class="bg-white text-black border-4 border-gray-300 px-12 py-6 font-bold text-sm hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center justify-center gap-4 mx-auto score-display"
          style="box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.8);"
        >
          <svg class="w-8 h-8" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {{ loading ? 'LOADING...' : 'SIGN IN' }}
        </button>

        <div v-else class="space-y-8">
          <!-- Player Info -->
          <div class="flex items-center justify-center gap-4 bg-gray-900 border-4 border-gray-700 p-6" style="box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.8);">
            <img :src="user.user_metadata.avatar_url" class="w-16 h-16 border-4 border-yellow-400" style="image-rendering: pixelated;" />
            <div class="text-left">
              <p class="text-yellow-400 text-xs score-display mb-1">PLAYER 1</p>
              <p class="text-white text-sm score-display">{{ user.user_metadata.full_name.toUpperCase() }}</p>
            </div>
          </div>

          <!-- PRESS START Buttons -->
          <div class="space-y-4">
            <router-link 
              to="/create-room"
              @click="handleNavigation"
              class="block bg-green-500 border-4 border-green-700 px-8 py-6 text-2xl hover:bg-green-400 transition-all mx-auto max-w-md score-display btn-retro"
            >
              <span class="animate-blink">▶</span> START GAME
            </router-link>
            
            <router-link 
              to="/join-room"
              @click="handleNavigation"
              class="block bg-blue-500 border-4 border-blue-700 px-8 py-6 text-2xl hover:bg-blue-400 transition-all mx-auto max-w-md score-display btn-retro"
            >
              <span class="animate-blink">▶</span> JOIN GAME
            </router-link>

            <router-link 
              to="/leaderboard"
              @click="handleNavigation"
              class="block bg-yellow-500 text-black border-4 border-yellow-700 px-8 py-6 text-xl hover:bg-yellow-400 transition-all mx-auto max-w-md score-display btn-retro"
            >
              ★ HIGH SCORES ★
            </router-link>
          </div>

          <button 
            @click="signOut"
            class="text-red-500 hover:text-red-400 text-xs score-display block mx-auto mt-8"
          >
            [PRESS X TO EXIT]
          </button>
        </div>
      </div>

      <!-- Credits -->
      <div class="text-gray-600 text-xs score-display mt-12">
        © 2026 ARCADE STUDIOS
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAudio, sfx } from '@/composables/useAudio'

const user = ref(null)
const loading = ref(false)

// Audio controls
const { playBGM, toggleBGM, isBgmPlaying, setBGMVolume } = useAudio()

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user) {
    // Ensure user profile exists in database
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
  }
  user.value = session?.user || null
  
  // Start BGM (Note: might not work until user clicks due to browser autoplay policy)
  setTimeout(() => playBGM('game-bgm'), 500)
})

const signInWithGoogle = async () => {
  sfx.click() // Play click sound
  loading.value = true
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  if (error) {
    sfx.error() // Play error sound
    alert(error.message)
  }
  loading.value = false
}

const signOut = async () => {
  sfx.click()
  await supabase.auth.signOut()
  user.value = null
}

const handleNavigation = () => {
  sfx.click()
}
</script>
