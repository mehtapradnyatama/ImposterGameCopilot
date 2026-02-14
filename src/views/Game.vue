<template>
  <div class="min-h-screen p-4">
    <div class="max-w-7xl mx-auto">
      <!-- Game Header -->
      <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold">{{ room?.name }}</h1>
            <p class="text-sm text-gray-400">Round {{ room?.current_round }}/{{ room?.rounds }}</p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-400">Phase</p>
            <p class="text-xl font-bold" :class="phaseColor">{{ phaseText }}</p>
          </div>
        </div>
        
        <!-- Timer -->
        <div v-if="timeLeft > 0" class="mt-4">
          <div class="flex justify-between text-sm mb-1">
            <span>Time Remaining</span>
            <span class="font-bold">{{ Math.floor(timeLeft / 60) }}:{{ String(timeLeft % 60).padStart(2, '0') }}</span>
          </div>
          <div class="w-full bg-gray-700 rounded-full h-2">
            <div 
              class="h-2 rounded-full transition-all" 
              :class="timeLeft < 30 ? 'bg-red-500' : 'bg-purple-500'"
              :style="{ width: timePercentage + '%' }"
            ></div>
          </div>
        </div>
      </div>

      <div class="grid lg:grid-cols-3 gap-4">
        <!-- Main Game Area -->
        <div class="lg:col-span-2 space-y-4">
          <!-- Secret Word / Role -->
          <div class="bg-gradient-to-r from-purple-900 to-pink-900 rounded-xl p-6 text-center">
            <p class="text-sm text-gray-300 mb-2">Your Role</p>
            <p class="text-3xl font-bold mb-4">
              {{ myRole }}
            </p>
            <p v-if="!isImposter && secretWord" class="text-xl">
              Secret Word: <span class="font-bold text-yellow-400">{{ secretWord }}</span>
            </p>
            <p v-if="isImposter" class="text-yellow-400">
              Find out what the secret word is without revealing yourself!
            </p>
          </div>

          <!-- Discussion Phase -->
          <div v-if="currentPhase === 'DISCUSSION'" class="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h2 class="text-2xl font-bold mb-4">💬 Discussion Phase</h2>
            <p class="text-gray-300 mb-4">
              Talk with other players to find the imposter. Use voice chat or text chat below.
            </p>
            
            <!-- Voice Chat Controls -->
            <div v-if="room?.voice_chat_enabled" class="flex gap-4 mb-4">
              <button 
                @click="toggleVoiceChat"
                :class="isVoiceConnected ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'"
                class="px-6 py-3 rounded-lg font-bold transition"
              >
                {{ isVoiceConnected ? '🎤 Connected' : '🎤 Join Voice' }}
              </button>
              
              <button 
                v-if="isVoiceConnected"
                @mousedown="startTalking"
                @mouseup="stopTalking"
                @mouseleave="stopTalking"
                @touchstart="startTalking"
                @touchend="stopTalking"
                :class="isTalking ? 'bg-red-600' : 'bg-gray-600'"
                class="px-6 py-3 rounded-lg font-bold transition"
              >
                {{ isTalking ? '🔴 Talking...' : '🎤 Push to Talk' }}
              </button>
            </div>
          </div>

          <!-- Voting Phase -->
          <div v-if="currentPhase === 'VOTING'" class="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h2 class="text-2xl font-bold mb-4">🗳️ Voting Phase</h2>
            <p class="text-gray-300 mb-4">Vote for who you think is the imposter!</p>
            
            <div class="grid md:grid-cols-2 gap-3">
              <button
                v-for="participant in participants"
                :key="participant.id"
                @click="submitVote(participant.user_id)"
                :disabled="hasVoted || participant.user_id === currentUser?.id"
                :class="myVote === participant.user_id ? 'ring-4 ring-yellow-400' : ''"
                class="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-lg p-4 transition disabled:opacity-50"
              >
                <img :src="participant.users.avatar_url" class="w-12 h-12 rounded-full" />
                <span class="font-bold">{{ participant.users.full_name }}</span>
                <span v-if="participant.user_id === currentUser?.id" class="text-xs text-gray-400">(You)</span>
              </button>
            </div>
            
            <p v-if="hasVoted" class="text-center text-green-400 mt-4">✓ Vote submitted</p>
          </div>

          <!-- Results Phase -->
          <div v-if="currentPhase === 'RESULTS'" class="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h2 class="text-2xl font-bold mb-4">📊 Round Results</h2>
            
            <div class="mb-6">
              <h3 class="text-xl font-bold mb-2">The Imposter was...</h3>
              <div class="flex items-center gap-4 bg-red-900/50 rounded-lg p-4">
                <img :src="imposterUser?.avatar_url" class="w-16 h-16 rounded-full border-4 border-red-500" />
                <div>
                  <p class="text-2xl font-bold">{{ imposterUser?.full_name }}</p>
                  <p class="text-red-400">🎭 Imposter</p>
                </div>
              </div>
            </div>

            <div class="mb-6">
              <h3 class="text-xl font-bold mb-2">Vote Results</h3>
              <div class="space-y-2">
                <div 
                  v-for="result in voteResults"
                  :key="result.user_id"
                  class="flex items-center gap-3 bg-white/5 rounded-lg p-3"
                >
                  <img :src="result.avatar_url" class="w-10 h-10 rounded-full" />
                  <span class="flex-1 font-bold">{{ result.full_name }}</span>
                  <span class="text-2xl">{{ result.votes }} votes</span>
                </div>
              </div>
            </div>

            <div class="text-center">
              <p class="text-3xl font-bold mb-2">
                {{ roundOutcome }}
              </p>
              <p class="text-gray-400">Next round starting soon...</p>
            </div>
          </div>

          <!-- Game Over -->
          <div v-if="currentPhase === 'GAME_OVER'" class="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <h2 class="text-4xl font-bold mb-6">🏆 Game Over!</h2>
            
            <div class="mb-6">
              <h3 class="text-2xl font-bold mb-4">Final Scores</h3>
              <div class="space-y-3">
                <div 
                  v-for="(participant, index) in sortedParticipants"
                  :key="participant.id"
                  class="flex items-center gap-4 bg-white/5 rounded-lg p-4"
                >
                  <span class="text-3xl">{{ index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤' }}</span>
                  <img :src="participant.users.avatar_url" class="w-12 h-12 rounded-full" />
                  <span class="flex-1 text-left font-bold">{{ participant.users.full_name }}</span>
                  <span class="text-2xl font-bold text-yellow-400">{{ participant.score }} pts</span>
                </div>
              </div>
            </div>

            <button 
              @click="returnHome"
              class="bg-purple-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-purple-700 transition"
            >
              Back to Home
            </button>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-4">
          <!-- Players -->
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <h3 class="font-bold mb-3">Players</h3>
            <div class="space-y-2">
              <div 
                v-for="participant in participants"
                :key="participant.id"
                class="flex items-center gap-2"
              >
                <img :src="participant.users.avatar_url" class="w-8 h-8 rounded-full" />
                <span class="text-sm flex-1">{{ participant.users.full_name }}</span>
                <span class="text-xs text-gray-400">{{ participant.score }}pts</span>
              </div>
            </div>
          </div>

          <!-- Chat -->
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <h3 class="font-bold mb-3">Chat</h3>
            <div class="h-64 overflow-y-auto mb-3 space-y-2">
              <div 
                v-for="message in chatMessages"
                :key="message.id"
                class="text-sm"
              >
                <span class="font-bold text-purple-400">{{ message.users.full_name }}:</span>
                <span class="ml-1">{{ message.message }}</span>
              </div>
            </div>
            <form @submit.prevent="sendMessage" class="flex gap-2">
              <input 
                v-model="newMessage"
                type="text"
                placeholder="Type a message..."
                class="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:border-purple-500 text-sm"
              />
              <button 
                type="submit"
                class="bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-700 transition"
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
const currentRound = ref(null)
const participants = ref([])
const chatMessages = ref([])
const currentUser = ref(null)
const secretWord = ref('')
const isImposter = ref(false)
const myVote = ref(null)
const hasVoted = ref(false)
const timeLeft = ref(0)
const newMessage = ref('')
const voteResults = ref([])
const imposterUser = ref(null)

// Voice chat
const isVoiceConnected = ref(false)
const isTalking = ref(false)

let roomSubscription = null
let chatSubscription = null
let timerInterval = null

const currentPhase = computed(() => currentRound.value?.status || 'DISCUSSION')

const phaseText = computed(() => {
  const phases = {
    'DISCUSSION': 'Discussion',
    'VOTING': 'Voting',
    'RESULTS': 'Results',
    'GAME_OVER': 'Game Over'
  }
  return phases[currentPhase.value] || 'Unknown'
})

const phaseColor = computed(() => {
  const colors = {
    'DISCUSSION': 'text-blue-400',
    'VOTING': 'text-yellow-400',
    'RESULTS': 'text-green-400',
    'GAME_OVER': 'text-purple-400'
  }
  return colors[currentPhase.value] || 'text-gray-400'
})

const myRole = computed(() => isImposter.value ? '🎭 You are the IMPOSTER!' : '🕵️ You are NOT the imposter')

const timePercentage = computed(() => {
  const maxTime = currentPhase.value === 'DISCUSSION' ? room.value?.discussion_time : room.value?.voting_time
  return (timeLeft.value / maxTime) * 100
})

const sortedParticipants = computed(() => {
  return [...participants.value].sort((a, b) => b.score - a.score)
})

const roundOutcome = computed(() => {
  if (!voteResults.value.length) return ''
  const topVoted = voteResults.value[0]
  const imposterParticipant = participants.value.find(p => p.is_imposter)
  
  if (topVoted.user_id === imposterParticipant?.user_id) {
    return '✅ Citizens Win! Imposter Found!'
  } else {
    return '❌ Imposter Wins! Wrong Person Voted!'
  }
})

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  currentUser.value = session?.user
  
  await loadGameData()
  subscribeToUpdates()
  startTimer()
})

onUnmounted(() => {
  if (roomSubscription) roomSubscription.unsubscribe()
  if (chatSubscription) chatSubscription.unsubscribe()
  if (timerInterval) clearInterval(timerInterval)
})

const loadGameData = async () => {
  // Load room
  const { data: roomData } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code)
    .single()
  
  room.value = roomData
  
  // Load current round
  const { data: roundData } = await supabase
    .from('game_rounds')
    .select('*')
    .eq('room_id', roomData.id)
    .eq('round_number', roomData.current_round)
    .single()
  
  currentRound.value = roundData
  secretWord.value = roundData?.secret_word || ''
  
  // Load participants
  const { data: participantsData } = await supabase
    .from('room_participants')
    .select('*, users(*)')
    .eq('room_id', roomData.id)
  
  participants.value = participantsData || []
  
  // Check if I'm the imposter
  const me = participants.value.find(p => p.user_id === currentUser.value.id)
  isImposter.value = me?.is_imposter || false
  
  // Load chat
  const { data: chatData } = await supabase
    .from('chat_messages')
    .select('*, users(*)')
    .eq('room_id', roomData.id)
    .order('created_at', { ascending: true })
  
  chatMessages.value = chatData || []
}

const subscribeToUpdates = () => {
  // Subscribe to round changes
  roomSubscription = supabase
    .channel(`game:${room.value.id}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'game_rounds',
      filter: `room_id=eq.${room.value.id}`
    }, async () => {
      await loadGameData()
      if (currentPhase.value === 'RESULTS') {
        await loadVoteResults()
      }
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
}

const startTimer = () => {
  timerInterval = setInterval(() => {
    if (!currentRound.value) return
    
    const phaseStartTime = new Date(currentRound.value.updated_at || currentRound.value.created_at)
    const elapsed = Math.floor((Date.now() - phaseStartTime) / 1000)
    const maxTime = currentPhase.value === 'DISCUSSION' ? room.value.discussion_time : room.value.voting_time
    
    timeLeft.value = Math.max(0, maxTime - elapsed)
    
    // Auto-transition phases
    if (timeLeft.value === 0 && currentPhase.value === 'DISCUSSION') {
      transitionToVoting()
    }
  }, 1000)
}

const transitionToVoting = async () => {
  if (!currentUser.value) return
  
  await supabase
    .from('game_rounds')
    .update({ status: 'VOTING' })
    .eq('id', currentRound.value.id)
}

const submitVote = async (votedUserId) => {
  if (hasVoted.value) return
  
  await supabase.from('votes').insert({
    round_id: currentRound.value.id,
    voter_id: currentUser.value.id,
    voted_user_id: votedUserId
  })
  
  myVote.value = votedUserId
  hasVoted.value = true
}

const loadVoteResults = async () => {
  const { data: votes } = await supabase
    .from('votes')
    .select('voted_user_id')
    .eq('round_id', currentRound.value.id)
  
  const voteCounts = {}
  votes.forEach(vote => {
    voteCounts[vote.voted_user_id] = (voteCounts[vote.voted_user_id] || 0) + 1
  })
  
  const results = participants.value.map(p => ({
    user_id: p.user_id,
    full_name: p.users.full_name,
    avatar_url: p.users.avatar_url,
    votes: voteCounts[p.user_id] || 0
  }))
  
  voteResults.value = results.sort((a, b) => b.votes - a.votes)
  
  const imposter = participants.value.find(p => p.is_imposter)
  imposterUser.value = imposter?.users
}

const sendMessage = async () => {
  if (!newMessage.value.trim()) return
  
  await supabase.from('chat_messages').insert({
    room_id: room.value.id,
    user_id: currentUser.value.id,
    message: newMessage.value.trim()
  })
  
  newMessage.value = ''
}

const toggleVoiceChat = () => {
  isVoiceConnected.value = !isVoiceConnected.value
  // WebRTC implementation would go here
}

const startTalking = () => {
  isTalking.value = true
  // Start transmitting audio
}

const stopTalking = () => {
  isTalking.value = false
  // Stop transmitting audio
}

const returnHome = () => {
  router.push('/')
}
</script>
