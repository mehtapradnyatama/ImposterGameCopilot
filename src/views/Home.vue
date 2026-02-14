<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-4">
    <div class="max-w-2xl w-full text-center space-y-8 animate-fade-in">
      <!-- Title with gradient -->
      <h1 class="text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
        Imposter Word Game
      </h1>
      
      <p class="text-xl text-gray-400 max-w-xl mx-auto">
        A social deduction game where players must identify who has a different word through discussion and voting.
      </p>

      <!-- Feature cards -->
      <div class="grid md:grid-cols-3 gap-6 mt-12">
        <div class="group bg-gradient-to-br from-purple-600/20 to-purple-900/40 backdrop-blur-sm rounded-2xl p-6 hover:from-purple-500/30 hover:to-purple-800/50 transition-all duration-300 border-2 border-purple-500/30 hover:border-purple-400/60 hover:shadow-2xl hover:shadow-purple-500/30 hover:-translate-y-2">
          <div class="relative mb-4">
            <div class="absolute inset-0 bg-purple-500 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div class="relative w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-700 rounded-xl flex items-center justify-center text-white font-black text-3xl group-hover:rotate-12 transition-all duration-300 shadow-lg">
              <svg class="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>
            </div>
          </div>
          <h3 class="font-bold text-xl mb-2 text-purple-300">Strategic Gameplay</h3>
          <p class="text-sm text-gray-300">Use your words wisely to find the impostor</p>
        </div>
        <div class="group bg-gradient-to-br from-pink-600/20 to-rose-900/40 backdrop-blur-sm rounded-2xl p-6 hover:from-pink-500/30 hover:to-rose-800/50 transition-all duration-300 border-2 border-pink-500/30 hover:border-pink-400/60 hover:shadow-2xl hover:shadow-pink-500/30 hover:-translate-y-2">
          <div class="relative mb-4">
            <div class="absolute inset-0 bg-pink-500 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div class="relative w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-700 rounded-xl flex items-center justify-center text-white font-black text-3xl group-hover:scale-110 transition-all duration-300 shadow-lg">
              <svg class="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd"/></svg>
            </div>
          </div>
          <h3 class="font-bold text-xl mb-2 text-pink-300">Voice Chat</h3>
          <p class="text-sm text-gray-300">Real-time voice communication</p>
        </div>
        <div class="group bg-gradient-to-br from-cyan-600/20 to-blue-900/40 backdrop-blur-sm rounded-2xl p-6 hover:from-cyan-500/30 hover:to-blue-800/50 transition-all duration-300 border-2 border-cyan-500/30 hover:border-cyan-400/60 hover:shadow-2xl hover:shadow-cyan-500/30 hover:-translate-y-2">
          <div class="relative mb-4">
            <div class="absolute inset-0 bg-cyan-500 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div class="relative w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-700 rounded-xl flex items-center justify-center text-white font-black text-3xl group-hover:rotate-180 transition-all duration-500 shadow-lg">
              <svg class="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/></svg>
            </div>
          </div>
          <h3 class="font-bold text-xl mb-2 text-cyan-300">Real-time Sync</h3>
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
          <div class="flex items-center justify-center gap-4 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <img :src="user.user_metadata.avatar_url" class="w-16 h-16 rounded-full border-2 border-purple-500 shadow-lg" />
            <div class="text-left">
              <p class="font-bold text-xl">{{ user.user_metadata.full_name }}</p>
              <p class="text-gray-400 text-sm">{{ user.email }}</p>
            </div>
          </div>

          <div class="flex gap-4 justify-center">
            <router-link 
              to="/create-room"
              class="group relative bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 px-10 py-5 rounded-2xl font-black text-xl hover:from-purple-500 hover:via-purple-400 hover:to-pink-500 transition-all transform hover:scale-110 shadow-2xl hover:shadow-purple-500/60 animate-pulse-slow overflow-hidden"
            >
              <div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <span class="relative flex items-center gap-3">
                <span class="text-3xl group-hover:rotate-90 transition-all duration-300">+</span>
                <span class="tracking-wide">CREATE ROOM</span>
              </span>
            </router-link>
            
            <router-link 
              to="/join-room"
              class="group relative bg-gradient-to-r from-pink-600 via-rose-500 to-orange-600 px-10 py-5 rounded-2xl font-black text-xl hover:from-pink-500 hover:via-rose-400 hover:to-orange-500 transition-all transform hover:scale-110 shadow-2xl hover:shadow-pink-500/60 overflow-hidden"
            >
              <div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <span class="relative flex items-center gap-3">
                <span class="tracking-wide">JOIN ROOM</span>
                <span class="text-3xl group-hover:translate-x-2 transition-all duration-300">»</span>
              </span>
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
