<template>
  <div class="min-h-screen p-4">
    <div class="max-w-5xl mx-auto space-y-6">
      <!-- Room Header -->
      <div class="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-lg rounded-3xl p-8 border-4 border-purple-500/40 shadow-2xl shadow-purple-500/30 animate-popup">
        <div class="flex justify-between items-start mb-6">
          <div>
            <h1 class="text-5xl font-black mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent drop-shadow-2xl">{{ room?.name }}</h1>
            <div class="flex items-center gap-3">
              <span class="text-gray-400 text-base font-bold">Room Code:</span>
              <div class="relative group">
                <div class="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <span class="relative text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent tracking-wider px-4 py-2 border-4 border-purple-500/50 rounded-2xl bg-gray-900/80">{{ code }}</span>
              </div>
            </div>
          </div>
          <button 
            @click="copyRoomCode"
            class="group relative bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 px-8 py-4 rounded-2xl font-black text-xl hover:from-purple-500 hover:via-purple-400 hover:to-pink-500 transition-all shadow-2xl hover:shadow-purple-500/60 transform hover:scale-110 overflow-hidden"
          >
            <div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <span class="relative flex items-center gap-2">
              <span class="text-2xl">📋</span>
              <span>COPY</span>
            </span>
          </button>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="group bg-gradient-to-br from-purple-900/40 to-purple-800/20 rounded-2xl p-4 border-4 border-purple-500/50 hover:border-purple-400/70 transition-all hover:shadow-xl hover:shadow-purple-500/30">
            <span class="text-purple-300 text-sm font-black block mb-2 flex items-center gap-2">
              <span class="text-lg">👥</span> PLAYERS
            </span>
            <span class="font-black text-4xl text-purple-300">{{ participants.length }}<span class="text-gray-500 text-2xl">/{{ room?.max_players }}</span></span>
          </div>
          <div class="group bg-gradient-to-br from-pink-900/40 to-pink-800/20 rounded-2xl p-4 border-4 border-pink-500/50 hover:border-pink-400/70 transition-all hover:shadow-xl hover:shadow-pink-500/30">
            <span class="text-pink-300 text-sm font-black block mb-2 flex items-center gap-2">
              <span class="text-lg">🎭</span> IMPOSTORS
            </span>
            <span class="font-black text-4xl text-pink-300">{{ room?.impostor_count || 2 }}</span>
          </div>
          <div class="group bg-gradient-to-br from-blue-900/40 to-blue-800/20 rounded-2xl p-4 border-4 border-blue-500/50 hover:border-blue-400/70 transition-all hover:shadow-xl hover:shadow-blue-500/30">
            <span class="text-blue-300 text-sm font-black block mb-2 flex items-center gap-2">
              <span class="text-lg">💬</span> DISCUSSION
            </span>
            <span class="font-black text-4xl text-blue-300">{{ Math.floor((room?.discussion_time || 0) / 60) }}:{{ String((room?.discussion_time || 0) % 60).padStart(2, '0') }}</span>
          </div>
          <div class="group bg-gradient-to-br from-green-900/40 to-green-800/20 rounded-2xl p-4 border-4 border-green-500/50 hover:border-green-400/70 transition-all hover:shadow-xl hover:shadow-green-500/30">
            <span class="text-green-300 text-sm font-black block mb-2 flex items-center gap-2">
              <span class="text-lg">🗳️</span> VOTING
            </span>
            <span class="font-black text-4xl text-green-300">{{ room?.voting_time }}<span class="text-2xl">s</span></span>
          </div>
        </div>
      </div>

      <!-- Players List -->
      <div class="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-lg rounded-3xl p-8 border-4 border-cyan-500/40 shadow-2xl shadow-cyan-500/30 animate-popup" style="animation-delay: 0.1s;">
        <h2 class="text-4xl font-black mb-6 flex items-center gap-3">
          <span class="text-3xl">🎮</span>
          <span class="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">PLAYERS</span>
          <span class="text-gray-500 text-2xl">({{ participants.length }})</span>
        </h2>
        <div class="grid md:grid-cols-2 gap-4">
          <div 
            v-for="participant in participants" 
            :key="participant.id"
            class="group flex items-center gap-4 bg-gradient-to-r from-cyan-900/30 to-blue-900/20 hover:from-cyan-800/40 hover:to-blue-800/30 rounded-2xl p-5 border-4 transition-all hover:scale-105 animate-popup"
            :class="participant.is_host ? 'border-yellow-400/60 hover:border-yellow-300/80' : 'border-cyan-500/40 hover:border-cyan-400/60'"
            :style="`animation-delay: ${0.1 + participants.indexOf(participant) * 0.05}s;`"
          >
            <div class="relative">
              <div v-if="participant.is_host" class="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-2xl animate-wiggle shadow-lg">👑</div>
              <img 
                :src="participant.users.avatar_url" 
                class="w-16 h-16 rounded-2xl border-4 group-hover:scale-110 transition-transform shadow-xl"
                :class="participant.is_host ? 'border-yellow-400' : 'border-cyan-400/50'"
              />
            </div>
            <div class="flex-1">
              <p class="font-black text-2xl text-white">{{ participant.users.full_name }}</p>
              <p v-if="participant.is_host" class="text-sm font-black text-yellow-400 uppercase tracking-wider">⭐ HOST</p>
              <p v-else class="text-sm font-bold text-cyan-400 uppercase tracking-wide">Player</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-6 justify-center">
        <button 
          v-if="isHost"
          @click="startGame"
          :disabled="participants.length < 3 || loading"
          class="group relative bg-gradient-to-r from-green-600 via-emerald-500 to-green-600 px-12 py-6 rounded-2xl font-black text-3xl hover:from-green-500 hover:via-emerald-400 hover:to-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:shadow-green-500/60 transform hover:scale-110 overflow-hidden"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <span class="relative flex items-center gap-3">
            <span class="text-4xl group-hover:rotate-90 transition-all duration-300">{{ loading ? '⏳' : '🎮' }}</span>
            <span class="tracking-wider">{{ loading ? 'STARTING...' : 'START GAME' }}</span>
          </span>
        </button>
        
        <button 
          @click="leaveRoom"
          class="group bg-gradient-to-r from-red-600 to-rose-600 px-12 py-6 rounded-2xl font-black text-3xl hover:from-red-500 hover:to-rose-500 transition-all shadow-2xl hover:shadow-red-500/60 transform hover:scale-110 border-4 border-red-500/50 hover:border-red-400/70"
        >
          <span class="flex items-center gap-3">
            <span class="text-4xl group-hover:-translate-x-2 transition-all duration-300">🚪</span>
            <span class="tracking-wider">LEAVE</span>
          </span>
        </button>
      </div>

      <div class="text-center animate-bounce-slow">
        <p v-if="!isHost && participants.length >= 3" class="text-gray-300 font-bold text-xl flex items-center justify-center gap-2">
          <span class="text-2xl">⏱️</span>
          Waiting for host to start...
        </p>
        
        <p v-if="participants.length < 3" class="text-yellow-300 font-black text-2xl flex items-center justify-center gap-2 animate-pulse">
          <span class="text-3xl">⚠️</span>
          Need {{ 3 - participants.length }} more player{{ 3 - participants.length > 1 ? 's' : '' }} to start!
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { getRandomWordPair } from '@/lib/wordPairs'

const route = useRoute()
const router = useRouter()
const code = route.params.code

const room = ref(null)
const participants = ref([])
const currentUser = ref(null)
const loading = ref(false)

let participantSubscription = null
let roomSubscription = null

const isHost = computed(() => {
  if (!currentUser.value || !room.value) return false
  return currentUser.value.id === room.value.host_id
})

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  currentUser.value = session?.user
  
  await loadRoomData()
  subscribeToUpdates()
})

onUnmounted(() => {
  if (participantSubscription) participantSubscription.unsubscribe()
  if (roomSubscription) roomSubscription.unsubscribe()
})

const loadRoomData = async () => {
  // Load room
  const { data: roomData } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code)
    .single()
  
  room.value = roomData
  
  // Load participants
  const { data: participantsData } = await supabase
    .from('room_participants')
    .select('*, users(*)')
    .eq('room_id', roomData.id)
  
  participants.value = participantsData || []
}

const subscribeToUpdates = () => {
  // Subscribe to participant changes
  participantSubscription = supabase
    .channel(`room:${room.value.id}:participants`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'room_participants',
      filter: `room_id=eq.${room.value.id}`
    }, () => {
      loadRoomData()
    })
    .subscribe()
  
  // Subscribe to room status changes
  roomSubscription = supabase
    .channel(`room:${room.value.id}:status`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'rooms',
      filter: `id=eq.${room.value.id}`
    }, (payload) => {
      if (payload.new.status === 'IN_PROGRESS') {
        router.push(`/game/${code}`)
      }
    })
    .subscribe()
}

const copyRoomCode = () => {
  navigator.clipboard.writeText(code)
  alert('Room code copied!')
}

const startGame = async () => {
  loading.value = true
  
  try {
    // Get random word pair
    const wordPair = getRandomWordPair()
    
    // Select random impostors
    const shuffled = [...participants.value].sort(() => Math.random() - 0.5)
    const impostorCount = room.value.impostor_count || 2
    const impostorIds = shuffled.slice(0, impostorCount).map(p => p.user_id)
    
    // Assign words to all participants
    for (const participant of participants.value) {
      const isImpostor = impostorIds.includes(participant.user_id)
      const word = isImpostor ? wordPair.impostor : wordPair.normal
      
      await supabase
        .from('room_participants')
        .update({ 
          is_imposter: isImpostor,
          word: word
        })
        .eq('id', participant.id)
    }
    
    // Update room status
    await supabase
      .from('rooms')
      .update({ 
        status: 'IN_PROGRESS'
      })
      .eq('id', room.value.id)
    
    router.push(`/game/${code}`)
  } catch (error) {
    console.error('Error starting game:', error)
    alert('Error starting game: ' + error.message)
  } finally {
    loading.value = false
  }
}

const leaveRoom = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  
  // Remove participant
  await supabase
    .from('room_participants')
    .delete()
    .eq('room_id', room.value.id)
    .eq('user_id', session.user.id)
  
  // If host left, delete room
  if (isHost.value) {
    await supabase.from('rooms').delete().eq('id', room.value.id)
  }
  
  router.push('/')
}
</script>
