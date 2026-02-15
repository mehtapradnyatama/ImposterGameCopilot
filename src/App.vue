<template>
  <div id="app" class="min-h-screen">
    
    <!-- Global Controls Menu (Fixed Top-Right) -->
    <div class="fixed top-4 right-4 z-50">
      <!-- Collapsed: Small Button (Hamburger) -->
      <button 
        v-if="!showControls"
        @click="showControls = true"
        class="bg-black border-4 border-yellow-400 p-3 transition-all hover:scale-110 score-display text-2xl"
        style="box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.8);"
        :class="isBgmPlaying ? 'text-green-400' : 'text-gray-600'"
      >
        {{ isBgmPlaying ? '🎵' : '☰' }}
      </button>
      
      <!-- Expanded: Full Controls -->
      <div v-else class="bg-black border-4 border-yellow-400 p-4 space-y-2 animate-slide-in-left" style="box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.8);">
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-yellow-400 text-xs score-display">MENU</span>
          <button 
            @click="showControls = false"
            class="text-gray-400 hover:text-white text-xs score-display"
          >
            ✕
          </button>
        </div>
        
        <!-- Toggle Button -->
        <button 
          @click="toggleBGM"
          class="w-full px-4 py-2 transition-all hover:scale-105 score-display text-sm border-2"
          :class="isBgmPlaying ? 'border-green-400 text-green-400 bg-green-950' : 'border-gray-600 text-gray-600 bg-gray-900'"
        >
          {{ isBgmPlaying ? '🔊 BGM ON' : '🔇 BGM OFF' }}
        </button>
        
        <!-- Volume Slider -->
        <div class="flex items-center gap-2 text-yellow-400">
          <span class="text-xs score-display">VOL</span>
          <input 
            type="range" 
            min="0" 
            max="100" 
            v-model="bgmVolume"
            @input="setBGMVolume(bgmVolume / 100)"
            class="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <span class="text-xs score-display w-8">{{ bgmVolume }}</span>
        </div>
        
        <!-- Divider -->
        <div class="border-t-2 border-gray-700 my-2"></div>
        
        <!-- Back to Home Button -->
        <button 
          @click="goHome"
          class="w-full px-4 py-2 bg-purple-600 border-2 border-purple-800 text-white transition-all hover:bg-purple-500 score-display text-sm"
          style="box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);"
        >
          <span class="flex items-center justify-center gap-2">
            <span>◀</span>
            <span>HOME</span>
          </span>
        </button>
      </div>
    </div>
    
    <router-view />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'vue-router'
import { useAudio } from '@/composables/useAudio'

const router = useRouter()
const bgmVolume = ref(50) // Default volume 50%
const showControls = ref(false) // Controls hidden by default

// Audio controls
const { playBGM, toggleBGM, isBgmPlaying, setBGMVolume } = useAudio()

const goHome = () => {
  showControls.value = false
  router.push('/')
}

onMounted(() => {
  // Set initial BGM volume
  setBGMVolume(bgmVolume.value / 100)
  
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      // User signed in successfully
      console.log('User signed in:', session.user)
    }
  })
})
</script>

<style>
/* Custom Range Slider Styling */
.slider {
  -webkit-appearance: none;
  appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #facc15;
  cursor: pointer;
  border: 2px solid #000;
  box-shadow: 0 0 4px rgba(250, 204, 21, 0.8);
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #facc15;
  cursor: pointer;
  border: 2px solid #000;
  box-shadow: 0 0 4px rgba(250, 204, 21, 0.8);
}

.slider::-webkit-slider-thumb:hover {
  background: #fde047;
  box-shadow: 0 0 8px rgba(250, 204, 21, 1);
}

.slider::-moz-range-thumb:hover {
  background: #fde047;
  box-shadow: 0 0 8px rgba(250, 204, 21, 1);
}
</style>
