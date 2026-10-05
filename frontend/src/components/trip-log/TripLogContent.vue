<template>
  <div :class="['flex h-full bg-white', layout === 'horizontal' ? 'flex-row' : 'flex-col']">
    <!-- Main Content Section (Left in Horizontal) -->
    <div :class="[
      layout === 'horizontal' 
        ? 'flex-1 h-full overflow-y-auto no-scrollbar relative' 
        : 'w-full flex-shrink-0'
    ]">
      <!-- Header -->
      <div
        v-if="showHeader"
        class="p-5 flex items-center justify-between bg-gradient-to-br from-[#FFD60A]/10 to-white"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 border-[2px] border-[#2C2C2C] rounded-full overflow-hidden shadow-[2px_2px_0px_0px_rgba(44,44,44,0.1)]"
          >
            <img :src="logDetail.authorImageUrl" :alt="logDetail.authorNickname" class="w-full h-full object-cover" />
          </div>
          <div>
            <h4 class="font-black text-[#2C2C2C] font-sans">{{ logDetail.authorNickname }}</h4>
            <div class="flex items-center gap-2 text-xs font-bold text-gray-600">
              <MapPin class="w-3 h-3" stroke-width="2.5" />
              <span>{{ logDetail.locationSummary }}</span>
              <span>•</span>
              <Calendar class="w-3 h-3" stroke-width="2.5" />
              <span>{{ formattedDate }}</span>
            </div>
          </div>
        </div>
        <div class="relative" ref="dropdownContainer">
          <button
            @click="showDropdown = !showDropdown"
            class="p-2 hover:bg-gray-100 rounded transition-all"
          >
            <MoreHorizontal class="w-6 h-6 text-[#2C2C2C]" stroke-width="2.5" />
          </button>

          <div
            v-if="showDropdown"
            class="absolute right-0 top-full mt-2 w-40 bg-white border-[2px] border-[#2C2C2C] rounded-lg shadow-[4px_4px_0px_0px_rgba(44,44,44,0.2)] overflow-hidden z-20"
          >
            <button
              @click="handleShare"
              class="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-gray-50 transition-colors text-left"
            >
              <Share class="w-4 h-4 text-[#2C2C2C]" stroke-width="2.5" />
              <span class="font-bold text-sm text-[#2C2C2C]">공유</span>
            </button>

            <template v-if="isAuthor">
              <button
                @click="handleEdit"
                class="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-gray-50 transition-colors text-left border-t border-gray-200"
              >
                <Edit class="w-4 h-4 text-[#2C2C2C]" stroke-width="2.5" />
                <span class="font-bold text-sm text-[#2C2C2C]">수정</span>
              </button>

              <button
                @click="handleDelete"
                class="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-red-50 transition-colors text-left border-t border-gray-200"
              >
                <Trash2 class="w-4 h-4 text-red-500" stroke-width="2.5" />
                <span class="font-bold text-sm text-red-500">삭제</span>
              </button>
            </template>
          </div>
        </div>
      </div>

      <!-- Content Body -->
      <div class="p-5 border-b border-gray-200">
        <h3 v-if="!hideTitle" class="font-black text-lg mb-2 text-[#2C2C2C] font-sans">{{ logDetail.title }}</h3>

        <div v-if="groupedCourse.length > 0" class="mb-4">
          <!-- Tabs -->
          <div class="flex items-center border-b-2 border-gray-200">
            <button
              v-for="day in groupedCourse"
              :key="day.dayNumber"
              @click.stop="activeDay = day.dayNumber"
              :class="[
                'px-3 py-1 font-bold text-xs transition-all',
                activeDay === day.dayNumber
                  ? 'text-[#2C2C2C] border-b-2 border-[#2C2C2C]'
                  : 'text-gray-500 hover:text-gray-800',
              ]"
            >
              DAY {{ day.dayNumber }}
            </button>
          </div>

          <!-- Course Content -->
          <div class="pt-3">
            <div v-for="day in groupedCourse" :key="day.dayNumber">
              <Transition name="no-animation">
                <div v-show="activeDay === day.dayNumber">
                  <div class="flex items-center flex-wrap gap-x-1.5 gap-y-2">
                    <div
                      v-for="(place, index) in day.places"
                      :key="index"
                      class="flex items-center gap-1.5"
                    >
                      <div
                        @click.stop="emit('place-click', place.id)"
                        class="flex items-center gap-1 px-2.5 py-1 border-[2px] border-[#2C2C2C] rounded-full bg-white shadow-[1px_1px_0px_0px_rgba(44,44,44,0.1)] course-badge cursor-pointer"
                        :style="{ '--hover-color': getBadgeColor(index) }"
                      >
                        <span class="text-xs font-black text-[#2C2C2C]">{{ index + 1 }}</span>
                        <span class="text-xs font-black text-[#2C2C2C] whitespace-nowrap">{{
                          place.name
                        }}</span>
                      </div>
                      <ChevronRight
                        v-if="index < day.places.length - 1"
                        class="w-3 h-3 text-gray-400 flex-shrink-0"
                      />
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>

        <div class="prose max-w-none text-sm font-medium text-gray-800 leading-relaxed break-words" v-html="formattedContent"></div>
      </div>
    </div>

    <!-- Comments & Footer Section (Right in Horizontal) -->
    <div 
      v-if="!hideComments"
      :class="[
      layout === 'horizontal' 
        ? 'w-[35%] h-full flex flex-col border-l border-gray-200' 
        : 'flex-1 flex flex-col min-h-0'
     ]"
    >
      <TripLogComments 
        :comments="logDetail.comments"
        :current-user-nickname="authStore.user?.nickname"
        :current-user-profile-image="authStore.user?.profileImageUrl"
        :is-logged-in="authStore.isLoggedIn"
        @post-comment="handlePostComment"
        @update-comment="handleUpdateComment"
        @delete-comment="handleDeleteComment"
        @login-required="emit('login-required')"
        @navigate-user="navigateToUserLog"
        :layout="layout"
        class="flex-1 min-h-0"
      >
        <template #footer-actions>
           <div class="p-4 py-3 flex items-center gap-2">
              <!-- Like Button -->
              <button 
                @click="handleLike" 
                :class="[
                  'flex items-center gap-1.5 px-3 py-1.5 border-[2px] border-[#2C2C2C] rounded-full transition-all group',
                  isLiked ? 'bg-[#FF6B9D] text-white shadow-[2px_2px_0px_0px_rgba(44,44,44,0.1)]' : 'bg-white hover:bg-gray-50 hover:shadow-[2px_2px_0px_0px_rgba(44,44,44,0.1)]'
                ]"
              >
                <Heart 
                  :class="['w-4 h-4 transition-all', isLiked ? 'fill-white text-white' : 'text-[#2C2C2C]']" 
                  stroke-width="2.5" 
                />
                <span 
                  class="text-xs font-black"
                  :class="isLiked ? 'text-white' : 'text-[#2C2C2C]'"
                >
                  {{ currentLikes }}
                </span>
              </button>
              


               <!-- Share Button -->
               <button 
                @click="handleShare" 
                class="flex items-center justify-center p-1.5 border-[2px] border-[#2C2C2C] rounded-full bg-white hover:bg-gray-50 hover:shadow-[2px_2px_0px_0px_rgba(44,44,44,0.1)] transition-all group"
              >
                 <Share2 class="w-4 h-4 text-[#2C2C2C]" stroke-width="2.5" />
               </button>
           </div>
        </template>
      </TripLogComments>

       <!-- Footer Actions (Like, Scrap, Share) - Re-added here if TripLogComments is primarily for list+input but Like is distinct -->
       <!-- Wait, I moved Like/Scrap into Footer in previous version.
            TripLogComments handles comments list and input.
            But Like/Scrap logic was separate.
            If I want to reuse TripLogComments purely for comments, I should keep Like/Scrap here OR move them to TripLogComments.
            The user request said "좋아요 댓글 버튼은 처음엔 안 보였다가...". This implies View mode manages Like button visibility.
            BUT Modal mode needs Like button visible as footer.
            
            If I put Like button in TripLogComments, it will show in Drawer (as Header or Footer?).
            TripLogComments design just has list and input.
            
            In MODAL mode: We want Like button fixed at bottom or top of footer?
            The previous code had Like/Scrap/Share in a Footer div ABOVE the Input form.
            TripLogComments has Input form at bottom.
            I should probably inject the Like/Scrap buttons via slot or keep them outside TripLogComments if layouts differ significantly.
            
            However, for the Modal, the layout is:
            [Comments List]
            [Like/Scrap Row]
            [Input Form]
            
            TripLogComments currently implements:
            [Comments List]
            [Input Form] -- Wait, I missed the Like/Scrap row in TripLogComments in step 997.
            
            Let's re-read TripLogComments created in 997.
            It has:
            1. Comments List
            2. Input Section
            
            It MISSES the Like/Scrap/Share row that was present in `TripLogContent`.
            
            So, `TripLogContent` (in Modal) needs to render Like/Scrap/Share row.
            Where? Between List and Input?
            `TripLogComments` doesn't support slot between List and Input easily unless I modify it.
            
            Alternatively, I can pass `showFooterActions` prop to `TripLogComments` and implement them there.
            But `TripLogComments` is reused in Drawer where we might NOT want Like button inside the drawer (since floating bar has it).
            
            Actually, the Drawer is for "Seeing comments". It probably should just be comments.
            The Like button is on the Floating Bar.
            So `TripLogComments` handles List + Input is correct for Drawer.
            
            For Modal (TripLogContent):
            It needs Like/Scrap buttons.
            I can put them *above* `TripLogComments`? No, they were *below* list, above input.
            
            I will modify `TripLogComments` to check if I can insert them.
            OR I can leave `TripLogComments` as is, and `TripLogContent` renders:
            [Comments List (via TripLogComments - List Only?)]
            
            Refactoring strategy adjust:
            `TripLogContent` needs to maintain Modal appearance.
            Modal appearance: List -> Like Row -> Input.
            
            If I delegate everything to `TripLogComments`, it forces Drawer to have same layout?
            Drawer usually: List -> Input. (Like is outside).
            So `TripLogComments` matches Drawer.
            
            For Modal:
            We want Like Row.
            I can add a Slot to `TripLogComments` named `actions` just before the Input form.
            Then `TripLogContent` provides the Like/Scrap buttons into that slot.
            
            Let's do that. I'll utilize `TripLogComments` with a slot.
            Wait, I already wrote `TripLogComments` in step 997 without slot.
            I should update `TripLogComments` to add `<slot name="actions" />` before `<form>`.
            
      -->
    </div>
    
     <!-- If hideComments is true (Full Page View), we might still want the Like/Scrap buttons NOT to be here because they are in Floating Bar.
          So `TripLogContent` logic removes the right column entirely if `hideComments` is true.
          This matches requirements.
          
          Issues:
          1. Modal loses Like/Scrap buttons because they were removed from `TripLogContent` template in this proposed file and not added to `TripLogComments`.
          2. `TripLogComments` needs to support the Like/Scrap row for Modal usage.
      -->

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
        class="fixed top-6 right-6 z-[80] bg-white border-[3px] border-[#2C2C2C] rounded-xl shadow-[4px_4px_0px_0px_rgba(44,44,44,0.3)] px-5 py-3 flex items-center gap-3"
      >
        <div class="w-6 h-6 bg-[#FFD60A] border-[2px] border-[#2C2C2C] rounded-full flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="#2C2C2C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="font-black text-sm text-[#2C2C2C]">
          {{ isBookmarked ? '내 여행에 추가되었습니다' : '링크가 복사되었습니다!' }}
        </span>
      </div>
    </Transition>

    <AlertDialog
      :show="alertState.show"
      :title="alertState.title"
      :message="alertState.message"
      :show-cancel-button="alertState.showCancelButton"
      @close="closeAlert"
      @confirm="alertState.onConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect, onMounted, onUnmounted } from 'vue'
import {
  Share,
  Share2,
  Edit,
  Trash2,
  Heart,
  MapPin,
  Calendar,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-vue-next'
import AlertDialog from '@/components/common/AlertDialog.vue'
import TripLogComments from './TripLogComments.vue'
import { format, parseISO } from 'date-fns'
import type { TripLogDetail } from '@/types/trip/trip.model'
import type { TripDetailResponseDto } from '@/apis/trip/types'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { likeTripLog, unlikeTripLog, postTripLogComment, updateTripLogComment, deleteTripLogComment } from '@/apis/trip-log/index'

const props = withDefaults(defineProps<{
  logDetail: TripLogDetail
  tripDetail: TripDetailResponseDto | null
  initialLiked: boolean
  showHeader?: boolean
  layout?: 'vertical' | 'horizontal'
  hideTitle?: boolean
  hideComments?: boolean
}>(), {
  showHeader: true,
  layout: 'vertical',
  hideTitle: false,
  hideComments: false
})

const emit = defineEmits(['update-like', 'place-click', 'login-required', 'refresh-comments', 'edit', 'delete'])

const authStore = useAuthStore()
const router = useRouter()

const showDropdown = ref(false)
const showToast = ref(false)
const activeDay = ref(1)
const isLiked = ref(props.initialLiked)
const currentLikes = ref(props.logDetail.likeCount)

const alertState = ref({
  show: false,
  title: '',
  message: '',
  showCancelButton: true,
  onConfirm: () => {},
})

const closeAlert = () => {
  alertState.value.show = false
}

const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  alertState.value = {
    show: true,
    title,
    message,
    showCancelButton: true,
    onConfirm: () => {
      onConfirm()
      closeAlert()
    },
  }
}

const showAlert = (title: string, message: string) => {
  alertState.value = {
    show: true,
    title,
    message,
    showCancelButton: false,
    onConfirm: closeAlert,
  }
}

watchEffect(() => {
    isLiked.value = props.initialLiked
    currentLikes.value = props.logDetail.likeCount
})

const isAuthor = computed(() => props.logDetail.authorNickname === authStore.user?.nickname)

const formattedDate = computed(() => {
  if (!props.logDetail.createdAt) return ''
  return format(parseISO(props.logDetail.createdAt), 'yyyy.MM.dd')
})

const formattedContent = computed(() => {
  if (!props.logDetail.content) return ''
  return props.logDetail.content.replace(/^[ \t]*{{\s*img_.*?\s*}}[ \t]*$\r?\n?/gm, '')
})

const groupedCourse = computed(() => {
  if (!props.tripDetail?.tripItems || props.tripDetail.tripItems.length === 0) {
    return []
  }
  const grouped = props.tripDetail.tripItems.reduce(
    (acc, item) => {
      const day = item.dayNumber
      if (!acc[day]) {
        acc[day] = { dayNumber: day, places: [] }
      }
      acc[day]!.places.push({ id: item.spot.id, name: item.spot.name })
      return acc
    },
    {} as Record<number, { dayNumber: number; places: { id: number; name: string }[] }>,
  )
  return Object.values(grouped).sort((a, b) => a.dayNumber - b.dayNumber)
})

watchEffect(() => {
  if (groupedCourse.value.length > 0) {
    activeDay.value = groupedCourse.value[0]!.dayNumber
  }
})

const handleLike = async () => {
  if (!authStore.isLoggedIn) {
    emit('login-required')
    return
  }

  try {
    let response
    if (isLiked.value) {
      response = await unlikeTripLog(props.logDetail.logId)
    } else {
      response = await likeTripLog(props.logDetail.logId)
    }
    isLiked.value = response.liked
    currentLikes.value = response.likeCount
    emit('update-like', { logId: props.logDetail.logId, likeCount: response.likeCount, liked: response.liked })
  } catch (e) {
    console.error('Failed to toggle like status:', e)
    showAlert('오류', '좋아요 상태 변경에 실패했습니다.')
  }
}



const handlePostComment = async (content: string) => {
  try {
    await postTripLogComment(props.logDetail.logId, { content })
    emit('refresh-comments')
  } catch (error) {
    console.error('Failed to post comment:', error)
    showAlert('오류', '댓글 작성에 실패했습니다.')
  }
}

const handleUpdateComment = async (commentId: number, content: string) => {
  try {
    await updateTripLogComment(commentId, { content })
    emit('refresh-comments')
  } catch (error) {
    console.error('Failed to update comment:', error)
    showAlert('오류', '댓글 수정에 실패했습니다.')
  }
}

const handleDeleteComment = (commentId: number) => {
  showConfirm('댓글 삭제', '댓글을 삭제하시겠습니까?', async () => {
    try {
      await deleteTripLogComment(commentId)
      emit('refresh-comments')
    } catch (error) {
      console.error('Failed to delete comment:', error)
      showAlert('오류', '댓글 삭제에 실패했습니다.')
    }
  })
}

const handleShare = () => {
  showDropdown.value = false
  navigator.clipboard.writeText(window.location.href).then(() => {
    showToast.value = true
    setTimeout(() => (showToast.value = false), 2000)
  })
}

const handleEdit = () => {
  showDropdown.value = false
  emit('edit')
}

const handleDelete = () => {
  showDropdown.value = false
  showConfirm('여행 기록 삭제', '정말 삭제하시겠습니까?', () => {
    emit('delete')
  })
}

const colors = ['#FFD60A', '#FF6B9D', '#98D8C8', '#B4E4FF', '#E88555']
const getBadgeColor = (idx: number) => colors[idx % colors.length]

const dropdownContainer = ref<HTMLElement | null>(null)

const handleClickOutside = (e: MouseEvent) => {
  if (showDropdown.value && dropdownContainer.value && !dropdownContainer.value.contains(e.target as Node)) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const navigateToUserLog = (userId: number) => {
  if (userId) {
    router.push({ name: 'user-log', params: { userId } })
  } else {
    console.warn('작성자 ID가 없습니다. API 응답을 확인해주세요.')
  }
}
</script>

<style scoped>
.course-badge:hover {
  background-color: var(--hover-color);
}
.no-animation-enter-active,
.no-animation-leave-active {
  transition: none;
}
</style>
