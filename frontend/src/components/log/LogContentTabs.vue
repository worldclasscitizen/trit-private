<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

import { normalizeDiary } from '@/mappers/userProfile.mapper'
import type { UserLogSummaryDto } from '@/apis/user/types'
import type { TripPlanView } from '@/types/trip/trip.model'
import type {
  TripDetailResponseDto,
  TripDiaryResponseDto,
} from '@/apis/trip/types'

import { createTrip, getTripDetail, requestScrapTrip } from '@/apis/trip/index'
import type { LogDiaryDto } from '@/apis/trip/types'
import { Heart, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import TripCard from '@/components/trip/TripCard.vue'
import TripDetailModal from '@/components/modal/TripDetailModal.vue'
import AlertDialog from '@/components/common/AlertDialog.vue'
import { handleImageError } from '@/utils/imageHandler'

interface Props {
// ... existing props ...
  isMyProfile: boolean
  userDiaries: (LogDiaryDto | UserLogSummaryDto)[]
  userPlans: TripPlanView[]
  currentPage?: number
  totalPages?: number
}

const props = withDefaults(defineProps<Props>(), {
  userDiaries: () => [],
  userPlans: () => [],
})

const router = useRouter()
const activeTab = ref<'diary' | 'plan'>('diary')

// --------------------
// 일기 목록 정규화
// --------------------
const normalizedDiaries = computed<LogDiaryDto[]>(() =>
  props.userDiaries.map(normalizeDiary),

)

// --- Modal State ---
const isDetailModalOpen = ref(false)
const selectedTrip = ref<TripDetailResponseDto | null>(null)
const isLoadingDetail = ref(false)

// --- Plans ---
const filteredPlans = computed(() => {
  if (props.isMyProfile) return props.userPlans
  return props.userPlans.filter(
    plan =>
      plan.visibility === 'PUBLIC' &&
      (plan.status === 'PLANNED' || plan.status === 'COMPLETED'),
  )
})

const handleCreateNewPlan = async () => {
  const newTrip = await createTrip()
  router.push(`/trips/${newTrip.id}`)
}

const detailInitialTab = ref<'map' | 'log'>('map')

const handlePlanClick = async (tripId: number) => {
  isLoadingDetail.value = true
  isDetailModalOpen.value = true
  detailInitialTab.value = 'map'
  try {
    const res = await getTripDetail(tripId)

    selectedTrip.value = res
  } finally {
    isLoadingDetail.value = false
  }
}

const handleCloseModal = () => {
  isDetailModalOpen.value = false
  selectedTrip.value = null
}

const handleEdit = (trip: TripDetailResponseDto) => {
  router.push(`/trips/${trip.id}`)
}

const handleDiaryClick = async (tripId: number) => {
  isLoadingDetail.value = true
  isDetailModalOpen.value = true
  detailInitialTab.value = 'log'
  try {
    const res = await getTripDetail(tripId)

    selectedTrip.value = res
    
  } finally {
    isLoadingDetail.value = false
  }
}

const showCopyAlert = ref(false)
const targetTripId = ref<number | null>(null)

const handleCopyClick = (id: number) => {
  targetTripId.value = id
  showCopyAlert.value = true
}

const handleCopyConfirm = async () => {
    if (targetTripId.value) {
        try {
            await requestScrapTrip(targetTripId.value)
            showCopyAlert.value = false
            
            showToast.value = true
            toastMessage.value = '여행이 복사되었습니다.'
            setTimeout(() => {
                showToast.value = false
            }, 3000)

            emit('refresh-data') // Trigger reload in parent
        } catch (error) {
            console.error('여행 복사 실패', error)
            alert('여행 복사에 실패했습니다.')
        }
    }
}

const handleCardRefresh = async () => {
  // Add delay for DB consistency like in TripView
  await new Promise(resolve => setTimeout(resolve, 200))
  emit('refresh-data')
}

const handleWriteLogFromModal = (trip: TripDetailResponseDto) => {
  router.push({
    name: 'log-write',
    params: { tripId: trip.id }
  })
}

const emit = defineEmits(['page-change', 'refresh-data'])

const handleEditLog = (log: any) => {
  const logId = log.logId || log.id
  if (logId) {
    router.push({
      name: 'log-edit',
      params: { logId }
    })
  } else {
    console.error('Log ID not found for edit', log)
  }
}

const handleLogDelete = () => {
  showToast.value = true
  toastMessage.value = '기록이 삭제되었습니다.'
  setTimeout(() => {
    showToast.value = false
  }, 3000)
  emit('refresh-data')
}

const handleTripDelete = () => {
  showToast.value = true
  toastMessage.value = '여행이 삭제되었습니다.'
  handleCloseModal()
  setTimeout(() => {
    showToast.value = false
  }, 3000)
  emit('refresh-data')
}

const handleTripCopy = () => {
  showToast.value = true
  toastMessage.value = '여행이 복사되었습니다.'
  handleCloseModal()
  setTimeout(() => {
    showToast.value = false
  }, 3000)
  emit('refresh-data')
}

// Toast State
const showToast = ref(false)
const toastMessage = ref('')

// Helpers
const stripHtml = (html?: string) => {
  if (!html) return ''
  const tmp = document.createElement('DIV')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '날짜 미정'
    const date = new Date(dateStr)
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}
</script>


<template>
  <div>
    <div class="bg-white border-[3px] border-[#2C2C2C] rounded-[15px] p-6 shadow-[4px_4px_0px_0px_rgba(44,44,44,1)]">
      <div class="flex border-b-2 border-gray-100 mb-6">
        <button
          @click="activeTab = 'diary'"
          class="px-4 py-2 text-lg font-black"
          :class="{
            'border-b-4 border-[#2C2C2C] text-[#2C2C2C]': activeTab === 'diary',
            'text-gray-600 hover:text-gray-800': activeTab !== 'diary'
          }"
        >
          여행 일기 ({{ normalizedDiaries.length }})
        </button>
        <button
          @click="activeTab = 'plan'"
          class="px-4 py-2 text-lg font-black"
          :class="{
            'border-b-4 border-[#2C2C2C] text-[#2C2C2C]': activeTab === 'plan',
            'text-gray-600 hover:text-gray-800': activeTab !== 'plan'
          }"
        >
          여행 계획 ({{ filteredPlans.length }})
        </button>
      </div>

      <div>
        <!-- 여행 계획 탭 -->
        <div v-if="activeTab === 'plan'">
          <div v-if="filteredPlans.length === 0" class="col-span-full text-center text-gray-500 py-10">
            <p class="mb-4">아직 작성된 여행 계획이 없습니다.</p>
            <button v-if="isMyProfile"
                    @click="handleCreateNewPlan"
                    class="px-5 py-2 border-[3px] rounded-xl font-bold text-xs transition-colors shadow-[4px_4px_0px_0px_rgba(150,150,150,1)] bg-[#9BCCC4] text-[#2C2C2C] border-[#2C2C2C] hover:bg-[#80B0A8]"
            >
              새 계획 세우기
            </button>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            <TripCard
              v-for="plan in filteredPlans"
              :key="plan.id"
              :trip="plan"
              :is-editable="isMyProfile"
              @open-modal="handlePlanClick"
              @copy="handleCopyClick"
              @refresh="handleCardRefresh"
            />
          </div>
        </div>

        <!-- ... (Diary tab unchanged) ... -->
        <!-- 여행 일기 탭 -->
        <div v-if="activeTab === 'diary'">
          <div v-if="normalizedDiaries.length === 0" class="col-span-full text-center text-gray-500 py-10">
            <p class="mb-4">아직 작성된 여행 일기가 없습니다.</p>
            <button v-if="isMyProfile"
                    class="px-5 py-2 border-[3px] rounded-xl font-bold text-xs transition-colors shadow-[4px_4px_0px_0px_rgba(150,150,150,1)] bg-black text-white border-black hover:bg-[#2C2C2C]"
            >
              새 일기 쓰기
            </button>
          </div>
            <div v-else>
               <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 mb-12 min-h-[1000px] content-start">
                   <div v-for="card in normalizedDiaries" :key="card.tripId"
                       @click="handleDiaryClick(card.tripId)"
                       class="cursor-pointer bg-white border-[2px] border-[#2C2C2C] rounded-2xl shadow-[4px_4px_0px_0px_rgba(44,44,44,0.15)] flex flex-col overflow-hidden transition-transform hover:scale-105"
                   >
                     <div class="relative w-full h-40">
                       <img :src="card.thumbnailUrl || '/default-profile.svg'" :alt="card.title" class="w-full h-full object-cover" @error="handleImageError($event, 'thumbnail')">
                        <span v-if="card.visibility === 'PRIVATE'" class="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                         PRIVATE
                       </span>
                       <span class="absolute top-2 left-2 bg-[#9BCCC4] text-[#2C2C2C] text-xs font-bold px-2 py-1 rounded-full">
                         DIARY
                       </span>
                     </div>
                     <div class="p-4 flex-1 flex flex-col">
                       <h3 class="font-black text-xl text-[#2C2C2C] mb-2 truncate">{{ card.title }}</h3>
                       <p class="text-sm text-gray-600 mb-3 line-clamp-2 h-10">
                         {{ card.content ? stripHtml(card.content) : '내용이 없습니다.' }}
                       </p>
                       <div v-if="card.tags" class="flex flex-wrap gap-1 mb-3 h-5 overflow-hidden">
                         <span v-for="tag in card.tags" :key="tag"
                               class="bg-gray-100 text-gray-700 text-xs font-semibold px-2 py-0.5 rounded-full"
                         >#{{ tag }}</span>
                       </div>
                       <div class="mt-auto text-xs text-gray-500 flex justify-between items-center">
                         <span>{{ formatDate(card.createdAt) }}</span>
                         <div class="flex items-center gap-2">
                           <span class="flex items-center text-gray-600"><Heart class="w-4 h-4 mr-1" />{{ card.likes || 0 }}</span>
                           <span class="flex items-center text-gray-600"><MessageCircle class="w-4 h-4 mr-1" />{{ card.comments || 0 }}</span>
                         </div>
                       </div>
                     </div>
                   </div>
               </div>

               <!-- Pagination -->
               <div v-if="totalPages && totalPages > 1" class="flex justify-center items-center gap-2">
                 <button
                   @click="emit('page-change', currentPage! - 1)"
                   :disabled="currentPage === 1"
                   class="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                 >
                   <ChevronLeft class="w-5 h-5" />
                 </button>
                 
                 <div class="flex gap-1">
                   <button
                     v-for="page in totalPages"
                     :key="page"
                     @click="emit('page-change', page)"
                     class="w-8 h-8 rounded-full text-sm font-bold transition-all"
                     :class="currentPage === page ? 'bg-[#2C2C2C] text-white' : 'hover:bg-gray-100 text-gray-600'"
                   >
                     {{ page }}
                   </button>
                 </div>

                 <button
                   @click="emit('page-change', currentPage! + 1)"
                   :disabled="currentPage === totalPages"
                   class="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                 >
                   <ChevronRight class="w-5 h-5" />
                 </button>
               </div>
           </div>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <TripDetailModal
      v-if="isDetailModalOpen && selectedTrip"
      :trip="selectedTrip"
      :initial-tab="detailInitialTab"
      @close="handleCloseModal"
      @edit="handleEdit"
      @write="handleWriteLogFromModal"
      @refresh="handleCardRefresh"
      @edit-log="handleEditLog"
      @delete-log="handleLogDelete"
      @delete="handleTripDelete"
      @copy="handleTripCopy"
    />

    <!-- Toast Notification -->
    <Transition
      leave-active-class="transition-all duration-200 ease-in"
      enter-from-class="opacity-0 translate-y-[-20px]"
      enter-to-class="opacity-100 translate-y-0"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-[-20px]"
    >
      <div
        v-if="showToast"
        class="fixed top-24 right-6 z-[90] bg-white border-[3px] border-[#2C2C2C] rounded-xl shadow-[4px_4px_0px_0px_rgba(44,44,44,0.3)] px-5 py-3 flex items-center gap-3"
      >
        <div class="w-6 h-6 bg-[#FFD60A] border-[2px] border-[#2C2C2C] rounded-full flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="#2C2C2C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="font-black text-sm text-[#2C2C2C]">
          {{ toastMessage }}
        </span>
      </div>
    </Transition>

    <!-- Loading Overlay for Modal -->
    <div v-if="isLoadingDetail" class="fixed inset-0 bg-white/70 flex items-center justify-center z-50">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2C2C2C]"></div>
    </div>

    <AlertDialog
      :show="showCopyAlert"
      title="여행 복사"
      message="계획을 복사하시겠습니까?"
      confirm-button-text="복사"
      close-button-text="취소"
      @close="showCopyAlert = false"
      @confirm="handleCopyConfirm"
    />
  </div>
</template>
