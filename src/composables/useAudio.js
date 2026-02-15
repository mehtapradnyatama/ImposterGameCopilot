import { ref, onMounted, onUnmounted } from 'vue'

// Audio manager singleton
let bgmInstance = null
let sfxInstances = {}

// BGM controls
const isBgmPlaying = ref(false)
const bgmVolume = ref(0.3) // 30% volume default

export function useAudio() {
  
  // === BACKGROUND MUSIC ===
  const playBGM = (trackName = 'game-bgm') => {
    try {
      if (!bgmInstance) {
        bgmInstance = new Audio(`/assets/audio/bgm/${trackName}.mp3`)
        bgmInstance.loop = true
        bgmInstance.volume = bgmVolume.value
      }
      
      bgmInstance.play()
      isBgmPlaying.value = true
      
      console.log('🎵 BGM started:', trackName)
    } catch (error) {
      console.error('Error playing BGM:', error)
    }
  }
  
  const pauseBGM = () => {
    if (bgmInstance) {
      bgmInstance.pause()
      isBgmPlaying.value = false
      console.log('⏸️ BGM paused')
    }
  }
  
  const stopBGM = () => {
    if (bgmInstance) {
      bgmInstance.pause()
      bgmInstance.currentTime = 0
      isBgmPlaying.value = false
      console.log('⏹️ BGM stopped')
    }
  }
  
  const toggleBGM = () => {
    if (isBgmPlaying.value) {
      pauseBGM()
    } else {
      playBGM()
    }
  }
  
  const setBGMVolume = (volume) => {
    // volume: 0.0 to 1.0
    bgmVolume.value = Math.max(0, Math.min(1, volume))
    if (bgmInstance) {
      bgmInstance.volume = bgmVolume.value
    }
  }
  
  // === SOUND EFFECTS ===
  const playSFX = (effectName, volume = 0.5) => {
    try {
      const sfx = new Audio(`/assets/audio/sfx/${effectName}.mp3`)
      sfx.volume = volume
      sfx.play()
      
      // Clean up after playing
      sfx.addEventListener('ended', () => {
        sfx.remove()
      })
      
      console.log('🔊 SFX played:', effectName)
    } catch (error) {
      console.error('Error playing SFX:', error)
    }
  }
  
  // Cleanup on unmount
  onUnmounted(() => {
    // Don't stop BGM on component unmount (let it play across pages)
    // Only stop when explicitly called
  })
  
  return {
    // BGM
    playBGM,
    pauseBGM,
    stopBGM,
    toggleBGM,
    setBGMVolume,
    isBgmPlaying,
    bgmVolume,
    
    // SFX
    playSFX
  }
}

// Convenience functions for common SFX
export const sfx = {
  click: () => useAudio().playSFX('click', 0.3),
  hover: () => useAudio().playSFX('hover', 0.2),
  success: () => useAudio().playSFX('success', 0.5),
  error: () => useAudio().playSFX('error', 0.5),
  vote: () => useAudio().playSFX('vote', 0.4),
  gameStart: () => useAudio().playSFX('game-start', 0.6),
  gameOver: () => useAudio().playSFX('game-over', 0.6),
  timer: () => useAudio().playSFX('timer-tick', 0.3),
}
