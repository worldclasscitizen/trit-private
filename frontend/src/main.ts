import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css';

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.component('QuillEditor', QuillEditor)

const authStore = useAuthStore()

await authStore.initializeAuth()

router.beforeEach((to, from, next) => {
  // 1. 인증 상태 초기화 대기
  if (!authStore.isInitialized) {
    return next(false)
  }

  const protectedRoutes = ['trips', 'trip-detail', 'create-trip', 'log', 'settings', 'log-write', 'friends', 'log-edit']
  const publicOnlyRoutes = ['login', 'signup', 'find-account']

  const isProtected = protectedRoutes.includes(to.name as string)

  // 2. 보호된 경로에 미로그인으로 접근 시
  if (isProtected && !authStore.isLoggedIn) {
    alert("로그인 후 이용해주세요.")
    return next({ name: 'login' })
  }

  // 3. 공개 전용 경로에 로그인 상태로 접근 시 (요청하신 경우)
  if (publicOnlyRoutes.includes(to.name as string) && authStore.isLoggedIn) {
    return next({ name: 'home' })
  }

  // 4. 모든 조건 통과 시
  next()
})

app.mount('#app')
