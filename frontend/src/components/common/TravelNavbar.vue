<template>
  <nav class="fixed top-0 left-0 right-0 bg-[#F5F5F5] border-b-[2px] border-[#2C2C2C] z-50">
    <div class="max-w-[1600px] mx-auto px-8 py-5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-12">
          <h1
            class="text-6xl cursor-pointer hover:scale-105 transition-transform text-[#2C2C2C]"
            style="font-family: 'Bebas Neue', sans-serif; line-height: 0.8"
            @click="emit('navigate', 'main')"
          >
          TRIT<span class="text-[#9BCCC4]">.</span>
          </h1>

          <div class="flex items-center gap-2">
            <button
              v-for="menu in menus"
              :key="menu.id"
              @click="emit('navigate', menu.id as any)"
              :class="[
                'flex items-center gap-2 px-5 py-2.5 border-[2px] rounded-full text-sm tracking-tight transition-all uppercase focus:outline-none font-bold',
                currentPage === menu.id
                  ? 'bg-[#2C2C2C] text-white border-[#2C2C2C] shadow-[2px_2px_0px_0px_rgba(44,44,44,1)]'
                  : 'bg-white border-[#2C2C2C] hover:shadow-[2px_2px_0px_0px_rgba(44,44,44,0.8)] hover:translate-x-[-1px] hover:translate-y-[-1px]',
              ]"
            >
              <component :is="menu.icon" class="w-4 h-4" stroke-width="2.5" />
              <span>{{ menu.label }}</span>
            </button>
          </div>
        </div>

        <!-- Logged In State -->
        <div v-if="authStore.isLoggedIn" class="flex items-center gap-3">
          <router-link
            to="/friends"
            class="relative w-11 h-11 bg-white border-[2px] rounded-full border-[#2C2C2C] hover:shadow-[2px_2px_0px_0px_rgba(44,44,44,0.8)] hover:translate-x-[-1px] hover:translate-y-[-1px] flex items-center justify-center transition-all focus:outline-none"
          >
            <UserPlus class="w-5 h-5" stroke-width="2.5" />
          </router-link>

          <div class="relative" ref="notificationRef">
            <button
              @click="showNotifications = !showNotifications"
              class="relative w-11 h-11 bg-white border-[2px] rounded-full border-[#2C2C2C] hover:shadow-[2px_2px_0px_0px_rgba(44,44,44,0.8)] hover:translate-x-[-1px] hover:translate-y-[-1px] flex items-center justify-center transition-all focus:outline-none"
            >
              <Bell class="w-5 h-5" stroke-width="2.5" />
              <span
                v-if="notificationStore.unreadCount > 0"
                class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[#E88555] border-[2px] border-white rounded-full flex items-center justify-center text-[10px] font-black text-white"
              >
                {{ notificationStore.unreadCount > 9 ? '9+' : notificationStore.unreadCount }}
              </span>
            </button>

            <div
              v-if="showNotifications"
              class="absolute right-0 mt-4 w-96 bg-white border-[3px] border-[#2C2C2C] shadow-[6px_6px_0px_0px_rgba(44,44,44,0.15)] rounded-2xl overflow-hidden z-50"
            >
              <div class="p-5 border-b-[2px] border-[#2C2C2C] bg-[#FFF8ED] flex justify-between items-center">
                <h3
                  class="font-black text-lg uppercase"
                  style="font-family: 'Bebas Neue', sans-serif"
                >
                  Notifications
                </h3>
                <button 
                  v-if="notificationStore.unreadCount > 0"
                  @click="notificationStore.readAll"
                  class="text-xs font-bold text-gray-500 hover:text-[#2C2C2C]"
                >
                  전체 읽음
                </button>
              </div>
              <div class="max-h-96 overflow-y-auto">
                <div v-if="notificationStore.notifications.length === 0" class="p-10 text-center text-gray-400 font-bold">
                  알림이 없습니다.
                </div>
                <div
                  v-for="notif in notificationStore.notifications"
                  :key="notif.id"
                  @click="handleNotificationClick(notif)"
                  class="p-4 hover:bg-[#FFF8ED] cursor-pointer transition-colors border-b-[1px] border-gray-200 last:border-0 relative"
                  :class="{ 'bg-[#FFFDF9]': !notif.isRead }"
                >
                  <div class="flex gap-3">
                    <div
                      class="w-10 h-10 border-[2px] border-[#2C2C2C] rounded-lg overflow-hidden flex-shrink-0 bg-gray-100"
                    >
                      <img
                        :src="notif.senderProfileImageUrl || defaultProfileImage"
                        :alt="notif.senderNickname"
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <div class="flex-1">
                      <p
                        class="text-sm font-bold leading-relaxed"
                        v-html="highlightMessage(notif.message, notif.type)"
                      ></p>
                      <p class="text-xs font-bold text-gray-500 mt-1">{{ formatTime(notif.createdAt) }}</p>
                    </div>
                    <div v-if="!notif.isRead" class="w-2 h-2 bg-[#E88555] rounded-full mt-1"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="relative" ref="userMenuRef">
            <button
              @click="showUserMenu = !showUserMenu"
              class="w-11 h-11 bg-white border-[2px] rounded-full border-[#2C2C2C] hover:shadow-[2px_2px_0px_0px_rgba(44,44,44,0.8)] hover:translate-x-[-1px] hover:translate-y-[-1px] flex items-center justify-center transition-all overflow-hidden p-0 focus:outline-none"
            >
              <img
                :src="userProfileImage"
                :alt="authStore.user?.nickname || 'User profile'"
                class="w-full h-full object-cover"
              />
            </button>

            <div
              v-if="showUserMenu"
              class="absolute right-0 mt-4 w-72 bg-white border-[3px] border-[#2C2C2C] shadow-[6px_6px_0px_0px_rgba(44,44,44,0.15)] rounded-2xl overflow-hidden z-50"
            >
              <div class="p-5 border-b-[2px] border-[#2C2C2C] bg-[#FFF8ED]">
                <div class="flex items-center gap-3 mb-2">
                  <div class="w-12 h-12 border-[2px] border-[#2C2C2C] rounded-lg overflow-hidden">
                    <img
                      :src="userProfileImage"
                      :alt="authStore.user?.nickname || 'User profile'"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p class="font-black text-base">{{ authStore.user?.nickname || '여행자님' }}</p>
                    <p class="text-xs font-bold text-gray-600">@{{ authStore.user?.email || 'traveler' }}</p>
                  </div>
                </div>
              </div>
              <div class="p-2">
                <router-link
                  to="/settings"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#FFF8ED] transition-colors text-left border-[2px] border-transparent hover:border-[#2C2C2C] font-bold"
                >
                  <Settings class="w-5 h-5" stroke-width="2" />
                  <span class="text-sm">설정</span>
                </router-link>
              </div>
              <div class="p-2 border-t-[2px] border-gray-200">
                <button
                  @click="handleLogout"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors text-left border-[2px] border-transparent hover:border-red-300 font-bold"
                >
                  <LogOut class="w-5 h-5 text-red-600" stroke-width="2" />
                  <span class="text-sm text-red-600">로그아웃</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else>
            <router-link to="/" class="flex items-center gap-2 px-5 py-2 ...">
                로그인
            </router-link>
        </div>
      </div>
    </div>
  </nav>

  <DiaryCommentModal
    v-if="showLogModal && selectedLogId"
    :log-id="selectedLogId"
    @close="handleLogClose"
  />
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { Home, Search, Map, Bell, Settings, LogOut, BookOpen, UserPlus } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import DiaryCommentModal from '@/components/modal/DiaryCommentModal.vue'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const router = useRouter()
const defaultProfileImage = '/default-profile.svg'
const userProfileImage = computed(
  () => authStore.user?.profileImageUrl || defaultProfileImage,
)

defineProps<{
  currentPage: 'main' | 'search' | 'trips' | 'log' | 'friends'
}>()

const emit = defineEmits<{
  (e: 'navigate', page: 'main' | 'search' | 'trips' | 'log' | 'friends'): void
}>()

const menus = [
  { id: 'main', label: 'Home', icon: Home },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'trips', label: 'Trips', icon: Map },
  { id: 'log', label: 'Log', icon: BookOpen },
]

const showUserMenu = ref(false)
const showNotifications = ref(false)
const userMenuRef = ref<HTMLDivElement | null>(null)
const notificationRef = ref<HTMLDivElement | null>(null)

// Modal State
const showLogModal = ref(false)
const selectedLogId = ref<number | null>(null)

const handleClickOutside = (event: MouseEvent) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
    showUserMenu.value = false
  }
  if (notificationRef.value && !notificationRef.value.contains(event.target as Node)) {
    showNotifications.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})

const handleLogout = async () => {
  await authStore.logout()
  showUserMenu.value = false
  router.push('/')
}

const handleNotificationClick = async (notif: any) => {
  if (!notif.isRead) {
    await notificationStore.readNotification(notif.id)
  }
  
  // 친구 관련 알림은 친구 페이지로 이동
  if (notif.type === 'FRIEND_REQUEST' || notif.type === 'FRIEND_ACCEPT') {
    if (notif.targetUrl) {
      router.push(notif.targetUrl)
    }
  } 
  // 로그 관련 알림(좋아요, 댓글, 스크랩)은 모달 띄우기
  else if (['LIKE', 'COMMENT', 'SCRAP'].includes(notif.type)) {
      selectedLogId.value = notif.targetId
      showLogModal.value = true
  }
  // 그 외(혹시 모를 경우)는 targetUrl로 이동 시도
  else if (notif.targetUrl) {
      router.push(notif.targetUrl)
  }

  showNotifications.value = false
}

const handleLogClose = () => {
    showLogModal.value = false
    selectedLogId.value = null
}

const formatTime = (dateString: string) => {
  const dateToParse = dateString.endsWith('Z') || dateString.includes('+') ? dateString : dateString + 'Z'
  return formatDistanceToNow(new Date(dateToParse), { addSuffix: true, locale: ko })
}

const highlightMessage = (message: string, type: string) => {
  let highlighted = message
  // 강조 로직: 닉네임(문장 시작)은 검은색 굵게
  highlighted = highlighted.replace(/^([^ ]+)/, '<span class="font-black">$1</span>')
  
  if (type === 'FRIEND_REQUEST' || type === 'FRIEND_ACCEPT') {
    highlighted = highlighted.replace(
      /(친구 요청|친구 신청)/,
      '<span class="font-black text-[#5AB5A8]">$1</span>',
    )
  } else if (type === 'LIKE') {
    highlighted = highlighted.replace(
      '좋아요',
      '<span class="font-black text-[#FF6B9D]">좋아요</span>',
    )
  } else if (type === 'COMMENT') {
    highlighted = highlighted.replace(
      '댓글', 
      '<span class="font-black text-[#6B8FD4]">댓글</span>'
    )
  } else if (type === 'SCRAP') {
    highlighted = highlighted.replace(
      '스크랩', 
      '<span class="font-black text-[#D4A520]">스크랩</span>'
    )
  }
  return highlighted
}
</script>
<style>
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
</style>
