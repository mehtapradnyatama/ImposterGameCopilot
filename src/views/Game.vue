<template>
  <div class="min-h-screen p-4">
    <div class="max-w-7xl mx-auto">
      <!-- Game Header -->
      <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-bold">{{ room?.name }}</h1>
            <p class="text-sm text-gray-400">{{ participants.length }} Players | {{ impostorCount }} Impostor(s)</p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-400">Phase</p>
            <p class="text-xl font-bold" :class="phaseColor">{{ phaseText }}</p>
          </div>
        </div>
        
        <!-- Timer -->
        <div v-if="timeLeft > 0 && room?.status !== 'FINISHED'" class="mt-4">
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

        <!-- Host Controls -->
        <div v-if="isHost && room?.status === 'IN_PROGRESS'" class="mt-4 flex gap-2">
          <button 
            @click="extendTime"
            :disabled="extendCount >= 2"
            class="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm font-bold"
          >
            ⏱️ +30s Extend ({{ extendCount }}/2)
          </button>
          <button 
            @click="startVoting"
            class="bg-yellow-600 px-4 py-2 rounded-lg hover:bg-yellow-700 transition text-sm font-bold"
          >
            🗳️ Start Voting Now
          </button>
        </div>
      </div>

      <div class="grid lg:grid-cols-3 gap-4">
        <!-- Main Game Area -->
        <div class="lg:col-span-2 space-y-4">
          <!-- Your Word Display -->
          <div class="bg-gradient-to-r from-purple-900 to-pink-900 rounded-xl p-8 text-center">
            <p class="text-sm text-gray-300 mb-2">Your Role</p>
            <p class="text-2xl font-bold mb-4">
              {{ isImposter ? '🎭 YOU ARE THE IMPOSTOR!' : '🕵️ You are NOT the impostor' }}
            </p>
            <div class="bg-black/30 rounded-lg p-6 mt-4">
              <p class="text-gray-300 text-sm mb-2">Your Word:</p>
              <p class="text-5xl font-bold text-yellow-400">{{ myWord }}</p>
            </div>
            <p class="text-gray-300 mt-4">
              {{ isImposter 
                ? '🤫 You have a DIFFERENT word! Try to blend in without being caught!' 
                : '💬 Discuss with others to find who has a different word!' 
              }}
            </p>
          </div>

          <!-- Discussion Phase -->
          <div v-if="room?.status === 'IN_PROGRESS'" class="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h2 class="text-2xl font-bold mb-4">💬 Discussion Phase</h2>
            <p class="text-gray-300 mb-4">
              Talk with other players using the text chat or voice chat below. 
              {{ isHost ? 'As the host, you can start voting anytime!' : 'Wait for the host to start voting.' }}
            </p>
            
            <!-- Voice Chat Controls -->
            <div v-if="room?.voice_chat_enabled" class="bg-white/5 rounded-lg p-4">
              <h3 class="font-bold mb-3">🎤 Voice Chat</h3>
              <div class="flex gap-3 mb-3">
                <button 
                  @click="toggleVoiceChat"
                  :class="isVoiceConnected ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'"
                  class="px-6 py-3 rounded-lg font-bold transition"
                >
                  {{ isVoiceConnected ? '🎤 Connected' : '🎤 Join Voice' }}
                </button>
                
                <button
                  v-if="isVoiceConnected"
                  @click="toggleVoiceMode"
                  class="bg-gray-600 px-4 py-3 rounded-lg hover:bg-gray-700 transition"
                >
                  {{ isAlwaysOn ? '🔊 Always On' : '🎙️ Push-to-Talk' }}
                </button>
              </div>
              
              <button 
                v-if="isVoiceConnected && !isAlwaysOn"
                @mousedown="startTalking"
                @mouseup="stopTalking"
                @mouseleave="stopTalking"
                @touchstart="startTalking"
                @touchend="stopTalking"
                :class="isTalking ? 'bg-red-600' : 'bg-gray-600'"
                class="w-full px-6 py-4 rounded-lg font-bold transition text-lg"
              >
                {{ isTalking ? '🔴 TALKING...' : '🎤 Hold to Talk' }}
              </button>

              <p v-if="isVoiceConnected && isAlwaysOn" class="text-green-400 text-center mt-2">
                🔴 Microphone is always on
              </p>
            </div>
          </div>

          <!-- Voting Phase -->
          <div v-if="room?.status === 'VOTING'" class="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h2 class="text-2xl font-bold mb-4">🗳️ Voting Phase</h2>
            <p class="text-gray-300 mb-4">Vote for who you think is the impostor!</p>
            
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
            
            <p v-if="hasVoted" class="text-center text-green-400 mt-4">✓ Vote submitted! Waiting for others...</p>
            <p class="text-center text-gray-400 mt-2">{{ voteCount }}/{{ participants.length }} voted</p>
          </div>

          <!-- Results Phase -->
          <div v-if="room?.status === 'FINISHED'" class="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h2 class="text-2xl font-bold mb-6 text-center">📊 Game Results</h2>
            
            <div class="mb-6">
              <h3 class="text-xl font-bold mb-3">The Impostor(s) were...</h3>
              <div class="space-y-3">
                <div 
                  v-for="impostor in impostors"
                  :key="impostor.id"
                  class="flex items-center gap-4 bg-red-900/50 rounded-lg p-4"
                >
                  <img :src="impostor.users.avatar_url" class="w-16 h-16 rounded-full border-4 border-red-500" />
                  <div class="flex-1">
                    <p class="text-2xl font-bold">{{ impostor.users.full_name }}</p>
                    <p class="text-red-400">🎭 Impostor</p>
                    <p class="text-yellow-400 font-bold text-lg">Word: {{ impostor.word }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="mb-6">
              <h3 class="text-xl font-bold mb-3">Normal Players had:</h3>
              <p class="text-3xl font-bold text-center py-4 bg-green-900/30 rounded-lg">
                {{ normalWord }}
              </p>
            </div>

            <div class="mb-6">
              <h3 class="text-xl font-bold mb-3">Vote Results</h3>
              <div class="space-y-2">
                <div 
                  v-for="result in voteResults"
                  :key="result.user_id"
                  class="flex items-center gap-3 bg-white/5 rounded-lg p-3"
                  :class="result.is_impostor ? 'border-2 border-red-500' : ''"
                >
                  <img :src="result.avatar_url" class="w-10 h-10 rounded-full" />
                  <span class="flex-1 font-bold">
                    {{ result.full_name }}
                    <span v-if="result.is_impostor" class="text-red-400 ml-2">🎭</span>
                  </span>
                  <span class="text-2xl">{{ result.votes }} votes</span>
                </div>
              </div>
            </div>

            <div class="text-center mb-6">
              <p class="text-4xl font-bold mb-2">
                {{ gameOutcome }}
              </p>
            </div>

            <div class="mb-6">
              <h3 class="text-2xl font-bold mb-4 text-center">Final Scores</h3>
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
              class="w-full bg-purple-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-purple-700 transition"
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
    return '✅ Citizens Win! Impostor Found!'
  } else {
    return '❌ Impostors Win! Wrong Person Voted!'
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
