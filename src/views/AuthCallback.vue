<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
      <p class="mt-4 text-xl">Signing you in...</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const router = useRouter()

onMounted(async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user) {
      // Create or update user profile
      const { error: upsertError } = await supabase.from('users').upsert({
        id: session.user.id,
        email: session.user.email,
        full_name: session.user.user_metadata.full_name,
        avatar_url: session.user.user_metadata.avatar_url,
        total_score: 0,
        games_played: 0,
        games_won: 0
      }, {
        onConflict: 'id'
      })
      
      if (upsertError) {
        console.error('Error creating user profile:', upsertError)
        alert('Error creating profile: ' + upsertError.message)
      }
      
      // Wait a bit to ensure database write is complete
      await new Promise(resolve => setTimeout(resolve, 500))
      
      router.push('/')
    } else {
      router.push('/')
    }
  } catch (error) {
    console.error('Auth callback error:', error)
    router.push('/')
  }
})
</script>
