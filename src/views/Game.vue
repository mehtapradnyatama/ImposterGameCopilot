<template>
  <div class="min-h-screen p-4 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
    <div class="max-w-7xl mx-auto">
      <!-- Game Header -->
      <div class="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-5 mb-4 border border-white/20 shadow-xl">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold mb-1">{{ room?.name }}</h1>
            <p class="text-sm text-gray-400">{{ participants.length }} Players · {{ impostorCount }} Impostor{{ impostorCount > 1 ? 's' : '' }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Phase</p>
            <p class="text-2xl font-bold" :class="phaseColor">{{ phaseText }}</p>
          </div>
        </div>
        
        <!-- Timer -->
        <div v-if="timeLeft > 0 && room?.status !== 'FINISHED'" class="mt-4">
          <div class="flex justify-between text-sm mb-2">
            <span class="font-medium">Time Remaining</span>
            <span class="font-bold text-lg" :class="timeLeft < 30 ? 'text-red-400' : 'text-purple-400'">{{ Math.floor(timeLeft / 60) }}:{{ String(timeLeft % 60).padStart(2, '0') }}</span>
          </div>
          <div class="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
            <div 
              class="h-3 rounded-full transition-all duration-500" 
              :class="timeLeft < 30 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'"
              :style="{ width: timePercentage + '%' }"
            ></div>
          </div>
        </div>

        <!-- Host Controls -->
        <div v-if="isHost && room?.status === 'IN_PROGRESS'" class="mt-4 flex gap-3">
          <button 
            @click="extendTime"
            :disabled="extendCount >= 2"
            class="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 rounded-xl hover:from-blue-500 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold shadow-lg"
          >
            <span class="flex items-center justify-center gap-2">
              <span class="text-lg">+30s</span>
              <span>Extend ({{ extendCount }}/2)</span>
            </span>
          </button>
          <button 
            @click="startVoting"
            class="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 px-4 py-2.5 rounded-xl hover:from-yellow-500 hover:to-orange-500 transition-all text-sm font-bold shadow-lg"
          >
            Start Voting Now
          </button>
        </div>
      </div>

      <div class="grid lg:grid-cols-3 gap-4">
        <!-- Main Game Area -->
        <div class="lg:col-span-2 space-y-4">
          <!-- Your Word Display -->
          <div class="relative overflow-hidden bg-gradient-to-br rounded-2xl p-8 text-center border-2 shadow-2xl" :class="isImposter ? 'from-pink-900/50 to-red-900/50 border-pink-500/50' : 'from-purple-900/50 to-blue-900/50 border-purple-500/50'">
            <div class="absolute inset-0 bg-gradient-to-br opacity-10" :class="isImposter ? 'from-pink-500 to-red-500' : 'from-purple-500 to-blue-500'"></div>
            <div class="relative">
              <p class="text-sm font-semibold mb-2 uppercase tracking-wider" :class="isImposter ? 'text-pink-400' : 'text-purple-400'">Your Role</p>
              <div class="inline-block px-6 py-2 rounded-full mb-4" :class="isImposter ? 'bg-pink-500/20' : 'bg-purple-500/20'">
                <p class="text-xl font-bold" :class="isImposter ? 'text-pink-300' : 'text-purple-300'">
                  {{ isImposter ? 'IMPOSTOR' : 'NORMAL PLAYER' }}
                </p>
              </div>
              <div class="bg-black/40 backdrop-blur-sm rounded-2xl p-8 mt-4 border-2" :class="isImposter ? 'border-pink-500/30' : 'border-purple-500/30'">
                <p class="text-gray-400 text-sm mb-3 uppercase tracking-wide">Your Word</p>
                <p class="text-6xl font-black" :class="isImposter ? 'text-pink-400' : 'text-purple-400'">{{ myWord }}</p>
              </div>
              <p class="text-gray-300 mt-6 leading-relaxed">
                {{ isImposter 
                  ? 'You have a different word! Blend in without getting caught.' 
                  : 'Find players with different words through discussion!' 
                }}
              </p>
            </div>
          </div>

          <!-- Discussion Phase -->
          <div v-if="room?.status === 'IN_PROGRESS'" class="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-xl">D</div>
              <h2 class="text-2xl font-bold">Discussion Phase</h2>
            </div>
            <p class="text-gray-300 mb-4 leading-relaxed">
              Talk with other players using the text chat or voice chat below. 
              {{ isHost ? 'As the host, you can start voting anytime!' : 'Wait for the host to start voting.' }}
            </p>
            
            <!-- Voice Chat Controls -->
            <div v-if="room?.voice_chat_enabled" class="bg-white/5 rounded-xl p-5 border border-white/10">
              <h3 class="font-bold mb-4 text-lg">Voice Chat</h3>
              <div class="flex gap-3 mb-3">
                <button 
                  @click="toggleVoiceChat"
                  :class="isVoiceConnected ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'"
                  class="flex-1 px-6 py-3 rounded-xl font-bold transition-all shadow-lg"
                >
                  {{ isVoiceConnected ? 'Connected' : 'Join Voice' }}
                </button>
                
                <button
                  v-if="isVoiceConnected"
                  @click="toggleVoiceMode"
                  class="bg-gradient-to-r from-gray-600 to-gray-700 px-5 py-3 rounded-xl hover:from-gray-500 hover:to-gray-600 transition-all font-semibold"
                >
                  {{ isAlwaysOn ? 'Always On' : 'Push-to-Talk' }}
                </button>
              </div>
              
              <button 
                v-if="isVoiceConnected && !isAlwaysOn"
                @mousedown="startTalking"
                @mouseup="stopTalking"
                @mouseleave="stopTalking"
                @touchstart="startTalking"
                @touchend="stopTalking"
                :class="isTalking ? 'bg-gradient-to-r from-red-600 to-rose-600' : 'bg-gradient-to-r from-gray-600 to-gray-700'"
                class="w-full px-6 py-5 rounded-xl font-bold transition-all text-lg shadow-lg"
              >
                {{ isTalking ? 'TALKING...' : 'Hold to Talk' }}
              </button>

              <p v-if="isVoiceConnected && isAlwaysOn" class="text-green-400 text-center mt-3 font-semibold">
                • Microphone is always on
              </p>
            </div>
          </div>

          <!-- Voting Phase -->
          <div v-if="room?.status === 'VOTING'" class="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center font-bold text-xl">V</div>
              <h2 class="text-2xl font-bold">Voting Phase</h2>
            </div>
            <p class="text-gray-300 mb-5 leading-relaxed">Vote for who you think is the impostor!</p>
            
            <div class="grid md:grid-cols-2 gap-3">
              <button
                v-for="participant in participants"
                :key="participant.id"
                @click="submitVote(participant.user_id)"
                :disabled="hasVoted || participant.user_id === currentUser?.id"
                :class="myVote === participant.user_id ? 'ring-4 ring-yellow-400 bg-yellow-500/20 border-yellow-400' : 'border-white/10 hover:border-white/30'"
                class="flex items-center gap-4 bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2"
              >
                <img :src="participant.users.avatar_url" class="w-14 h-14 rounded-full border-2 border-purple-400" />
                <div class="flex-1 text-left">
                  <span class="font-bold text-lg">{{ participant.users.full_name }}</span>
                  <p v-if="participant.user_id === currentUser?.id" class="text-xs text-gray-400">(You)</p>
                </div>
              </button>
            </div>
            
            <div v-if="hasVoted" class="mt-5 p-4 bg-green-500/10 border border-green-500/50 rounded-xl text-center">
              <p class="text-green-400 font-semibold">Vote submitted! Waiting for others...</p>
            </div>
            <p class="text-center text-gray-400 mt-3 font-medium">{{ voteCount }}/{{ participants.length }} voted</p>
          </div>

          <!-- Results Phase -->
          <div v-if="room?.status === 'FINISHED'" class="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div class="text-center mb-6">
              <h2 class="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">Game Over</h2>
              <p class="text-gray-400">Results & Scoreboard</p>
            </div>
            
            <div class="mb-6">
              <h3 class="text-lg font-bold mb-3 text-gray-300 uppercase tracking-wide">The Impostor(s)</h3>
              <div class="space-y-3">
                <div 
                  v-for="impostor in impostors"
                  :key="impostor.id"
                  class="flex items-center gap-4 bg-gradient-to-r from-red-900/30 to-pink-900/30 rounded-xl p-4 border-2 border-red-500/50"
                >
                  <img :src="impostor.users.avatar_url" class="w-16 h-16 rounded-full border-4 border-red-500 shadow-lg" />
                  <div class="flex-1">
                    <p class="text-2xl font-bold">{{ impostor.users.full_name }}</p>
                    <p class="text-red-400 font-semibold uppercase text-sm tracking-wide">Impostor</p>
                    <p class="text-yellow-400 font-bold text-lg mt-1">{{ impostor.word }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="mb-6">
              <h3 class="text-lg font-bold mb-3 text-gray-300 uppercase tracking-wide">Normal Players Had</h3>
              <div class="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-xl p-6 border-2 border-green-500/50">
                <p class="text-4xl font-bold text-center text-green-400">
                  {{ normalWord }}
                </p>
              </div>
            </div>

            <div class="mb-6">
              <h3 class="text-lg font-bold mb-3 text-gray-300 uppercase tracking-wide">Vote Results</h3>
              <div class="space-y-2">
                <div 
                  v-for="result in voteResults"
                  :key="result.user_id"
                  class="flex items-center gap-3 bg-white/5 rounded-xl p-3 border-2 transition-all"
                  :class="result.is_impostor ? 'border-red-500/50 bg-red-500/10' : 'border-white/10'"
                >
                  <img :src="result.avatar_url" class="w-12 h-12 rounded-full" />
                  <span class="flex-1 font-bold">
                    {{ result.full_name }}
                    <span v-if="result.is_impostor" class="text-red-400 ml-2 text-xs uppercase tracking-wide">Impostor</span>
                  </span>
                  <span class="text-2xl font-bold">{{ result.votes }}</span>
                  <span class="text-xs text-gray-400">vote{{ result.votes !== 1 ? 's' : '' }}</span>
                </div>
              </div>
            </div>

            <div class="text-center mb-6 p-6 bg-gradient-to-r rounded-xl" :class="gameOutcome.includes('Win') ? 'from-green-900/30 to-emerald-900/30 border-2 border-green-500/50' : 'from-red-900/30 to-pink-900/30 border-2 border-red-500/50'">
              <p class="text-3xl font-bold">
                {{ gameOutcome }}
              </p>
            </div>

            <div class="mb-6">
              <h3 class="text-2xl font-bold mb-4 text-center">Final Scoreboard</h3>
              <div class="space-y-2">
                <div 
                  v-for="(participant, index) in sortedParticipants"
                  :key="participant.id"
                  class="flex items-center gap-4 rounded-xl p-4 border-2 transition-all"
                  :class="index === 0 ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-500/50' : 'bg-white/5 border-white/10'"
                >
                  <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl" :class="index === 0 ? 'bg-yellow-500 text-yellow-900' : index === 1 ? 'bg-gray-400 text-gray-900' : index === 2 ? 'bg-orange-600 text-orange-100' : 'bg-gray-700 text-gray-300'">
                    {{ index + 1 }}
                  </div>
                  <img :src="participant.users.avatar_url" class="w-12 h-12 rounded-full border-2" :class="index === 0 ? 'border-yellow-400' : 'border-gray-600'" />
                  <span class="flex-1 text-left font-bold">{{ participant.users.full_name }}</span>
                  <span class="text-2xl font-bold" :class="index === 0 ? 'text-yellow-400' : 'text-purple-400'">{{ participant.score }}</span>
                  <span class="text-xs text-gray-400">pts</span>
                </div>
              </div>
            </div>

            <button 
              @click="returnHome"
              class="w-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 rounded-xl font-bold text-lg hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg hover:shadow-purple-500/50 transform hover:scale-[1.02]"
            >
              Back to Home
            </button>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-4">
          <!-- Players -->
          <div class="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <h3 class="font-bold mb-3 text-gray-300 uppercase tracking-wide text-sm">Players ({{ participants.length }})</h3>
            <div class="space-y-2">
              <div 
                v-for="participant in participants"
                :key="participant.id"
                class="flex items-center gap-2 bg-white/5 rounded-lg p-2 border border-white/10"
              >
                <img :src="participant.users.avatar_url" class="w-9 h-9 rounded-full border-2 border-purple-500/50" />
                <span class="text-sm flex-1 font-medium">{{ participant.users.full_name }}</span>
                <span class="text-xs font-bold px-2 py-1 rounded bg-purple-500/20 text-purple-300">{{ participant.score }}</span>
              </div>
            </div>
          </div>

          <!-- Chat -->
          <div class="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <h3 class="font-bold mb-3 text-gray-300 uppercase tracking-wide text-sm">Chat</h3>
            <div class="h-64 overflow-y-auto mb-3 space-y-2 bg-white/5 rounded-xl p-3 border border-white/10">
              <div 
                v-for="message in chatMessages"
                :key="message.id"
                class="text-sm"
              >
                <span class="font-bold text-purple-400">{{ message.users.full_name }}:</span>
                <span class="ml-1 text-gray-300">{{ message.message }}</span>
              </div>
              <p v-if="chatMessages.length === 0" class="text-gray-500 text-center py-8 text-xs">No messages yet...</p>
            </div>
            <form @submit.prevent="sendMessage" class="flex gap-2">
              <input 
                v-model="newMessage"
                type="text"
                placeholder="Type a message..."
                class="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/20 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 text-sm transition-all"
              />
              <button 
                type="submit"
                class="bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2 rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all font-semibold text-sm"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const route = useRoute()
const router = useRouter()
const code = route.params.code

const room = ref(null)
const participants = ref([])
const chatMessages = ref([])
const currentUser = ref(null)
const myWord = ref('')
const isImposter = ref(false)
const myVote = ref(null)
const hasVoted = ref(false)
const timeLeft = ref(0)
const newMessage = ref('')
const voteResults = ref([])
const extendCount = ref(0)
const voteCount = ref(0)
const gameStartTime = ref(null)
const votingStartTime = ref(null)

// Voice chat
const isVoiceConnected = ref(false)
const isTalking = ref(false)
const isAlwaysOn = ref(false)

let roomSubscription = null
let participantSubscription = null
let chatSubscription = null
let voteSubscription = null
let timerInterval = null

const isHost = computed(() => {
  if (!currentUser.value || !room.value) return false
  return currentUser.value.id === room.value.host_id
})

const impostorCount = computed(() => room.value?.impostor_count || 2)

const impostors = computed(() => participants.value.filter(p => p.is_imposter))

const normalWord = computed(() => {
  const normal = participants.value.find(p => !p.is_imposter)
  return normal?.word || ''
})

const phaseText = computed(() => {
  if (!room.value) return 'Loading...'
  const phases = {
    'IN_PROGRESS': 'Discussion',
    'VOTING': 'Voting',
    'FINISHED': 'Game Over'
  }
  return phases[room.value.status] || 'Unknown'
})

const phaseColor = computed(() => {
  if (!room.value) return 'text-gray-400'
  const colors = {
    'IN_PROGRESS': 'text-blue-400',
    'VOTING': 'text-yellow-400',
    'FINISHED': 'text-green-400'
  }
  return colors[room.value.status] || 'text-gray-400'
})

const timePercentage = computed(() => {
  if (!room.value) return 100
  const maxTime = room.value.status === 'IN_PROGRESS' 
    ? room.value.discussion_time + (extendCount.value * 30)
    : room.value.voting_time
  return (timeLeft.value / maxTime) * 100
})

const sortedParticipants = computed(() => {
  return [...participants.value].sort((a, b) => b.score - a.score)
})

const gameOutcome = computed(() => {
  if (!voteResults.value.length) return ''
  const topVoted = voteResults.value[0]
  
  if (topVoted.is_impostor) {
    return 'Citizens Win! Impostor Found!'
  } else {
    return 'Impostors Win! Wrong Person Voted!'
  }
})

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  currentUser.value = session?.user
  
  if (!currentUser.value) {
    alert('Please sign in first!')
    router.push('/')
    return
  }
  
  await loadGameData()
  subscribeToUpdates()
  startTimer()
})

onUnmounted(() => {
  if (roomSubscription) roomSubscription.unsubscribe()
  if (participantSubscription) participantSubscription.unsubscribe()
  if (chatSubscription) chatSubscription.unsubscribe()
  if (voteSubscription) voteSubscription.unsubscribe()
  if (timerInterval) clearInterval(timerInterval)
})

const loadGameData = async () => {
  try {
    // Load room
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code)
      .single()
    
    if (roomError) throw roomError
    room.value = roomData
    gameStartTime.value = roomData.updated_at
    
    // Load participants
    const { data: participantsData, error: participantsError } = await supabase
      .from('room_participants')
      .select('*, users(*)')
      .eq('room_id', roomData.id)
    
    if (participantsError) throw participantsError
    participants.value = participantsData || []
    
    // Get my data
    const me = participants.value.find(p => p.user_id === currentUser.value.id)
    if (me) {
      isImposter.value = me.is_imposter || false
      myWord.value = me.word || ''
    }
    
    // Load chat
    const { data: chatData } = await supabase
      .from('chat_messages')
      .select('*, users(*)')
      .eq('room_id', roomData.id)
      .order('created_at', { ascending: true })
    
    chatMessages.value = chatData || []
    
    // Load vote count if voting
    if (roomData.status === 'VOTING' || roomData.status === 'FINISHED') {
      await loadVoteCount()
    }
    
    // Load results if finished
    if (roomData.status === 'FINISHED') {
      await loadVoteResults()
    }
  } catch (error) {
    console.error('Error loading game data:', error)
    alert('Error loading game: ' + error.message)
  }
}

const subscribeToUpdates = () => {
  // Subscribe to room status changes
  roomSubscription = supabase
    .channel(`game:${room.value.id}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'rooms',
      filter: `id=eq.${room.value.id}`
    }, async (payload) => {
      room.value = payload.new
      if (payload.new.status === 'VOTING') {
        votingStartTime.value = payload.new.updated_at
        hasVoted.value = false
        myVote.value = null
      } else if (payload.new.status === 'FINISHED') {
        await loadVoteResults()
      }
    })
    .subscribe()
  
  // Subscribe to participants (for score updates)
  participantSubscription = supabase
    .channel(`participants:${room.value.id}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'room_participants',
      filter: `room_id=eq.${room.value.id}`
    }, () => {
      loadGameData()
    })
    .subscribe()
  
  // Subscribe to chat
  chatSubscription = supabase
    .channel(`chat:${room.value.id}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
      filter: `room_id=eq.${room.value.id}`
    }, async (payload) => {
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', payload.new.user_id)
        .single()
      
      chatMessages.value.push({
        ...payload.new,
        users: user
      })
    })
    .subscribe()
  
  // Subscribe to votes
  voteSubscription = supabase
    .channel(`votes:${room.value.id}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'votes',
      filter: `room_id=eq.${room.value.id}`
    }, async () => {
      await loadVoteCount()
      await checkAllVoted()
    })
    .subscribe()
}

const startTimer = () => {
  timerInterval = setInterval(() => {
    if (!room.value || !gameStartTime.value) return
    
    if (room.value.status === 'IN_PROGRESS') {
      const startTime = new Date(gameStartTime.value)
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const maxTime = room.value.discussion_time + (extendCount.value * 30)
      timeLeft.value = Math.max(0, maxTime - elapsed)
    } else if (room.value.status === 'VOTING' && votingStartTime.value) {
      const startTime = new Date(votingStartTime.value)
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      timeLeft.value = Math.max(0, room.value.voting_time - elapsed)
      
      if (timeLeft.value === 0) {
        finishGame()
      }
    }
  }, 1000)
}

const extendTime = async () => {
  if (extendCount.value >= 2 || !isHost.value) return
  
  extendCount.value++
  // Extend time is handled by client-side calculation
  alert('Time extended by 30 seconds!')
}

const startVoting = async () => {
  if (!isHost.value) return
  
  try {
    votingStartTime.value = new Date().toISOString()
    
    await supabase
      .from('rooms')
      .update({ status: 'VOTING', updated_at: votingStartTime.value })
      .eq('id', room.value.id)
  } catch (error) {
    console.error('Error starting voting:', error)
    alert('Error starting voting: ' + error.message)
  }
}

const submitVote = async (votedUserId) => {
  if (hasVoted.value || votedUserId === currentUser.value.id) return
  
  try {
    await supabase.from('votes').insert({
      room_id: room.value.id,
      voter_id: currentUser.value.id,
      voted_for_id: votedUserId
    })
    
    myVote.value = votedUserId
    hasVoted.value = true
  } catch (error) {
    console.error('Error submitting vote:', error)
    alert('Error submitting vote: ' + error.message)
  }
}

const loadVoteCount = async () => {
  const { data: votes } = await supabase
    .from('votes')
    .select('id')
    .eq('room_id', room.value.id)
  
  voteCount.value = votes?.length || 0
}

const checkAllVoted = async () => {
  if (!isHost.value) return
  
  const { data: votes } = await supabase
    .from('votes')
    .select('id')
    .eq('room_id', room.value.id)
  
  if (votes && votes.length >= participants.value.length) {
    await finishGame()
  }
}

const finishGame = async () => {
  if (!isHost.value || room.value.status === 'FINISHED') return
  
  try {
    // Get all votes
    const { data: votes } = await supabase
      .from('votes')
      .select('voted_for_id')
      .eq('room_id', room.value.id)
    
    // Count votes
    const voteCounts = {}
    votes.forEach(vote => {
      voteCounts[vote.voted_for_id] = (voteCounts[vote.voted_for_id] || 0) + 1
    })
    
    // Find most voted
    const sortedVotes = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])
    const mostVotedId = sortedVotes[0]?.[0]
    
    // Check if impostor was caught
    const mostVoted = participants.value.find(p => p.user_id === mostVotedId)
    const impostorsCaught = mostVoted?.is_imposter || false
    
    // Update scores
    for (const participant of participants.value) {
      let score = 0
      
      // Check if they voted correctly
      const theirVote = votes.find(v => v.voter_id === participant.user_id)
      const votedForImpostor = participants.value.find(p => p.user_id === theirVote?.voted_for_id)?.is_imposter
      
      if (participant.is_imposter) {
        // Impostor scoring
        if (!impostorsCaught) {
          score = 15 // Impostors survived
        }
      } else {
        // Normal player scoring
        if (votedForImpostor) {
          score = 10 // Voted for impostor correctly
        }
      }
      
      if (impostorsCaught && participant.user_id === mostVotedId) {
        score += 5 // Bonus for being the caught impostor (? maybe remove)
      }
      
      await supabase
        .from('room_participants')
        .update({ score: participant.score + score })
        .eq('id', participant.id)
    }
    
    // Update room status
    await supabase
      .from('rooms')
      .update({ status: 'FINISHED' })
      .eq('id', room.value.id)
  } catch (error) {
    console.error('Error finishing game:', error)
  }
}

const loadVoteResults = async () => {
  try {
    const { data: votes } = await supabase
      .from('votes')
      .select('voted_for_id')
      .eq('room_id', room.value.id)
    
    const voteCounts = {}
    votes.forEach(vote => {
      voteCounts[vote.voted_for_id] = (voteCounts[vote.voted_for_id] || 0) + 1
    })
    
    const results = participants.value.map(p => ({
      user_id: p.user_id,
      full_name: p.users.full_name,
      avatar_url: p.users.avatar_url,
      is_impostor: p.is_imposter,
      votes: voteCounts[p.user_id] || 0
    }))
    
    voteResults.value = results.sort((a, b) => b.votes - a.votes)
  } catch (error) {
    console.error('Error loading vote results:', error)
  }
}

const sendMessage = async () => {
  if (!newMessage.value.trim()) return
  
  try {
    await supabase.from('chat_messages').insert({
      room_id: room.value.id,
      user_id: currentUser.value.id,
      message: newMessage.value.trim()
    })
    
    newMessage.value = ''
  } catch (error) {
    console.error('Error sending message:', error)
  }
}

const toggleVoiceChat = () => {
  isVoiceConnected.value = !isVoiceConnected.value
  // TODO: WebRTC implementation
  if (isVoiceConnected.value) {
    alert('Voice chat connected! (WebRTC implementation pending)')
  }
}

const toggleVoiceMode = () => {
  isAlwaysOn.value = !isAlwaysOn.value
  if (isAlwaysOn.value) {
    isTalking.value = true
    // TODO: Start transmitting audio continuously
  } else {
    isTalking.value = false
    // TODO: Stop transmitting audio
  }
}

const startTalking = () => {
  if (!isAlwaysOn.value) {
    isTalking.value = true
    // TODO: Start transmitting audio
  }
}

const stopTalking = () => {
  if (!isAlwaysOn.value) {
    isTalking.value = false
    // TODO: Stop transmitting audio
  }
}

const returnHome = () => {
  router.push('/')
}
</script>
