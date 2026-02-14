<template>
  <div class="min-h-screen p-4">
    <div class="max-w-4xl mx-auto">
      <!-- Room Header -->
      <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h1 class="text-3xl font-bold">{{ room?.name }}</h1>
            <p class="text-gray-400">Room Code: <span class="text-2xl font-bold text-purple-400">{{ code }}</span></p>
          </div>
          <button 
            @click="copyRoomCode"
            class="bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            📋 Copy Code
          </button>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span class="text-gray-400">Players:</span>
            <span class="font-bold ml-2">{{ participants.length }}/{{ room?.max_players }}</span>
          </div>
          <div>
            <span class="text-gray-400">Impostors:</span>
            <span class="font-bold ml-2">{{ room?.impostor_count || 2 }}</span>
          </div>
          <div>
            <span class="text-gray-400">Discussion:</span>
            <span class="font-bold ml-2">{{ room?.discussion_time }}s</span>
          </div>
          <div>
            <span class="text-gray-400">Voting:</span>
            <span class="font-bold ml-2">{{ room?.voting_time }}s</span>
          </div>
        </div>
      </div>

      <!-- Players List -->
      <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
        <h2 class="text-2xl font-bold mb-4">Players in Lobby</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <div 
            v-for="participant in participants" 
            :key="participant.id"
            class="flex items-center gap-4 bg-white/5 rounded-lg p-4"
          >
            <img 
              :src="participant.users.avatar_url" 
              class="w-12 h-12 rounded-full border-2 border-purple-500"
            />
            <div class="flex-1">
              <p class="font-bold">{{ participant.users.full_name }}</p>
              <p v-if="participant.is_host" class="text-xs text-yellow-400">👑 Host</p>
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
          class="bg-green-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition disabled:opacity-50"
        >
          {{ loading ? 'Starting...' : 'Start Game' }}
        </button>
        
        <button 
          @click="leaveRoom"
          class="bg-red-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition"
        >
          Leave Room
        </button>
      </div>

      <p v-if="!isHost && participants.length >= 3" class="text-center text-gray-400 mt-4">
        Waiting for host to start the game...
      </p>
      
      <p v-if="participants.length < 3" class="text-center text-yellow-400 mt-4">
        Need at least 3 players to start ({{ 3 - participants.length }} more needed)
      </p>
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
