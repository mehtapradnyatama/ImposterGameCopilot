<template>
  <div class="min-h-screen p-4 pixel-grid">
    <div class="max-w-5xl mx-auto space-y-6">
      <!-- Room Header - Arcade Title -->
      <div class="bg-black border-8 border-yellow-400 p-8 animate-slide-in-up" style="box-shadow: 8px 8px 0 rgba(234, 179, 8, 0.5);">
        <div class="flex justify-between items-start mb-6">
          <div>
            <div class="text-yellow-400 text-xs mb-4 animate-blink score-display">
              █ GAME LOBBY █
            </div>
            <h1 class="text-4xl font-black mb-3 text-yellow-400 score-display uppercase">{{ room?.name }}</h1>
            <div class="flex items-center gap-3">
              <span class="text-white text-xs score-display">ROOM CODE:</span>
              <div class="bg-gray-900 border-4 border-yellow-400 px-6 py-3" style="box-shadow: 4px 4px 0 rgba(234, 179, 8, 0.8);">
                <span class="text-3xl font-black text-yellow-400 tracking-widest score-display">{{ code }}</span>
              </div>
            </div>
          </div>
          <button 
            @click="copyRoomCode"
            class="bg-cyan-500 border-4 border-cyan-700 px-8 py-4 font-black text-lg hover:bg-cyan-400 transition-all score-display text-white btn-retro"
          >
            <span class="flex items-center gap-2">
              <span class="text-xl">■</span>
              <span>COPY</span>
            </span>
          </button>
        </div>
        
        <!-- Stats Panels - Flat Colored Blocks -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-blue-600 border-4 border-blue-800 p-5 animate-slide-in-left" style="box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.8);">
            <span class="text-white text-xs font-black block mb-2 text-center score-display">
              ■ PLAYERS
            </span>
            <span class="font-black text-5xl text-white block text-center score-display">{{ participants.length }}<span class="text-gray-300 text-3xl">/{{ room?.max_players }}</span></span>
          </div>
          <div class="bg-red-600 border-4 border-red-800 p-5 animate-slide-in-left" style="box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.8); animation-delay: 0.1s;">
            <span class="text-white text-xs font-black block mb-2 text-center score-display">
              ● IMPOSTORS
            </span>
            <span class="font-black text-5xl text-white block text-center score-display">{{ room?.impostor_count || 2 }}</span>
          </div>
          <div class="bg-yellow-500 border-4 border-yellow-700 p-5 animate-slide-in-left" style="box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.8); animation-delay: 0.2s;">
            <span class="text-black text-xs font-black block mb-2 text-center score-display">
              ▲ DISCUSSION
            </span>
            <span class="font-black text-4xl text-black block text-center score-display">{{ Math.floor((room?.discussion_time || 0) / 60) }}:{{ String((room?.discussion_time || 0) % 60).padStart(2, '0') }}</span>
          </div>
          <div class="bg-green-500 border-4 border-green-700 p-5 animate-slide-in-left" style="box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.8); animation-delay: 0.3s;">
            <span class="text-white text-xs font-black block mb-2 text-center score-display">
              ♦ VOTING
            </span>
            <span class="font-black text-5xl text-white block text-center score-display">{{ room?.voting_time }}<span class="text-2xl">S</span></span>
          </div>
        </div>
      </div>

      <!-- Players List - Arcade Character Select -->
      <div class="bg-gray-900 border-8 border-cyan-400 p-8 animate-slide-in-up" style="box-shadow: 8px 8px 0 rgba(34, 211, 238, 0.5); animation-delay: 0.1s;">
        <h2 class="text-3xl font-black mb-6 flex items-center gap-3 text-cyan-400 score-display">
          <span class="text-2xl">■</span>
          <span>PLAYERS</span>
          <span class="text-white text-xl">({{ participants.length }})</span>
        </h2>
        <div class="grid md:grid-cols-2 gap-4">
          <div 
            v-for="participant in participants" 
            :key="participant.id"
            class="flex items-center gap-4 bg-black p-5 border-4 transition-all animate-slide-in-left"
            :class="participant.is_host ? 'border-yellow-400' : 'border-cyan-500'"
            :style="`box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.8); animation-delay: ${0.1 + participants.indexOf(participant) * 0.05}s;`"
          >
            <div class="relative">
              <div v-if="participant.is_host" class="absolute -top-3 -right-3 w-8 h-8 bg-yellow-500 border-2 border-yellow-700 flex items-center justify-center text-xl animate-pixel-bounce">👑</div>
              <img 
                :src="participant.users.avatar_url" 
                class="w-16 h-16 border-4"
                :class="participant.is_host ? 'border-yellow-400' : 'border-cyan-400'"
                style="image-rendering: pixelated;"
              />
            </div>
            <div class="flex-1">
              <p class="font-black text-xl text-white score-display">{{ participant.users.full_name.toUpperCase() }}</p>
              <p v-if="participant.is_host" class="text-xs font-black text-yellow-400 score-display mt-1">★ HOST</p>
              <p v-else class="text-xs font-black text-cyan-400 score-display mt-1">PLAYER</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions - Arcade Buttons -->
      <div class="flex gap-6 justify-center flex-wrap">
        <button 
          v-if="isHost"
          @click="startGame"
          :disabled="participants.length < 3 || loading"
          class="bg-green-500 border-4 border-green-700 px-12 py-6 text-3xl hover:bg-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed score-display text-white btn-retro"
        >
          <span class="flex items-center gap-3">
            <span class="animate-blink text-4xl">▶</span>
            <span>{{ loading ? 'LOADING...' : 'START GAME' }}</span>
          </span>
        </button>
        
        <button 
          @click="leaveRoom"
          class="bg-red-600 border-4 border-red-800 px-12 py-6 text-3xl hover:bg-red-500 transition-all score-display text-white btn-retro"
        >
          <span class="flex items-center gap-3">
            <span class="text-4xl">■</span>
            <span>LEAVE ROOM</span>
          </span>
        </button>
      </div>

      <!-- Status Messages - Arcade Style -->
      <div class="text-center">
        <div v-if="!isHost && participants.length >= 3" class="bg-blue-600 border-4 border-blue-800 p-6 inline-block" style="box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.8);">
          <p class="text-white font-black text-xl score-display animate-blink flex items-center justify-center gap-2">
            <span class="text-2xl">●</span>
            WAITING FOR HOST...
          </p>
        </div>
        
        <div v-if="participants.length < 3" class="bg-red-600 border-4 border-red-800 p-6 inline-block animate-pixel-pulse" style="box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.8);">
          <p class="text-white font-black text-xl score-display flex items-center justify-center gap-2">
            <span class="text-3xl animate-blink">!</span>
            NEED {{ 3 - participants.length }} MORE PLAYER{{ 3 - participants.length > 1 ? 'S' : '' }}
            <span class="text-3xl animate-blink">!</span>
          </p>
        </div>
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
  
  console.log('Lobby mounted, current user:', currentUser.value?.id)
  console.log('Room code:', code)
  
  await loadRoomData()
  subscribeToUpdates()
})

onUnmounted(() => {
  if (participantSubscription) participantSubscription.unsubscribe()
  if (roomSubscription) roomSubscription.unsubscribe()
})

const loadRoomData = async () => {
  try {
    // Load room
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code)
      .single()
    
    if (roomError) {
      console.error('Error loading room:', roomError)
      return
    }
    
    room.value = roomData
    
    // Load participants with user data
    const { data: participantsData, error: participantsError } = await supabase
      .from('room_participants')
      .select('*, users:user_id(id, email, full_name, avatar_url)')
      .eq('room_id', roomData.id)
    
    if (participantsError) {
      console.error('Error loading participants:', participantsError)
    }
    
    console.log('Loaded participants:', participantsData)
    participants.value = participantsData || []
  } catch (error) {
    console.error('Error in loadRoomData:', error)
  }
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
    
    // Generate speaker order (shuffle all participants for display only)
    const speakerOrder = [...participants.value]
      .sort(() => Math.random() - 0.5)
      .map(p => p.user_id)
    
    // Update room status with speaker order
    await supabase
      .from('rooms')
      .update({ 
        status: 'IN_PROGRESS',
        speaker_order: speakerOrder
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
