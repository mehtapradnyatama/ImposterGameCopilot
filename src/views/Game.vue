<template>
  <div class="min-h-screen p-4 pixel-grid">
    <div class="max-w-7xl mx-auto">
      <!-- Game Header - Arcade Stage Display -->
      <div class="bg-black border-8 border-yellow-400 p-6 mb-4 animate-slide-in-up" style="box-shadow: 8px 8px 0 rgba(234, 179, 8, 0.5);">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-black mb-1 text-yellow-400 score-display uppercase">{{ room?.name }}</h1>
            <p class="text-xs text-white score-display">{{ participants.length }} PLAYERS ● {{ impostorCount }} IMPOSTOR{{ impostorCount > 1 ? 'S' : '' }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-gray-400 score-display mb-1">■ STAGE</p>
            <div class="px-6 py-2 border-4" :class="phaseColorClass" :style="phaseBoxShadow">
              <p class="text-xl font-black score-display" :class="phaseTextColor">{{ phaseText.toUpperCase() }}</p>
            </div>
          </div>
        </div>
        
        <!-- Timer - Arcade Style -->
        <div v-if="timeLeft > 0 && room?.status !== 'FINISHED'" class="mt-4">
          <div class="flex justify-between text-xs mb-2">
            <span class="font-black text-white score-display">■ TIME REMAINING</span>
            <span class="font-black text-3xl score-display" :class="timeLeft < 30 ? 'text-red-400' : 'text-cyan-400'">{{ Math.floor(timeLeft / 60) }}:{{ String(timeLeft % 60).padStart(2, '0') }}</span>
          </div>
          <div class="w-full bg-gray-800 border-4 border-gray-900 h-6 relative" style="box-shadow: inset 4px 4px 0 rgba(0, 0, 0, 0.5);">
            <div 
              class="h-full transition-all duration-500" 
              :class="timeLeft < 30 ? 'bg-red-500' : 'bg-cyan-400'"
              :style="{ width: timePercentage + '%' }"
            ></div>
          </div>
        </div>

        <!-- Host Controls - Arcade Buttons -->
        <div v-if="isHost && room?.status === 'IN_PROGRESS'" class="mt-4 flex gap-3">
          <button 
            @click="extendTime"
            :disabled="extendCount >= 2"
            class="flex-1 bg-blue-600 border-4 border-blue-800 px-4 py-3 hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs font-black score-display text-white"
            style="box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.8);"
          >
            <span class="flex items-center justify-center gap-2">
              <span class="text-base">▲</span>
              <span>+30S EXTEND ({{ extendCount }}/2)</span>
            </span>
          </button>
          <button 
            @click="startVoting"
            class="flex-1 bg-yellow-500 border-4 border-yellow-700 px-4 py-3 hover:bg-yellow-400 transition-all text-xs font-black score-display text-black"
            style="box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.8);"
          >
            START VOTING NOW
          </button>
        </div>
      </div>

      <div class="grid lg:grid-cols-3 gap-4">
        <!-- Main Game Area -->
        <div class="lg:col-span-2 space-y-4">
          <!-- Current Speaker & Your Word Display -->
          <div class="relative bg-black border-8 p-8 text-center border-yellow-400" style="box-shadow: 8px 8px 0 rgba(234, 179, 8, 0.5);">
            <div>
              <!-- Current Speaker Display -->
              <div v-if="room?.status === 'IN_PROGRESS' && currentSpeaker" class="mb-6">
                <p class="text-xs font-black mb-3 score-display uppercase text-yellow-400">■ NOW SPEAKING ■</p>
                <div class="flex items-center justify-center gap-4 bg-yellow-600 border-4 border-yellow-800 p-5 mb-3" style="box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.8);">
                  <img :src="currentSpeaker.users.avatar_url" class="w-16 h-16 border-4 border-yellow-900" style="image-rendering: pixelated;" />
                  <p class="text-3xl font-black score-display text-white">
                    {{ currentSpeaker.users.full_name.toUpperCase() }}
                  </p>
                </div>
                
                <!-- Timer for current speaker -->
                <div class="bg-gray-900 border-4 border-yellow-600 p-4">
                  <p class="text-yellow-400 text-xs mb-2 score-display">TIME LEFT FOR THIS PLAYER</p>
                  <p class="text-4xl font-black score-display text-yellow-400">{{ speakTimeLeft }}S</p>
                </div>
                
                <!-- Next button (only for current speaker) -->
                <div v-if="isMyTurn" class="mt-4">
                  <button 
                    @click="nextSpeaker"
                    class="bg-green-600 border-4 border-green-800 px-8 py-4 hover:bg-green-500 transition-all text-lg font-black score-display text-white"
                    style="box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.8);"
                  >
                    ▶ I'M DONE - NEXT SPEAKER
                  </button>
                </div>
                
                <div v-else class="mt-4 bg-gray-800 border-4 border-gray-900 p-3">
                  <p class="text-gray-400 text-xs score-display">WAIT FOR {{ currentSpeaker.users.full_name.toUpperCase() }} TO FINISH</p>
                </div>
              </div>
              
              <!-- Your Word -->
              <div class="bg-gray-900 border-4 p-8 border-cyan-600" style="box-shadow: inset 4px 4px 0 rgba(0, 0, 0, 0.5);">
                <p class="text-gray-400 text-xs mb-3 score-display uppercase">▼ YOUR WORD ▼</p>
                <p class="text-6xl md:text-7xl font-black score-display text-cyan-400">{{ myWord }}</p>
              </div>
              
              <div class="mt-6 px-4 py-3 border-4 bg-yellow-900 border-yellow-700">
                <p class="text-white text-xs leading-relaxed score-display">
                  SPEAK ABOUT YOUR WORD WHEN IT'S YOUR TURN. FIND WHO HAS DIFFERENT WORDS!
                </p>
              </div>
            </div>
          </div>
          <!-- STAGE 2: Speak Round Phase -->
          <div v-if="room?.status === 'IN_PROGRESS'" class="bg-gray-900 border-4 border-blue-500 p-6" style="box-shadow: 6px 6px 0 rgba(59, 130, 246, 0.5);">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 bg-blue-600 border-4 border-blue-800 flex items-center justify-center font-black text-xl score-display">2</div>
              <h2 class="text-2xl font-black text-blue-400 score-display">STAGE 2: SPEAK ROUND</h2>
            </div>
            <div class="bg-blue-900 border-4 border-blue-700 p-4 mb-4">
              <p class="text-white text-xs leading-relaxed score-display uppercase">
                EACH PLAYER TAKES TURNS TO SPEAK ABOUT THEIR WORD!
                {{ isHost ? 'AS HOST, YOU CAN START VOTING ANYTIME!' : '' }}
              </p>
            </div>
            
            <!-- Voice Chat Controls - Arcade Style -->
            <div v-if="room?.voice_chat_enabled" class="bg-black border-4 border-purple-500 p-5" style="box-shadow: 4px 4px 0 rgba(168, 85, 247, 0.5);">
              <h3 class="font-black mb-4 text-base text-purple-400 score-display">■ VOICE CHAT</h3>
              <div class="flex gap-3 mb-3">
                <button 
                  @click="toggleVoiceChat"
                  :class="isVoiceConnected ? 'bg-green-600 border-green-800 hover:bg-green-500' : 'bg-purple-600 border-purple-800 hover:bg-purple-500'"
                  class="flex-1 border-4 px-6 py-3 font-black transition-all score-display text-white"
                  style="box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.8);"
                >
                  {{ isVoiceConnected ? 'CONNECTED' : 'JOIN VOICE' }}
                </button>
                
                <button
                  v-if="isVoiceConnected"
                  @click="toggleVoiceMode"
                  class="bg-gray-700 border-4 border-gray-900 px-5 py-3 hover:bg-gray-600 transition-all font-black score-display text-white"
                  style="box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.8);"
                >
                  {{ isAlwaysOn ? 'ALWAYS ON' : 'PUSH-TO-TALK' }}
                </button>
              </div>
              
              <button 
                v-if="isVoiceConnected && !isAlwaysOn"
                @mousedown="startTalking"
                @mouseup="stopTalking"
                @mouseleave="stopTalking"
                @touchstart="startTalking"
                @touchend="stopTalking"
                :class="isTalking ? 'bg-red-600 border-red-800 animate-pixel-pulse' : 'bg-gray-700 border-gray-900'"
                class="w-full border-4 px-6 py-5 font-black transition-all text-lg score-display text-white"
                style="box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.8);"
              >
                {{ isTalking ? '● TALKING...' : 'HOLD TO TALK' }}
              </button>

              <p v-if="isVoiceConnected && isAlwaysOn" class="text-green-400 text-center mt-3 font-black score-display text-xs">
                ● MICROPHONE IS ALWAYS ON
              </p>
            </div>
          </div>

          <!-- STAGE 3: Voting Phase -->
          <div v-if="room?.status === 'VOTING'" class="bg-gray-900 border-4 border-yellow-500 p-6" style="box-shadow: 6px 6px 0 rgba(234, 179, 8, 0.5);">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 bg-yellow-500 border-4 border-yellow-700 flex items-center justify-center font-black text-xl text-black score-display">3</div>
              <h2 class="text-2xl font-black text-yellow-400 score-display">STAGE 3: VOTING</h2>
            </div>
            <div class="bg-yellow-900 border-4 border-yellow-700 p-4 mb-5">
              <p class="text-white text-xs leading-relaxed score-display uppercase">VOTE FOR WHO YOU THINK IS THE IMPOSTOR!</p>
            </div>
            
            <!-- Voting Buttons - Arcade Character Cards -->
            <div class="grid md:grid-cols-2 gap-4">
              <button
                v-for="participant in participants"
                :key="participant.id"
                @click="submitVote(participant.user_id)"
                :disabled="hasVoted || participant.user_id === currentUser?.id"
                class="flex items-center gap-4 p-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-4"
                :class="myVote === participant.user_id ? 'bg-yellow-500 border-yellow-700' : 'bg-black border-white hover:border-yellow-400'"
                :style="myVote === participant.user_id ? 'box-shadow: 6px 6px 0 rgba(234, 179, 8, 0.8);' : 'box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.8);'"
              >
                <img :src="participant.users.avatar_url" class="w-14 h-14 border-4" :class="myVote === participant.user_id ? 'border-yellow-900' : 'border-cyan-400'" style="image-rendering: pixelated;" />
                <div class="flex-1 text-left">
                  <span class="font-black text-base score-display" :class="myVote === participant.user_id ? 'text-black' : 'text-white'">{{ participant.users.full_name.toUpperCase() }}</span>
                  <p v-if="participant.user_id === currentUser?.id" class="text-xs score-display" :class="myVote === participant.user_id ? 'text-gray-700' : 'text-gray-400'">(YOU)</p>
                </div>
                <span v-if="myVote === participant.user_id" class="text-2xl animate-blink">▶</span>
              </button>
            </div>
            
            <div v-if="hasVoted" class="mt-5 bg-green-600 border-4 border-green-800 p-4 text-center" style="box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.8);">
              <p class="text-white font-black score-display text-xs">VOTE SUBMITTED! WAITING FOR OTHERS...</p>
            </div>
            <div class="text-center mt-3 px-4 py-2 bg-gray-800 border-4 border-gray-900 inline-block" style="box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.8);">
              <p class="text-white font-black score-display text-xs">{{ voteCount }}/{{ participants.length }} VOTED</p>
            </div>
          </div>

          <!-- STAGE 4: Results Phase - GAME OVER Screen -->
          <div v-if="room?.status === 'FINISHED'" class="bg-black border-8 border-red-500 p-6 animate-slide-in-up" style="box-shadow: 8px 8px 0 rgba(239, 68, 68, 0.5);">
            <div class="text-center mb-6">
              <div class="text-red-500 text-xs mb-4 animate-blink score-display">
                ███ GAME OVER ███
              </div>
              <h2 class="text-5xl font-black mb-2 text-red-500 score-display animate-pixel-pulse">RESULTS</h2>
            </div>
            
            <!-- The Impostors -->
            <div class="mb-6">
              <div class="bg-red-900 border-4 border-red-700 p-3 mb-3" style="box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.8);">
                <h3 class="text-base font-black text-white score-display text-center">■ THE IMPOSTOR(S) ■</h3>
              </div>
              <div class="space-y-3">
                <div 
                  v-for="impostor in impostors"
                  :key="impostor.id"
                  class="flex items-center gap-4 bg-red-600 border-4 border-red-800 p-4"
                  style="box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.8);"
                >
                  <img :src="impostor.users.avatar_url" class="w-16 h-16 border-4 border-red-900" style="image-rendering: pixelated;" />
                  <div class="flex-1">
                    <p class="text-2xl font-black text-white score-display">{{ impostor.users.full_name.toUpperCase() }}</p>
                    <p class="text-red-200 font-black text-xs score-display mt-1">IMPOSTOR</p>
                    <p class="text-yellow-400 font-black text-lg score-display mt-1">{{ impostor.word.toUpperCase() }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Normal Players Word -->
            <div class="mb-6">
              <div class="bg-green-900 border-4 border-green-700 p-3 mb-3" style="box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.8);">
                <h3 class="text-base font-black text-white score-display text-center">■ NORMAL PLAYERS HAD ■</h3>
              </div>
              <div class="bg-green-600 border-4 border-green-800 p-6 text-center" style="box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.8);">
                <p class="text-5xl font-black text-white score-display">
                  {{ normalWord.toUpperCase() }}
                </p>
              </div>
            </div>

            <!-- Vote Results -->
            <div class="mb-6">
              <div class="bg-yellow-900 border-4 border-yellow-700 p-3 mb-3" style="box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.8);">
                <h3 class="text-base font-black text-white score-display text-center">■ VOTE RESULTS ■</h3>
              </div>
              <div class="space-y-2">
                <div 
                  v-for="result in voteResults"
                  :key="result.user_id"
                  class="flex items-center gap-3 p-3 border-4 transition-all"
                  :class="result.is_impostor ? 'bg-red-600 border-red-800' : 'bg-gray-800 border-gray-900'"
                  :style="result.is_impostor ? 'box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.8);' : 'box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.8);'"
                >
                  <img :src="result.avatar_url" class="w-12 h-12 border-4" :class="result.is_impostor ? 'border-red-900' : 'border-gray-700'" style="image-rendering: pixelated;" />
                  <span class="flex-1 font-black text-white score-display text-sm">
                    {{ result.full_name.toUpperCase() }}
                    <span v-if="result.is_impostor" class="text-red-300 ml-2 text-xs">IMPOSTOR</span>
                  </span>
                  <span class="text-3xl font-black text-white score-display">{{ result.votes }}</span>
                  <span class="text-xs text-gray-300 score-display">VOTE{{ result.votes !== 1 ? 'S' : '' }}</span>
                </div>
              </div>
            </div>

            <!-- Victory/Defeat Banner -->
            <div class="text-center mb-6 p-8 border-8 animate-pixel-pulse" :class="gameOutcome.includes('Win') ? 'bg-green-600 border-green-800' : 'bg-red-600 border-red-800'" :style="gameOutcome.includes('Win') ? 'box-shadow: 8px 8px 0 rgba(22, 163, 74, 0.8);' : 'box-shadow: 8px 8px 0 rgba(220, 38, 38, 0.8);'">
              <p class="text-4xl font-black text-white score-display">
                {{ gameOutcome.toUpperCase() }}
              </p>
            </div>

            <!-- Final Scoreboard -->
            <div class="mb-6">
              <div class="bg-purple-900 border-4 border-purple-700 p-3 mb-4" style="box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.8);">
                <h3 class="text-2xl font-black text-white score-display text-center">■ FINAL SCOREBOARD ■</h3>
              </div>
              <div class="space-y-2">
                <div 
                  v-for="(participant, index) in sortedParticipants"
                  :key="participant.id"
                  class="flex items-center gap-4 p-4 border-4 transition-all"
                  :class="index === 0 ? 'bg-yellow-500 border-yellow-700' : index === 1 ? 'bg-gray-500 border-gray-700' : index === 2 ? 'bg-orange-600 border-orange-800' : 'bg-gray-800 border-gray-900'"
                  :style="index === 0 ? 'box-shadow: 8px 8px 0 rgba(234, 179, 8, 0.8);' : 'box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.8);'"
                >
                  <div class="w-10 h-10 flex items-center justify-center font-black text-2xl score-display" :class="index === 0 ? 'bg-yellow-700 text-black border-4 border-yellow-900' : index === 1 ? 'bg-gray-700 text-white border-4 border-gray-900' : index === 2 ? 'bg-orange-800 text-white border-4 border-orange-900' : 'bg-gray-900 text-gray-400 border-4 border-black'">
                    {{ index + 1 }}
                  </div>
                  <img :src="participant.users.avatar_url" class="w-12 h-12 border-4" :class="index === 0 ? 'border-yellow-900' : 'border-gray-700'" style="image-rendering: pixelated;" />
                  <span class="flex-1 text-left font-black text-base score-display" :class="index === 0 ? 'text-black' : 'text-white'">{{ participant.users.full_name.toUpperCase() }}</span>
                  <span class="text-3xl font-black score-display" :class="index === 0 ? 'text-black' : 'text-white'">{{ participant.score }}</span>
                  <span class="text-xs score-display" :class="index === 0 ? 'text-gray-800' : 'text-gray-400'">PTS</span>
                </div>
              </div>
            </div>

            <!-- Return Home Button -->
            <button 
              @click="returnHome"
              class="w-full bg-purple-600 border-4 border-purple-800 px-8 py-6 text-2xl hover:bg-purple-500 transition-all score-display text-white btn-retro"
            >
              <span class="flex items-center justify-center gap-3">
                <span class="text-3xl">◀</span>
                <span>BACK TO HOME</span>
              </span>
            </button>
          </div>
        </div>

        <!-- Sidebar - Arcade Side Panels -->
        <div class="space-y-4">
          <!-- Players Panel -->
          <div class="bg-gray-900 border-4 border-purple-500 p-4" style="box-shadow: 6px 6px 0 rgba(168, 85, 247, 0.5);">
            <h3 class="font-black mb-3 text-purple-400 text-xs score-display">■ PLAYERS ({{ participants.length }}) ■</h3>
            <div class="space-y-2">
              <div 
                v-for="participant in participants"
                :key="participant.id"
                class="flex items-center gap-2 bg-black border-2 border-purple-700 p-2"
                style="box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);"
              >
                <img :src="participant.users.avatar_url" class="w-9 h-9 border-2 border-purple-500" style="image-rendering: pixelated;" />
                <span class="text-xs flex-1 font-black text-white score-display">{{ participant.users.full_name.toUpperCase() }}</span>
                <span class="text-xs font-black px-2 py-1 bg-purple-600 border-2 border-purple-800 text-white score-display">{{ participant.score }}</span>
              </div>
            </div>
          </div>

          <!-- Chat Panel -->
          <div class="bg-gray-900 border-4 border-green-500 p-4" style="box-shadow: 6px 6px 0 rgba(34, 197, 94, 0.5);">
            <h3 class="font-black mb-3 text-green-400 text-xs score-display">■ CHAT ■</h3>
            <div class="h-64 overflow-y-auto mb-3 bg-black border-2 border-green-700 p-3 space-y-2" style="box-shadow: inset 2px 2px 0 rgba(0, 0, 0, 0.5);">
              <div 
                v-for="message in chatMessages"
                :key="message.id"
                class="text-xs"
              >
                <span class="font-black text-green-400 score-display">{{ message.users.full_name.toUpperCase() }}:</span>
                <span class="ml-1 text-white score-display">{{ message.message }}</span>
              </div>
              <p v-if="chatMessages.length === 0" class="text-gray-500 text-center py-8 text-xs score-display">NO MESSAGES YET...</p>
            </div>
            <form @submit.prevent="sendMessage" class="flex gap-2">
              <input 
                v-model="newMessage"
                type="text"
                placeholder="TYPE MESSAGE..."
                class="flex-1 px-3 py-2 bg-black border-2 border-green-600 focus:outline-none focus:border-green-400 text-xs transition-all text-white score-display uppercase placeholder-gray-600"
              />
              <button 
                type="submit"
                class="bg-green-600 border-2 border-green-800 px-4 py-2 hover:bg-green-500 transition-all font-black text-xs score-display text-white"
                style="box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);"
              >
                SEND
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

// Turn-based speaking system
const speakerOrder = ref([]) // Randomized order of participants
const currentSpeakerIndex = ref(0)
const speakTimeLeft = ref(0)

// Voice chat
const isVoiceConnected = ref(false)
const isTalking = ref(false)
const isAlwaysOn = ref(false)
const localStream = ref(null)
const peerConnections = ref({}) // userId -> RTCPeerConnection
const voiceChannel = ref(null)

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

const currentSpeaker = computed(() => {
  if (!speakerOrder.value.length || currentSpeakerIndex.value >= speakerOrder.value.length) return null
  return speakerOrder.value[currentSpeakerIndex.value]
})

const isMyTurn = computed(() => {
  return currentSpeaker.value?.user_id === currentUser.value?.id
})

const phaseText = computed(() => {
  if (!room.value) return 'Loading...'
  const phases = {
    'IN_PROGRESS': 'Speak Round',
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

const phaseColorClass = computed(() => {
  if (!room.value) return 'bg-gray-800 border-gray-900'
  const colors = {
    'IN_PROGRESS': 'bg-blue-600 border-blue-800',
    'VOTING': 'bg-yellow-500 border-yellow-700',
    'FINISHED': 'bg-green-600 border-green-800'
  }
  return colors[room.value.status] || 'bg-gray-800 border-gray-900'
})

const phaseTextColor = computed(() => {
  if (!room.value) return 'text-gray-400'
  const colors = {
    'IN_PROGRESS': 'text-white',
    'VOTING': 'text-black',
    'FINISHED': 'text-white'
  }
  return colors[room.value.status] || 'text-gray-400'
})

const phaseBoxShadow = computed(() => {
  if (!room.value) return 'box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.8);'
  const shadows = {
    'IN_PROGRESS': 'box-shadow: 4px 4px 0 rgba(37, 99, 235, 0.8);',
    'VOTING': 'box-shadow: 4px 4px 0 rgba(234, 179, 8, 0.8);',
    'FINISHED': 'box-shadow: 4px 4px 0 rgba(22, 163, 74, 0.8);'
  }
  return shadows[room.value.status] || 'box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.8);'
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
  
  // Cleanup voice chat
  if (isVoiceConnected.value) {
    disconnectVoiceChat()
  }
})

const loadGameData = async () => {
  console.group('📊 LOAD GAME DATA');
  
  try {
    console.log('1. Loading room with code:', code);
    
    // Load room
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code)
      .single()
    
    if (roomError) {
      console.error('❌ Room load error:', roomError);
      throw roomError;
    }
    
    console.log('✅ Room loaded:', roomData);
    room.value = roomData
    gameStartTime.value = roomData.created_at
    
    console.log('2. Loading participants for room:', roomData.id);
    
    // Load participants
    const { data: participantsData, error: participantsError } = await supabase
      .from('room_participants')
      .select('*, users:user_id(*)')
      .eq('room_id', roomData.id)
    
    if (participantsError) {
      console.error('❌ Participants load error:', participantsError);
      throw participantsError;
    }
    
    console.log('✅ Participants loaded:', participantsData);
    participants.value = participantsData || []
    
    // Initialize speaker order (random shuffle) if not already set
    if (speakerOrder.value.length === 0 && participants.value.length > 0) {
      speakerOrder.value = [...participants.value].sort(() => Math.random() - 0.5)
      currentSpeakerIndex.value = 0
    }
    
    // Get my data
    const me = participants.value.find(p => p.user_id === currentUser.value.id)
    if (me) {
      isImposter.value = me.is_imposter || false
      myWord.value = me.word || ''
    }
    
    // Load chat
    const { data: chatData } = await supabase
      .from('chat_messages')
      .select('*, users:user_id(*)')
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
    
    console.log('✅ Game data loaded successfully');
    console.groupEnd();
  } catch (error) {
    console.error('💥 Error loading game data:', error);
    console.groupEnd();
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
        votingStartTime.value = new Date().toISOString()
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
      // Turn-based timer: track time for current speaker
      const startTime = new Date(gameStartTime.value)
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      
      // Calculate which speaker's turn it is based on elapsed time
      const timePerPlayer = room.value.discussion_time
      const totalElapsed = elapsed - (extendCount.value * 30)
      const calculatedSpeakerIndex = Math.floor(totalElapsed / timePerPlayer)
      
      // Update speaker index if changed
      if (calculatedSpeakerIndex !== currentSpeakerIndex.value && calculatedSpeakerIndex < speakerOrder.value.length) {
        currentSpeakerIndex.value = calculatedSpeakerIndex
      }
      
      // Time left for current speaker
      const elapsedForCurrentSpeaker = totalElapsed - (currentSpeakerIndex.value * timePerPlayer)
      speakTimeLeft.value = Math.max(0, timePerPlayer - elapsedForCurrentSpeaker)
      
      // Check if all speakers finished
      if (currentSpeakerIndex.value >= speakerOrder.value.length) {
        if (isHost.value) {
          startVoting()
        }
      }
      
      // Overall time left
      const maxTime = (speakerOrder.value.length * timePerPlayer) + (extendCount.value * 30)
      timeLeft.value = Math.max(0, maxTime - elapsed)
    } else if (room.value.status === 'VOTING' && votingStartTime.value) {
      const startTime = new Date(votingStartTime.value)
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      timeLeft.value = Math.max(0, room.value.voting_time - elapsed)
      
      if (timeLeft.value === 0 && isHost.value) {
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

const nextSpeaker = async () => {
  if (!isMyTurn.value) return
  
  // Move to next speaker
  if (currentSpeakerIndex.value < speakerOrder.value.length - 1) {
    currentSpeakerIndex.value++
    // Update game start time to simulate time skip
    const newStartTime = new Date(Date.now() - (currentSpeakerIndex.value * room.value.discussion_time * 1000))
    gameStartTime.value = newStartTime.toISOString()
  } else {
    // All speakers done, start voting if host
    if (isHost.value) {
      await startVoting()
    }
  }
}

const startVoting = async () => {
  if (!isHost.value) return
  
  console.group('🎯 START VOTING DEBUG');
  
  try {
    votingStartTime.value = new Date().toISOString()
    
    console.log('1. Current user:', currentUser.value?.id);
    console.log('2. Room host:', room.value.host_id);
    console.log('3. Is host:', isHost.value);
    console.log('4. Room ID:', room.value.id);
    console.log('5. New status: VOTING');
    console.log('6. Voting start time:', votingStartTime.value);
    
    // Check auth
    const { data: { session } } = await supabase.auth.getSession();
    console.log('7. Session exists:', session ? 'YES' : 'NO');
    console.log('8. Session user ID:', session?.user?.id);
    
    console.log('9. Attempting UPDATE rooms...');
    const { data, error } = await supabase
      .from('rooms')
      .update({ status: 'VOTING' })
      .eq('id', room.value.id)
      .select();
    
    if (error) {
      console.error('❌ UPDATE FAILED:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    
    console.log('✅ Room updated successfully:', data);
    console.groupEnd();
  } catch (error) {
    console.error('💥 START VOTING ERROR:', error);
    console.groupEnd();
    alert('Error starting voting: ' + error.message)
  }
}

const submitVote = async (votedUserId) => {
  console.group('🗳️ SUBMIT VOTE DEBUG');
  console.log('1. Initial State:', {
    hasVoted: hasVoted.value,
    votingForSelf: votedUserId === currentUser.value.id,
    currentUserId: currentUser.value?.id,
    votedUserId: votedUserId
  });
  
  if (hasVoted.value || votedUserId === currentUser.value.id) {
    console.warn('❌ Cannot vote - already voted or voting for self');
    console.groupEnd();
    return
  }
  
  try {
    // Check authentication
    console.log('2. Auth Check:');
    const { data: { session } } = await supabase.auth.getSession();
    console.log('   Session:', session ? 'EXISTS' : 'NULL');
    console.log('   User ID:', session?.user?.id);
    console.log('   Email:', session?.user?.email);
    
    // Check if user is participant
    console.log('3. Participant Check:');
    const { data: participantCheck, error: participantError } = await supabase
      .from('room_participants')
      .select('*')
      .eq('room_id', room.value.id)
      .eq('user_id', currentUser.value.id)
      .single();
    
    console.log('   Participant exists:', participantCheck ? 'YES' : 'NO');
    if (participantError) {
      console.error('   Participant error:', participantError);
    }
    
    // Check room exists
    console.log('4. Room Check:');
    const { data: roomCheck, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', room.value.id)
      .single();
    
    console.log('   Room exists:', roomCheck ? 'YES' : 'NO');
    console.log('   Room status:', roomCheck?.status);
    if (roomError) {
      console.error('   Room error:', roomError);
    }
    
    // Check policies
    console.log('5. Policy Test - Try to read votes:');
    const { data: votesRead, error: votesReadError } = await supabase
      .from('votes')
      .select('*')
      .eq('room_id', room.value.id);
    
    console.log('   Can read votes:', votesReadError ? 'NO' : 'YES');
    console.log('   Existing votes count:', votesRead?.length || 0);
    if (votesReadError) {
      console.error('   Read error:', votesReadError);
    }
    
    // Attempt insert
    console.log('6. Attempting INSERT:');
    const voteData = {
      room_id: room.value.id,
      voter_id: currentUser.value.id,
      voted_for_id: votedUserId
    };
    console.log('   Vote data:', voteData);
    
    const { data, error } = await supabase.from('votes').insert(voteData).select();
    
    if (error) {
      console.error('❌ INSERT FAILED:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    
    console.log('✅ Vote submitted successfully:', data);
    myVote.value = votedUserId
    hasVoted.value = true
    console.groupEnd();
  } catch (error) {
    console.error('💥 CATCH ERROR:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    console.groupEnd();
    alert('Error submitting vote: ' + (error.message || error.hint || 'Unknown error. Check console.'))
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

const toggleVoiceChat = async () => {
  if (isVoiceConnected.value) {
    // Disconnect voice chat
    disconnectVoiceChat()
  } else {
    // Connect voice chat
    try {
      // Get microphone access
      localStream.value = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      
      // Mute initially if not always-on
      if (!isAlwaysOn.value) {
        localStream.value.getAudioTracks().forEach(track => track.enabled = false)
      }
      
      // Create voice channel for signaling
      voiceChannel.value = supabase.channel(`voice:${room.value.id}`)
        .on('broadcast', { event: 'offer' }, async ({ payload }) => {
          if (payload.to === currentUser.value.id) {
            await handleOffer(payload)
          }
        })
        .on('broadcast', { event: 'answer' }, async ({ payload }) => {
          if (payload.to === currentUser.value.id) {
            await handleAnswer(payload)
          }
        })
        .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
          if (payload.to === currentUser.value.id) {
            await handleIceCandidate(payload)
          }
        })
        .on('broadcast', { event: 'user-joined' }, async ({ payload }) => {
          if (payload.userId !== currentUser.value.id) {
            await createPeerConnection(payload.userId, true)
          }
        })
        .on('broadcast', { event: 'user-left' }, ({ payload }) => {
          if (peerConnections.value[payload.userId]) {
            peerConnections.value[payload.userId].close()
            delete peerConnections.value[payload.userId]
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            isVoiceConnected.value = true
            
            // Notify others that we joined
            await voiceChannel.value.send({
              type: 'broadcast',
              event: 'user-joined',
              payload: { userId: currentUser.value.id }
            })
            
            // Create peer connections for existing participants
            for (const participant of participants.value) {
              if (participant.user_id !== currentUser.value.id) {
                // Small delay to avoid race conditions
                await new Promise(resolve => setTimeout(resolve, 100))
                await createPeerConnection(participant.user_id, true)
              }
            }
          }
        })
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Could not access microphone. Please check permissions.')
      isVoiceConnected.value = false
    }
  }
}

const disconnectVoiceChat = () => {
  // Stop all tracks
  if (localStream.value) {
    localStream.value.getTracks().forEach(track => track.stop())
    localStream.value = null
  }
  
  // Close all peer connections
  Object.values(peerConnections.value).forEach(pc => pc.close())
  peerConnections.value = {}
  
  // Notify others and unsubscribe from channel
  if (voiceChannel.value) {
    voiceChannel.value.send({
      type: 'broadcast',
      event: 'user-left',
      payload: { userId: currentUser.value.id }
    })
    voiceChannel.value.unsubscribe()
    voiceChannel.value = null
  }
  
  isVoiceConnected.value = false
  isTalking.value = false
}

const createPeerConnection = async (remoteUserId, isInitiator) => {
  if (peerConnections.value[remoteUserId]) return
  
  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  }
  
  const pc = new RTCPeerConnection(configuration)
  peerConnections.value[remoteUserId] = pc
  
  // Add local stream tracks
  if (localStream.value) {
    localStream.value.getTracks().forEach(track => {
      pc.addTrack(track, localStream.value)
    })
  }
  
  // Handle incoming audio
  pc.ontrack = (event) => {
    const remoteAudio = new Audio()
    remoteAudio.srcObject = event.streams[0]
    remoteAudio.play().catch(e => console.error('Error playing remote audio:', e))
  }
  
  // Handle ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate && voiceChannel.value) {
      voiceChannel.value.send({
        type: 'broadcast',
        event: 'ice-candidate',
        payload: {
          to: remoteUserId,
          from: currentUser.value.id,
          candidate: event.candidate
        }
      })
    }
  }
  
  // Create offer if we're the initiator
  if (isInitiator) {
    try {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      
      await voiceChannel.value.send({
        type: 'broadcast',
        event: 'offer',
        payload: {
          to: remoteUserId,
          from: currentUser.value.id,
          offer: pc.localDescription
        }
      })
    } catch (error) {
      console.error('Error creating offer:', error)
    }
  }
}

const handleOffer = async ({ from, offer }) => {
  try {
    // Create peer connection if not exists
    if (!peerConnections.value[from]) {
      await createPeerConnection(from, false)
    }
    
    const pc = peerConnections.value[from]
    await pc.setRemoteDescription(new RTCSessionDescription(offer))
    
    // Create answer
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    
    // Send answer back
    await voiceChannel.value.send({
      type: 'broadcast',
      event: 'answer',
      payload: {
        to: from,
        from: currentUser.value.id,
        answer: pc.localDescription
      }
    })
  } catch (error) {
    console.error('Error handling offer:', error)
  }
}

const handleAnswer = async ({ from, answer }) => {
  try {
    const pc = peerConnections.value[from]
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer))
    }
  } catch (error) {
    console.error('Error handling answer:', error)
  }
}

const handleIceCandidate = async ({ from, candidate }) => {
  try {
    const pc = peerConnections.value[from]
    if (pc && candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate))
    }
  } catch (error) {
    console.error('Error handling ICE candidate:', error)
  }
}

const toggleVoiceMode = () => {
  isAlwaysOn.value = !isAlwaysOn.value
  if (isAlwaysOn.value) {
    isTalking.value = true
    // Enable microphone
    if (localStream.value) {
      localStream.value.getAudioTracks().forEach(track => track.enabled = true)
    }
  } else {
    isTalking.value = false
    // Disable microphone
    if (localStream.value) {
      localStream.value.getAudioTracks().forEach(track => track.enabled = false)
    }
  }
}

const startTalking = () => {
  if (!isAlwaysOn.value && localStream.value) {
    isTalking.value = true
    // Enable microphone
    localStream.value.getAudioTracks().forEach(track => track.enabled = true)
  }
}

const stopTalking = () => {
  if (!isAlwaysOn.value && localStream.value) {
    isTalking.value = false
    // Disable microphone
    localStream.value.getAudioTracks().forEach(track => track.enabled = false)
  }
}

const returnHome = () => {
  router.push('/')
}
</script>
