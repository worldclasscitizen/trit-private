<template>
  <div class="min-h-screen bg-white font-sans">
    <TravelNavbar @navigate="handleNavigate" />

    <div class="pt-32 max-w-3xl mx-auto px-6 pb-40">
      <div v-if="isLoading" class="flex justify-center items-center h-[40vh]">
         <div class="w-12 h-12 border-[4px] border-[#2C2C2C] border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else-if="error" class="flex flex-col items-center justify-center h-[50vh] text-center">
        <p class="text-xl font-black text-red-500 mb-4">{{ error }}</p>
        <button
          @click="router.back()"
          class="px-6 py-2 bg-[#2C2C2C] text-white rounded-lg font-bold hover:bg-black transition-colors"
        >
          돌아가기
        </button>
      </div>

      <div v-else-if="tripLog && tripDetail">
        <!-- Blog Header (Refined) -->
        <header class="mb-10 text-center">
             <!-- Row 1: Title -->
            <h1 class="text-3xl md:text-4xl font-black text-[#2C2C2C] mb-6 leading-tight break-keep">
                {{ tripLog.title }}
            </h1>
            
            <!-- Row 2: Meta (Author, Date, Location) + Share -->
            <div class="flex items-center justify-between border-b border-gray-200 pb-6">
                 <div class="flex items-center gap-3">
                    <div 
                        class="w-10 h-10 border-[2px] border-[#2C2C2C] rounded-full overflow-hidden shadow-[2px_2px_0px_0px_rgba(44,44,44,0.1)] cursor-pointer hover:opacity-80"
                        @click="navigateToUserLog(tripLog!.authorId)"
                    >
                        <img :src="tripLog.authorImageUrl" :alt="tripLog.authorNickname" class="w-full h-full object-cover" />
                    </div>
                    <div class="text-left">
                         <div class="flex items-center gap-2">
                             <span 
                                class="font-black text-sm text-[#2C2C2C] cursor-pointer hover:underline"
                                @click="navigateToUserLog(tripLog!.authorId)"
                             >
                                {{ tripLog.authorNickname }}
                             </span>
                         </div>
                         <div class="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
                            <span>{{ formattedDate }}</span>
                            <span v-if="tripLog.locationSummary">•</span>
                            <span v-if="tripLog.locationSummary">{{ tripLog.locationSummary }}</span>
                        </div>
                    </div>
                 </div>

                 <!-- Share Button -->
                 <button @click="handleShare" class="p-2 hover:bg-gray-100 rounded-lg transition-colors group" title="공유하기">
                    <Share2 class="w-5 h-5 text-gray-400 group-hover:text-[#2C2C2C]" />
                 </button>
            </div>
        </header>

        <!-- Main Content -->
        <div class="min-h-[200px] mb-16">
          <TripLogContent
            :log-detail="tripLog"
            :trip-detail="tripDetail"
            :initial-liked="isLiked"
            :show-header="false"
            :hide-title="true"
            :hide-comments="true"
            layout="vertical"
            class="!h-auto !bg-transparent"
             @place-click="(id) => {}"
             @update-like="handleUpdateLikeFromContent"
          />
        </div>

        <!-- Static Comments Section -->
        <div ref="commentSection" class="border-t border-gray-200 pt-10">
            <div class="flex items-center gap-4 mb-8">
                 <button
                 @click="handleLike"
                 :class="[
                    'flex items-center gap-2 px-4 py-2 border-[2px] border-[#2C2C2C] rounded-full font-black text-sm transition-all',
                    isLiked
                     ? 'bg-[#FF6B9D] text-white shadow-[2px_2px_0px_0px_rgba(44,44,44,0.1)]'
                     : 'bg-white hover:bg-gray-50 hover:shadow-[2px_2px_0px_0px_rgba(44,44,44,0.1)]'
                 ]"
               >
                 <Heart :class="['w-4 h-4', isLiked ? 'fill-current' : '']" stroke-width="2.5" />
                 <span>{{ currentLikes }}</span>
               </button>


               
               <button 
                  @click="handleShare"
                  class="flex items-center gap-2 px-4 py-2 border-[2px] border-[#2C2C2C] rounded-full font-black text-sm bg-white hover:bg-gray-50 hover:shadow-[2px_2px_0px_0px_rgba(44,44,44,0.1)] transition-all"
               >
                  <Share2 class="w-4 h-5 text-[#2C2C2C]" stroke-width="2.5" />
               </button>
            </div>
            
            <h3 class="font-black text-xl text-[#2C2C2C] mb-6">댓글 <span class="text-[#FF6B9D]">{{ tripLog?.comments?.length || 0 }}</span></h3>
            
            <TripLogComments 
                :comments="tripLog.comments"
                :current-user-nickname="authStore.user?.nickname"
                :current-user-profile-image="authStore.user?.profileImageUrl"
                :is-logged-in="authStore.isLoggedIn"
                @post-comment="handlePostComment"
                @update-comment="handleUpdateComment"
                @delete-comment="handleDeleteComment"
                @login-required="isLoginAlertVisible = true"
                @navigate-user="navigateToUserLog"
                ref="tripLogCommentsRef"
                class="!h-[400px]"
            />
        </div>
      </div>
    </div>
    
    <!-- Floating Bottom Bar -->
    <Transition name="slide-up">
        <div 
            v-if="isFloatingBarVisible && tripLog" 
            class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-6 z-40 flex items-center justify-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
        >
             <div class="max-w-3xl w-full flex items-center justify-between">
                  <div class="flex items-center gap-3">
                       <button
                         @click="handleLike"
                         :class="[
                            'flex items-center gap-2 px-4 py-2 border-[2px] border-[#2C2C2C] rounded-full font-black text-sm transition-all',
                            isLiked
                             ? 'bg-[#FF6B9D] text-white shadow-[2px_2px_0px_0px_rgba(44,44,44,0.1)]'
                             : 'bg-white hover:bg-gray-50 hover:shadow-[2px_2px_0px_0px_rgba(44,44,44,0.1)]'
                         ]"
                       >
                         <Heart :class="['w-4 h-4', isLiked ? 'fill-current' : '']" stroke-width="2.5" />
                         <span>{{ currentLikes }}</span>
                       </button>

                       <button
                         @click="scrollToComments"
                         class="flex items-center gap-2 px-4 py-2 border-[2px] border-[#2C2C2C] bg-white rounded-full font-black text-sm text-[#2C2C2C] hover:bg-gray-50 hover:shadow-[2px_2px_0px_0px_rgba(44,44,44,0.1)] transition-all"
                       >
                         <MessageCircle class="w-4 h-4" stroke-width="2.5" />
                         <span>댓글 {{ tripLog.commentCount }}</span>
                       </button>
                  </div>
             </div>
        </div>
    </Transition>

    <!-- Modals -->
    <AlertDialog
      :is-open="isLoginAlertVisible"
      title="로그인 필요"
      message="로그인이 필요한 서비스입니다.\n로그인 페이지로 이동하시겠습니까?"
      confirm-text="로그인"
      cancel-text="취소"
      @confirm="handleLoginConfirm"
      @cancel="isLoginAlertVisible = false"
      @close="isLoginAlertVisible = false"
    />

     <Transition
      enter-active-class="transition-all duration-300 ease-out"
      leave-active-class="transition-all duration-200 ease-in"
      enter-from-class="opacity-0 translate-y-[-20px]"
      enter-to-class="opacity-100 translate-y-0"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-[-20px]"
    >
      <div
        v-if="showToast"
        class="fixed top-24 right-6 z-[80] bg-white border-[3px] border-[#2C2C2C] rounded-xl shadow-[4px_4px_0px_0px_rgba(44,44,44,0.3)] px-5 py-3 flex items-center gap-3"
      >
         <div class="w-6 h-6 bg-[#FFD60A] border-[2px] border-[#2C2C2C] rounded-full flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="#2C2C2C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
         <span class="font-black text-sm text-[#2C2C2C]">링크가 복사되었습니다!</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TravelNavbar from '@/components/common/TravelNavbar.vue'
import TripLogContent from '@/components/trip-log/TripLogContent.vue'
import TripLogComments from '@/components/trip-log/TripLogComments.vue'
import AlertDialog from '@/components/common/AlertDialog.vue'
import { useNavigate } from '@/composables/common/useNavagation'
import { getTripLogDetail, getTripLogLikeStatus, likeTripLog, unlikeTripLog, postTripLogComment, updateTripLogComment, deleteTripLogComment } from '@/apis/trip-log/index'
import { getTripDetail } from '@/apis/trip/index'
import { Share2, Heart, MessageCircle } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import type { TripLogDetail } from '@/types/trip/trip.model'
import type { TripDetailResponseDto } from '@/apis/trip/types'
import { format, parseISO } from 'date-fns'

const route = useRoute()
const router = useRouter()
const { handleNavigate } = useNavigate()
const authStore = useAuthStore()

const logId = Number(route.params.logId)
const isLoading = ref(true)
const error = ref<string | null>(null)
const tripLog = ref<TripLogDetail | null>(null)
const tripDetail = ref<TripDetailResponseDto | null>(null)
const isLiked = ref(false)
const currentLikes = ref(0)
const isLoginAlertVisible = ref(false)
const showToast = ref(false)
const commentSection = ref<HTMLElement | null>(null)
const tripLogCommentsRef = ref<any>(null)

// UI States
const isScrolledPastHeader = ref(false)
const isCommentSectionVisible = ref(false)

const isFloatingBarVisible = computed(() => {
    return isScrolledPastHeader.value && !isCommentSectionVisible.value
})

const fetchData = async () => {
    isLoading.value = true
    error.value = null
    try {
        const [logRes, likeRes] = await Promise.all([
            getTripLogDetail(logId),
            authStore.user ? getTripLogLikeStatus(logId) : Promise.resolve({ liked: false })
        ])
        
        tripLog.value = {
            ...logRes,
            logId: logId, 
             authorId: logRes.authorId || 0
        }
        isLiked.value = likeRes.liked
        currentLikes.value = logRes.likeCount

        if (logRes.tripId) {
            tripDetail.value = await getTripDetail(logRes.tripId)
        }
    } catch (e: any) {
        console.error('Fetch Log Detail Error:', e)
         if (e?.response?.status === 404) {
             error.value = '존재하지 않는 게시글입니다.'
         } else if (e?.response?.status === 403) {
             error.value = '접근 권한이 없는 게시글입니다.'
         } else {
             error.value = '데이터를 불러오는데 실패했습니다.'
         }
    } finally {
        isLoading.value = false
    }
}

const formattedDate = computed(() => {
  if (!tripLog.value?.createdAt) return ''
  return format(parseISO(tripLog.value.createdAt), 'yyyy.MM.dd')
})

// Scroll Handler
const handleScroll = () => {
    const scrollY = window.scrollY
    if (scrollY > 200) {
        isScrolledPastHeader.value = true
    } else {
        isScrolledPastHeader.value = false
    }
}

let observer: IntersectionObserver | null = null

const setupIntersectionObserver = () => {
    if (!commentSection.value) return

    observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            isCommentSectionVisible.value = entry.isIntersecting
        })
    }, {
        root: null, // viewport
        threshold: 0.1 // Trigger when 10% of comment section is visible
    })
    
    observer.observe(commentSection.value)
}

const scrollToComments = () => {
    if (commentSection.value) {
        commentSection.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
        // Optionally focus input if available
        nextTick(() => {
            if(tripLogCommentsRef.value) {
                tripLogCommentsRef.value.focusInput()
            }
        })
    }
}

const handleLike = async () => {
  if (!authStore.isLoggedIn) {
     isLoginAlertVisible.value = true
    return
  }
  if (!tripLog.value) return

  try {
    let response
    if (isLiked.value) {
      response = await unlikeTripLog(tripLog.value.logId)
    } else {
      response = await likeTripLog(tripLog.value.logId)
    }
    isLiked.value = response.liked
    currentLikes.value = response.likeCount
    
    // Sync local object
    tripLog.value.likeCount = response.likeCount
  } catch (e) {
    console.error('Failed to toggle like status:', e)
    // Show error toast?
  }
}

// Logic to handle updates from TripLogContent (if any, though we hid comments)
const handleUpdateLikeFromContent = (payload: { likeCount: number; liked: boolean }) => {
    isLiked.value = payload.liked
    currentLikes.value = payload.likeCount
}


// Comment Handlers (Proxied to API)
const handlePostComment = async (content: string) => {
    if (!tripLog.value) return
    try {
        await postTripLogComment(tripLog.value.logId, { content })
        // Refresh
        const logRes = await getTripLogDetail(logId)
        tripLog.value = { ...logRes, logId, authorId: logRes.authorId || 0 }
    } catch(e) { console.error(e) }
}

const handleUpdateComment = async (id: number, content: string) => {
    try {
        await updateTripLogComment(id, { content })
         // Refresh
        const logRes = await getTripLogDetail(logId)
        // @ts-ignore
        tripLog.value = { ...logRes, logId, authorId: logRes.authorId || 0 }
    } catch(e) { console.error(e) }
}

const handleDeleteComment = async (id: number) => {
    try {
        await deleteTripLogComment(id)
         // Refresh
        const logRes = await getTripLogDetail(logId)
        // @ts-ignore
        tripLog.value = { ...logRes, logId, authorId: logRes.authorId || 0 }
    } catch(e) { console.error(e) }
}


const navigateToUserLog = (userId: number) => {
    router.push({ name: 'user-log', params: { userId } })
}

const handleLoginConfirm = () => {
  isLoginAlertVisible.value = false
  router.push({ name: 'login' })
}



const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
        showToast.value = true
        setTimeout(() => showToast.value = false, 2000)
    })
}

onMounted(() => {
    fetchData().then(() => {
        // Wait for DOM
        nextTick(() => {
            setupIntersectionObserver()
        })
    })
    window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
    if (observer) observer.disconnect()
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
