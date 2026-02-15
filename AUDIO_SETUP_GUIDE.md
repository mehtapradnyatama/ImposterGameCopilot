# 🎵 Audio Setup Guide

## 📁 File Structure
```
public/
└── assets/
    └── audio/
        ├── bgm/
        │   └── game-bgm.mp3      ← Background music
        └── sfx/
            ├── click.mp3          ← Button click
            ├── hover.mp3          ← Button hover
            ├── success.mp3        ← Success action
            ├── error.mp3          ← Error action
            ├── vote.mp3           ← Vote submitted
            ├── game-start.mp3     ← Game starts
            ├── game-over.mp3      ← Game ends
            └── timer-tick.mp3     ← Timer countdown
```

## 🎼 Download Audio Files

### Option 1: Free Resources (Recommended)
- **Mixkit:** https://mixkit.co/free-sound-effects/game/
- **Freesound:** https://freesound.org/ (need account)
- **Zapsplat:** https://www.zapsplat.com/sound-effect-categories/
- **Pixabay:** https://pixabaycom/music/search/8%20bit/

### Option 2: YouTube to MP3
1. Go to: https://ytmp3.nu/
2. Paste YouTube URL
3. Download MP3
4. Rename file (e.g., `game-bgm.mp3`)

### Recommended Search Terms:
- **BGM:** "8-bit game music", "arcade background music", "retro game soundtrack"
- **SFX:** "button click sound", "arcade sound effects", "8-bit sfx"

---

## 🔧 Implementation Examples

### 1. Basic Usage in Any Component
```vue
<script setup>
import { useAudio, sfx } from '@/composables/useAudio'

const { playBGM, pauseBGM, toggleBGM, isBgmPlaying } = useAudio()

// Start BGM when component loads
onMounted(() => {
  playBGM('game-bgm')
})
</script>

<template>
  <!-- BGM Toggle Button -->
  <button @click="toggleBGM">
    {{ isBgmPlaying ? '🔊 MUTE' : '🔇 UNMUTE' }}
  </button>
  
  <!-- Button with click sound -->
  <button @click="sfx.click()">
    CLICK ME
  </button>
  
  <!-- Button with hover sound -->
  <button @mouseenter="sfx.hover()">
    HOVER ME
  </button>
</template>
```

### 2. Example: Home.vue with BGM
```vue
<script setup>
import { onMounted } from 'vue'
import { useAudio, sfx } from '@/composables/useAudio'

const { playBGM, toggleBGM, isBgmPlaying } = useAudio()

onMounted(() => {
  // Auto-play BGM on home page (might need user interaction first)
  playBGM('game-bgm')
})

const handleCreateRoom = () => {
  sfx.click()
  router.push('/create')
}
</script>

<template>
  <div>
    <!-- BGM Toggle (top right corner) -->
    <button 
      @click="toggleBGM" 
      class="fixed top-4 right-4 bg-black border-4 border-yellow-400 px-4 py-2 text-yellow-400"
    >
      {{ isBgmPlaying ? '🔊' : '🔇' }}
    </button>
    
    <!-- Buttons with sound -->
    <button @click="handleCreateRoom">
      CREATE ROOM
    </button>
  </div>
</template>
```

### 3. Example: Game.vue with SFX
```vue
<script setup>
import { sfx } from '@/composables/useAudio'

const submitVote = async (userId) => {
  sfx.vote() // Play vote sound
  // ... voting logic
}

const startVoting = async () => {
  sfx.gameStart() // Play game start sound
  // ... start voting logic
}

onMounted(() => {
  if (room.value.status === 'FINISHED') {
    sfx.gameOver() // Play game over sound
  }
})
</script>
```

---

## 🎮 API Reference

### BGM Functions
```javascript
const { 
  playBGM,        // playBGM('track-name') - Start BGM
  pauseBGM,       // pauseBGM() - Pause BGM
  stopBGM,        // stopBGM() - Stop and reset BGM
  toggleBGM,      // toggleBGM() - Toggle play/pause
  setBGMVolume,   // setBGMVolume(0.5) - Set volume 0.0-1.0
  isBgmPlaying,   // ref(boolean) - BGM playing state
  bgmVolume       // ref(number) - Current volume
} = useAudio()
```

### SFX Functions
```javascript
import { sfx } from '@/composables/useAudio'

sfx.click()      // Button click
sfx.hover()      // Button hover
sfx.success()    // Success action
sfx.error()      // Error action
sfx.vote()       // Vote submitted
sfx.gameStart()  // Game starts
sfx.gameOver()   // Game ends
sfx.timer()      // Timer tick

// Or custom SFX:
const { playSFX } = useAudio()
playSFX('custom-sound', 0.7) // volume 0.0-1.0
```

---

## ⚠️ Important Notes

1. **Autoplay Policy:** Browsers block autoplay. BGM might need user interaction (click) first.
2. **File Size:** Keep MP3 files small (BGM: max 5MB, SFX: max 500KB each)
3. **Performance:** SFX are loaded on-demand, BGM is cached
4. **Loop:** BGM loops automatically, SFX play once

---

## 🚀 Quick Start

1. **Download 1 BGM file** → Save as `public/assets/audio/bgm/game-bgm.mp3`
2. **Download 2-3 SFX files** → Save as `click.mp3`, `success.mp3`, etc.
3. **Add to Home.vue:**
```vue
<script setup>
import { onMounted } from 'vue'
import { useAudio, sfx } from '@/composables/useAudio'

const { playBGM, toggleBGM, isBgmPlaying } = useAudio()

onMounted(() => {
  // Will play after user clicks something (browser policy)
  playBGM()
})
</script>

<template>
  <button @click="toggleBGM" class="fixed top-4 right-4">
    {{ isBgmPlaying ? '🔊' : '🔇' }}
  </button>
  
  <button @click="sfx.click(); /* your logic */">
    CREATE ROOM
  </button>
</template>
```

4. **Build and test!**

---

## 💡 Pro Tips

- Use **low volume** (0.2-0.4) for BGM so it doesn't overpower
- **SFX should be punchy** (< 1 second duration)
- **Fade in/out** for smoother experience (advanced)
- Add **localStorage** to remember user's volume preference

```javascript
// Example: Save volume preference
watch(bgmVolume, (newVolume) => {
  localStorage.setItem('bgm-volume', newVolume)
})

onMounted(() => {
  const savedVolume = localStorage.getItem('bgm-volume')
  if (savedVolume) setBGMVolume(parseFloat(savedVolume))
})
```
