import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/lib/supabase'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: () => import('@/views/AuthCallback.vue')
  },
  {
    path: '/create-room',
    name: 'CreateRoom',
    component: () => import('@/views/CreateRoom.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/join-room',
    name: 'JoinRoom',
    component: () => import('@/views/JoinRoom.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/lobby/:code',
    name: 'Lobby',
    component: () => import('@/views/Lobby.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/game/:code',
    name: 'Game',
    component: () => import('@/views/Game.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/leaderboard',
    name: 'Leaderboard',
    component: () => import('@/views/Leaderboard.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Auth guard
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
  if (requiresAuth) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      next('/')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
