<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-4">
    <div class="max-w-2xl w-full text-center space-y-8 animate-fade-in">
      <!-- Title with gradient -->
      <h1 class="text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
        Imposter Word Game
      </h1>
      
      <p class="text-xl text-gray-300">
        Find the imposter who doesn't know the secret word!
      </p>

      <!-- Feature cards -->
      <div class="grid md:grid-cols-3 gap-4 mt-12">
        <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition">
          <div class="text-4xl mb-2">🎯</div>
          <h3 class="font-bold mb-2">Strategic</h3>
          <p class="text-sm text-gray-300">Use your words wisely to find the imposter</p>
        </div>
        <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition">
          <div class="text-4xl mb-2">🎤</div>
          <h3 class="font-bold mb-2">Voice Chat</h3>
          <p class="text-sm text-gray-300">Real-time voice communication</p>
        </div>
        <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition">
          <div class="text-4xl mb-2">⚡</div>
          <h3 class="font-bold mb-2">Real-time</h3>
          <p class="text-sm text-gray-300">Instant updates for all players</p>
        </div>
      </div>

      <!-- Auth Section -->
      <div class="mt-12 space-y-4">
        <button 
          v-if="!user"
          @click="signInWithGoogle"
          :disabled="loading"
          class="bg-white text-gray-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-3 mx-auto"
        >
          <svg class="w-6 h-6" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {{ loading ? 'Signing in...' : 'Sign in with Google' }}
        </button>

        <div v-else class="space-y-6">
          <div class="flex items-center justify-center gap-4">
            <img :src="user.user_metadata.avatar_url" class="w-16 h-16 rounded-full border-4 border-purple-500" />
            <div class="text-left">
              <p class="font-bold text-xl">{{ user.user_metadata.full_name }}</p>
              <p class="text-gray-400">{{ user.email }}</p>
            </div>
          </div>

          <div class="flex gap-4 justify-center">
            <router-link 
              to="/create-room"
              class="bg-purple-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-purple-700 transition-all transform hover:scale-105"
            >
              Create Room
            </router-link>
            
            <router-link 
              to="/join-room"
              class="bg-pink-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-pink-700 transition-all transform hover:scale-105"
            >
              Join Room
            </router-link>
          </div>

          <router-link 
            to="/leaderboard"
            class="text-purple-400 hover:text-purple-300 underline inline-block"
          >
            View Leaderboard
          </router-link>

          <button 
            @click="signOut"
            class="text-gray-400 hover:text-gray-300 underline block mx-auto"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'

const user = ref(null)
const loading = ref(false)

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  user.value = session?.user || null
})

const signInWithGoogle = async () => {
  loading.value = true
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  if (error) alert(error.message)
  loading.value = false
}

const signOut = async () => {
  await supabase.auth.signOut()
  user.value = null
}
</script>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out;
}
</style>
