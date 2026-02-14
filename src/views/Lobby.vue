<template>
  <div class="min-h-screen p-4">
    <div class="max-w-5xl mx-auto space-y-6">
      <!-- Room Header -->
      <div class="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
        <div class="flex justify-between items-start mb-6">
          <div>
            <h1 class="text-3xl font-bold mb-1">{{ room?.name }}</h1>
            <div class="flex items-center gap-2">
              <span class="text-gray-400 text-sm">Room Code:</span>
              <span class="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent tracking-wider">{{ code }}</span>
            </div>
          </div>
          <button 
            @click="copyRoomCode"
            class="bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all font-semibold shadow-lg hover:shadow-purple-500/50 transform hover:scale-105"
          >
            Copy Code
          </button>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="bg-white/5 rounded-xl p-3 border border-white/10">
            <span class="text-gray-400 text-xs block mb-1">Players</span>
            <span class="font-bold text-xl text-purple-400">{{ participants.length }}<span class="text-gray-500 text-sm">/{{ room?.max_players }}</span></span>
          </div>
          <div class="bg-white/5 rounded-xl p-3 border border-white/10">
            <span class="text-gray-400 text-xs block mb-1">Impostors</span>
            <span class="font-bold text-xl text-pink-400">{{ room?.impostor_count || 2 }}</span>
          </div>
          <div class="bg-white/5 rounded-xl p-3 border border-white/10">
            <span class="text-gray-400 text-xs block mb-1">Discussion</span>
            <span class="font-bold text-xl text-blue-400">{{ Math.floor((room?.discussion_time || 0) / 60) }}:{{ String((room?.discussion_time || 0) % 60).padStart(2, '0') }}</span>
          </div>
          <div class="bg-white/5 rounded-xl p-3 border border-white/10">
            <span class="text-gray-400 text-xs block mb-1">Voting</span>
            <span class="font-bold text-xl text-green-400">{{ room?.voting_time }}s</span>
          </div>
        </div>
      </div>

      <!-- Players List -->
      <div class="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
        <h2 class="text-2xl font-bold mb-4">Players <span class="text-gray-400 text-lg">({{ participants.length }})</span></h2>
        <div class="grid md:grid-cols-2 gap-3">
          <div 
            v-for="participant in participants" 
            :key="participant.id"
            class="group flex items-center gap-4 bg-white/5 hover:bg-white/10 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all"
          >
            <img 
              :src="participant.users.avatar_url" 
              class="w-14 h-14 rounded-full border-2 group-hover:border-purple-400 transition-colors shadow-lg"
              :class="participant.is_host ? 'border-yellow-400' : 'border-purple-500/50'"
            />
            <div class="flex-1">
              <p class="font-bold text-lg">{{ participant.users.full_name }}</p>
              <p v-if="participant.is_host" class="text-xs font-semibold text-yellow-400 uppercase tracking-wide">Host</p>
              <p v-else class="text-xs text-gray-500">Player</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-4 justify-center">
        <button 
          v-if="isHost"
          @click="startGame"
          :disabled="participants.length < 3 || loading"
          class="bg-gradient-to-r from-green-600 to-emerald-600 px-10 py-4 rounded-xl font-bold text-lg hover:from-green-500 hover:to-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-green-500/50 transform hover:scale-105"
        >
          {{ loading ? 'Starting Game...' : 'Start Game' }}
        </button>
        
        <button 
          @click="leaveRoom"
          class="bg-gradient-to-r from-red-600 to-rose-600 px-10 py-4 rounded-xl font-bold text-lg hover:from-red-500 hover:to-rose-500 transition-all shadow-lg hover:shadow-red-500/50 transform hover:scale-105"
        >
          Leave Room
        </button>
      </div>

      <div class="text-center">
        <p v-if="!isHost && participants.length >= 3" class="text-gray-400">
          Waiting for host to start the game...
        </p>
        
        <p v-if="participants.length < 3" class="text-yellow-400 font-semibold">
          Need {{ 3 - participants.length }} more player{{ 3 - participants.length > 1 ? 's' : '' }} to start
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
