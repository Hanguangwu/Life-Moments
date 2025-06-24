import { createRouter, createWebHistory } from 'vue-router'
import MomentList from '../views/MomentList.vue'
import Settings from '../views/Settings.vue'
import Auth from '../views/Auth.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/auth',
      name: 'auth',
      component: Auth,
      meta: { requiresGuest: true }
    },
    {
      path: '/',
      name: 'home',
      component: MomentList,
      meta: { requiresAuth: true }
    },
    {
      path: '/moments',
      name: 'moments',
      component: MomentList,
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: Settings,
      meta: { requiresAuth: true }
    }
  ]
})

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  
  // 等待认证状态初始化
  if (!authStore.initialized) {
    await authStore.initialize()
  }
  
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest)
  
  if (requiresAuth && !authStore.isAuthenticated) {
    // 需要认证但未登录，跳转到登录页
    next('/auth')
  } else if (requiresGuest && authStore.isAuthenticated) {
    // 已登录用户访问登录页，跳转到首页
    next('/')
  } else {
    next()
  }
})

export default router