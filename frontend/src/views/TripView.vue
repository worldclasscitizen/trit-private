<template>
  <div class="min-h-screen bg-[#F5F5F5] font-sans">
    <TravelNavbar :current-page="'trips'" @navigate="handleNavigate" />

    <div class="pt-40 max-w-[1440px] mx-auto px-4 md:px-[70px] pb-12">
      <div class="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 class="text-5xl font-black tracking-tighter uppercase mb-2 font-sans text-black">
            My <span class="ml-2 text-[#9BCCC4]">Trips</span>
          </h1>
          <p class="text-sm font-bold text-gray-600">나만의 여행 계획을 만들고 관리하세요</p>
        </div>

        <button
          @click="handleCreateNewTrip"
          class="flex text-[18px] items-center justify-center gap-3 px-6 py-4 bg-black text-white border-[3px] border-black rounded-2xl font-black text-sm tracking-tight hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-white hover:text-black hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all uppercase w-full md:w-auto focus:outline-none"
        >
          <BadgePlus class="w-7 h-7"/>
          새로운 여행 계획 만들기
        </button>
      </div>

      <div class="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'px-3 py-1.5 rounded-lg transition-all text-base font-bold whitespace-nowrap focus:outline-none border-[2px] border-transparent',
            // **수정된 부분**
            activeTab === tab.id
              ? tab.activeColorClasses // 활성화된 경우: tab.activeColorClasses 사용
              : tab.inactiveColorClasses, // 비활성화된 경우: tab.inactiveColorClasses 사용
          ]"
        >
          {{ tab.label }} {{ getCount(tab.id) }}
        </button>
      </div>

      <div v-if="activeTab === TripStatus.COMPLETED" class="space-y-12">
        <div v-for="(group, month) in groupedCompletedTrips" :key="month">
          <div class="mb-6">
            <h2 class="text-5xl font-black tracking-tighter uppercase font-sans text-black">
              {{ formatMonth(month as string).year }}.<span class="text-[#E88555]">{{
                formatMonth(month as string).month
              }}</span>
            </h2>
            <div class="h-0.5 w-16 bg-black mt-2"></div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <TripCard
              v-for="trip in group"
              :key="trip.id"
              :trip="trip"
              @click="handleOpenModal(trip.id)"
              @open-modal="handleOpenModal"
              @refresh="fetchTrips"
              @copy="handleCopyClick"
            />
          </div>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <TripCard
          v-for="trip in displayTrips"
          :key="trip.id"
          :trip="trip"
          @click="handleOpenModal(trip.id)"
          @open-modal="handleOpenModal"
          @refresh="fetchTrips"
          @copy="handleCopyClick"
        />
      </div>
    </div>

    <TripDetailModal
      v-if="selectedTrip"
      :trip="selectedTrip"
      @close="handleCloseModal"
      @edit="handleNavigate('trip-edit', { id: $event.id })"
      @write="handleWriteLogFromModal"
      @edit-log="handleEditLogFromModal"
      @refresh="fetchTrips"
      @delete="handleTripDelete"
      @delete-log="handleLogDelete"
      @copy="handleTripCopy"
    />

    <AlertDialog
      :show="showCopyAlert"
      title="여행 복사"
      message="계획을 복사하시겠습니까?"
      confirm-button-text="복사"
      close-button-text="취소"
      @close="showCopyAlert = false"
      @confirm="handleCopyConfirm"
    />

    <AlertDialog
      :show="infoAlert.visible"
      :title="infoAlert.title"
      :message="infoAlert.message"
      :show-cancel-button="false"
      confirm-button-text="확인"
      @close="infoAlert.visible = false"
      @confirm="infoAlert.visible = false"
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

    <ScrollToTop />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { Plus } from 'lucide-vue-next'
import { useNavigate } from '@/composables/common/useNavagation'
import TravelNavbar from '@/components/common/TravelNavbar.vue'
import TripCard from '@/components/trip/TripCard.vue'
import TripDetailModal from '@/components/modal/TripDetailModal.vue'
import ScrollToTop from '@/components/common/ScrollToTop.vue'
import AlertDialog from '@/components/common/AlertDialog.vue'
import { useRouter, useRoute } from 'vue-router'
import { createTrip, getMyTrips, getTripDetail, requestScrapTrip } from '@/apis/trip/index'
import type { TripResponseDto, TripDetailResponseDto, TripItemResponseDto } from '@/apis/trip/types'
import { TripStatus } from '@/types/common'
import type { TripLogDetail } from '@/types/trip/trip.model'
import { BadgePlus } from 'lucide-vue-next'

const { handleNavigate } = useNavigate()
const router = useRouter()
const route = useRoute()

const activeTab = ref<TripStatus | 'all'>('all')
const tripsList = ref<TripResponseDto[]>([])

// 6. 알림 모달 상태 및 헬퍼
const infoAlert = reactive({
  visible: false,
  title: '알림',
  message: '',
})

const showAlert = (message: string, title = '알림') => {
  infoAlert.message = message
  infoAlert.title = title
  infoAlert.visible = true
}

// 토스트 메시지 상태
const showToast = ref(false)
const toastMessage = ref('')
const showToastMessage = (message: string) => {
    toastMessage.value = message
    showToast.value = true
    setTimeout(() => {
        showToast.value = false
    }, 2000)
}

// 데이터 조회
const fetchTrips = async () => {
  try {
    const response = await getMyTrips()
    tripsList.value = response
  } catch (error) {
    console.error('내 여행 목록 조회 실패:', error)
     showAlert('내 여행 목록 조회에 실패했습니다.') // 필요시 주석 해제
  }
}

onMounted(fetchTrips)

const selectedTrip = ref<TripDetailResponseDto | null>(null)

// 새로운 여행 계획 생성 핸들러
const handleCreateNewTrip = async () => {
  try {
    const newTrip = await createTrip()
    handleNavigate('trip-edit', { id: newTrip.id })
  } catch (error) {
    console.error('여행 계획 생성 실패:', error)
    showAlert('여행 계획 생성에 실패했습니다.')
  }
}

// 탭 필터링 로직
const planningTrips = computed(() => tripsList.value.filter((t) => t.status === TripStatus.PLANNED))
const completedTrips = computed(() => tripsList.value.filter((t) => t.status === TripStatus.COMPLETED))

const displayTrips = computed(() => {
  const filteredTrips = (() => {
    if (activeTab.value === TripStatus.PLANNED) return planningTrips.value
    if (activeTab.value === TripStatus.COMPLETED) return completedTrips.value
    return tripsList.value
  })()
  //console.log('displayTrips:', filteredTrips) // Added log
  return filteredTrips
})

const tabs: {
  id: TripStatus | 'all';
  label: string;
  // **추가된 부분**
  activeColorClasses: string;
  inactiveColorClasses: string;
}[] = [
  {
    id: 'all',
    label: '전체',
    // 활성화: 파랑
    activeColorClasses: 'bg-black text-white border-black transition-colors',
    // 비활성화: 파랑 계열
    inactiveColorClasses: 'bg-white text-black hover:bg-gray-50 hover:border-black transition-colors',
  },
  {
    id: TripStatus.PLANNED,
    label: '계획중',
    // 활성화: 초록
    activeColorClasses: 'bg-[#9bccc4] text-black border-[#9bccc4] transition-colors',
    // 비활성화: 주황 계열
    inactiveColorClasses: 'bg-white text-black hover:bg-[#dbe8e1] transition-colors hover:border-[#9bccc4]',
  },
  {
    id: TripStatus.COMPLETED,
    label: '완료',
    // 활성화: 초록
    activeColorClasses: 'bg-[#F9CA6B] text-black border-[#F9CA6B] transition-colors',
    // 비활성화: 초록 계열
    inactiveColorClasses: 'bg-white text-black hover:bg-[#ffeecb] hover:border-[#F9CA6B] transition-colors',
  },
];

const getCount = (tabId: TripStatus | 'all') => {
  if (tabId === 'all') return tripsList.value.length
  if (tabId === TripStatus.PLANNED) return planningTrips.value.length
  if (tabId === TripStatus.COMPLETED) return completedTrips.value.length
  return 0
}

const groupedCompletedTrips = computed(() => {
  const groups: Record<string, TripResponseDto[]> = {}
  completedTrips.value.forEach((trip) => {
    if (trip.startDate) {
      const monthKey = trip.startDate.substring(0, 7)
      if (!groups[monthKey]) groups[monthKey] = []
      groups[monthKey]!.push(trip)
    }
  })
  return Object.keys(groups)
    .sort((a, b) => b.localeCompare(a))
    .reduce(
      (acc, key) => {
        acc[key] = groups[key]
        return acc
      },
      {} as Record<string, TripResponseDto[]>,
      {} as Record<string, TripResponseDto[]>,
    )
})

const formatMonth = (monthStr: string) => {
  const [year, month] = monthStr.split('-')
  return { year, month }
}

// --- 핸들러 함수들 ---

// 1. 모달 열기 로직
const handleOpenModal = (tripId: number) => {
    router.push({ query: { ...route.query, tripId } })
}

const fetchTripDetailAndOpen = async (tripId: number) => {
    try {
        const detail = await getTripDetail(tripId)
        selectedTrip.value = {
            ...detail,
            description:
                detail.tripItems && detail.tripItems.length > 0
                ? detail.tripItems.map((item : TripItemResponseDto) => item.spot.name).join(' → ')
                : '장소 없음',
        }

    } catch (error) {
        console.error(`여행 상세 조회 실패 (ID: ${tripId}):`, error)
        showAlert('여행 상세 정보를 불러오는데 실패했습니다.')
        selectedTrip.value = null
        router.replace({ query: { ...route.query, tripId: undefined } }) // Remove invalid ID
    }
}

const handleCloseModal = () => {
    const query = { ...route.query }
    delete query.tripId
    delete query.tab
    router.replace({ query })
}

watch(() => route.query.tripId, async (newTripId) => {
    if (newTripId) {
        await fetchTripDetailAndOpen(Number(newTripId))
    } else {
        selectedTrip.value = null
    }
}, { immediate: true })

// 2. TripPlanView로 이동
const handleEditFromModal = (trip: TripDetailResponseDto) => {
  selectedTrip.value = null
  handleNavigate('trip-edit', { id: trip.id })
}

// 3. 로그 작성 이동
const handleWriteLogFromModal = (trip: TripDetailResponseDto) => {
  selectedTrip.value = null
  router.push({
    name: 'log-write',
    params: { tripId: trip.id }
  })
}

// 4. 로그 수정 이동
const handleEditLogFromModal = (tripLog: TripLogDetail) => {
  selectedTrip.value = null
  if (tripLog.logId){
    router.push({ name: 'log-edit', params: { logId: tripLog.logId}})
  }
}
// 5. 여행 복사 (스크랩) 로직
const showCopyAlert = ref(false)
const targetTripId = ref<number | null>(null)

const handleCopyClick = (tripId: number) => {
  targetTripId.value = tripId
  showCopyAlert.value = true
}

const handleCopyConfirm = async () => {
  if (!targetTripId.value) return
  
  try {
    await requestScrapTrip(targetTripId.value)
    showCopyAlert.value = false
    targetTripId.value = null
    // 성공 시 목록 새로고침
    await fetchTrips()
    showToastMessage('여행이 복사되었습니다.')
  } catch (error) {
    console.error('여행 복사 실패:', error)
    showAlert('여행 복사에 실패했습니다.')
  }
}

// 6. 여행 삭제 (Optimistic Update)
const handleTripDelete = (tripId: number) => {
    // 1. 목록에서 즉시 제거
    tripsList.value = tripsList.value.filter(t => t.id !== tripId)
    
    // 2. 모달 닫기 (이미 TripDetailModal에서 emit close를 했지만, 확실히 처리)
    handleCloseModal()

    // 3. 토스트 표시
    showToastMessage('여행이 삭제되었습니다.')
}

const handleLogDelete = () => {
    // 1. 목록 새로고침 (로그 삭제 후 여행 상태가 변할 수 있으므로)
    fetchTrips()
    
    // 2. 모달 닫기
    handleCloseModal()

    // 3. 토스트 표시
    showToastMessage('여행 일기가 삭제되었습니다.')
}

const handleTripCopy = () => {
    // 1. 목록 새로고침
    fetchTrips()
    
    // 2. 모달 닫기
    handleCloseModal()

    // 3. 토스트 표시
    showToastMessage('여행이 복사되었습니다.')
}
</script>

<style scoped>
.font-sans {
  font-family: 'Outfit', sans-serif;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
