<template>
  <div
    class="fixed inset-0 bg-black/60 flex flex-col items-center justify-center z-[70] p-6"
    @click="handleBackdropClick"
  >
    <button
      @click="emit('close')"
      class="absolute top-6 right-6 z-10 text-white hover:opacity-80 transition-opacity"
    >
      <span class="font-black text-3xl drop-shadow-[2px_2px_6px_rgba(0,0,0,0.6)]">✕</span>
    </button>

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
          {{ toastMessage }}
        </span>
      </div>
    </Transition>


    <div
      class="relative w-full max-w-4xl h-[85vh] flex flex-col"
    >
      <div class="flex-shrink-0 self-end">
        <div class="flex items-center justify-end">
          <div class="flex relative top-[3px]">
            <button
              @click="handleTabClick('map')"
              :class="[
                'px-4 py-2 text-base font-black border-[4px] border-[#2C2C2C] rounded-t-lg transition-all focus:outline-none',
                'border-b-0',
                activeTab === 'map'
                  ? 'bg-[#9BCCC4] translate-y-[-3px] shadow-[0_0_0_0_rgba(44,44,44,1)]'
                  : 'bg-[#9BCCC4]/50 translate-y-0 border-b-[3px] border-[#2C2C2C] shadow-[0_3px_0_0_rgba(44,44,44,0.4)]',
              ]"
            >
              MAP
            </button>
            <button
              @click="handleTabClick('log')"
              :class="[
                'px-4 py-2 text-base font-black border-[4px] border-[#2C2C2C] rounded-t-lg transition-all focus:outline-none mr-2 ml-1',
                'border-b-0',
                activeTab === 'log'
                  ? 'bg-[#F9CA6B] translate-y-[-3px] shadow-[0_0_0_0_rgba(44,44,44,1)]'
                  : 'bg-[#F9CA6B]/50 translate-y-0 border-b-[3px] border-[#2C2C2C] shadow-[0_3px_0_0_rgba(44,44,44,0.4)]',
              ]"
            >
              LOG
            </button>
          </div>
        </div>
      </div>

      <!-- Log Header -->
      <div v-if="activeTab === 'log' && tripLog" class="px-6 py-5 flex-shrink-0 rounded-t-xl z-20 border-[3px] border-[#2C2C2C] border-b-0 bg-white bg-gradient-to-br from-[#FFD60A]/10 to-white flex items-center justify-between">
        <div class="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity w-fit" @click.stop="navigateToUserLog(tripLog.authorId)">
          <div class="w-12 h-12 border-[2px] border-[#2C2C2C] rounded-full overflow-hidden shadow-[2px_2px_0px_0px_rgba(44,44,44,0.1)]">
            <img :src="tripLog.authorImageUrl" :alt="tripLog.authorNickname" class="w-full h-full object-cover" @error="handleImageError($event, 'profile')" />
          </div>
          <div>
            <h4 class="font-black text-[#2C2C2C] font-sans">{{ tripLog.authorNickname }}</h4>
            <div class="flex items-center gap-2 text-xs font-bold text-gray-600">
              <MapPin class="w-3 h-3" stroke-width="2.5" />
              <span>{{ tripLog.locationSummary }}</span>
              <span>•</span>
              <Calendar class="w-3 h-3" stroke-width="2.5" />
              <span>{{ tripLog.createdAt.substring(0, 10) }}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-1">
          <button @click="handleExpandClick" class="p-2 hover:bg-gray-100 rounded transition-all">
             <Maximize2 class="w-5 h-5 text-[#2C2C2C]" stroke-width="2.5" />
          </button>
          
          <div class="relative" ref="headerDropdownContainer">
            <button @click="showDropdown = !showDropdown" class="p-2 hover:bg-gray-100 rounded transition-all">
              <MoreHorizontal class="w-6 h-6 text-[#2C2C2C]" stroke-width="2.5" />
            </button>

          <div v-if="showDropdown" class="absolute right-0 top-full mt-2 w-40 bg-white border-[2px] border-[#2C2C2C] rounded-lg shadow-[4px_4px_0px_0px_rgba(44,44,44,0.2)] overflow-hidden z-20">
            <button @click="handleShare" class="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-gray-50 transition-colors text-left">
              <Share class="w-4 h-4 text-[#2C2C2C]" stroke-width="2.5" />
              <span class="font-bold text-sm text-[#2C2C2C]">공유</span>
            </button>

            <template v-if="trip.isOwner">
              <button @click="handleEditLogClick" class="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-gray-50 transition-colors text-left border-t border-gray-200">
                <Edit class="w-4 h-4 text-[#2C2C2C]" stroke-width="2.5" />
                <span class="font-bold text-sm text-[#2C2C2C]">수정</span>
              </button>

              <button @click="handleDeleteLogClick" class="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-red-50 transition-colors text-left border-t border-gray-200">
                <Trash2 class="w-4 h-4 text-red-500" stroke-width="2.5" />
                <span class="font-bold text-sm text-red-500">삭제</span>
              </button>
            </template>
          </div>
        </div>
        </div>
      </div>

      <!-- Map Header -->
      <div v-else class="bg-white border-[3px] border-[#2C2C2C] px-6 py-5 flex-shrink-0 rounded-t-xl z-10 border-b-0">
        <div class="flex items-center justify-between gap-6">
          <div class="flex-1">
            <h2 class="text-2xl font-black mb-2">{{ trip.title }}</h2>

            <div class="flex items-center gap-4 text-sm font-bold text-gray-600">
              <div class="flex items-center gap-2">
                <Calendar :size="18" :stroke-width="2.5" />
                <span>{{ displayDuration }}</span>
              </div>
              <div v-if="trip.locationSummary" class="flex items-center gap-2">
                <MapPin :size="18" :stroke-width="2.5" />
                <span>{{ trip.locationSummary }}</span>
              </div>
              <div v-else class="flex items-center gap-2">
                <MapPin :size="18" :stroke-width="2.5" />
                <span>{{ trip.tripItems.length }}개 장소</span>
              </div>

              <div class="flex items-center gap-2">
                <ListChecks :size="18" :stroke-width="2.5" />
                <div v-if="trip.isOwner" class="relative">
                  <select
                    :value="localTrip.status"
                    @change="handleStatusChange"
                    class="appearance-none h-7 pl-2 pr-6 border-[2px] border-[#2C2C2C] rounded-md text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-[#2C2C2C] cursor-pointer"
                  >
                    <option v-for="status in TripStatus" :key="status" :value="status">{{ status }}</option>
                  </select>
                  <div class="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown class="w-3 h-3 text-[#2C2C2C]" stroke-width="3" />
                  </div>
                </div>
                <span v-else>{{ trip.status }}</span>
              </div>

              <div class="flex items-center gap-2">
                <Shield :size="18" :stroke-width="2.5" />
                <div v-if="trip.isOwner" class="relative">
                  <select
                    :value="localTrip.visibility"
                    @change="handleVisibilityChange"
                    class="appearance-none h-7 pl-2 pr-6 border-[2px] border-[#2C2C2C] rounded-md text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-[#2C2C2C] cursor-pointer"
                  >
                    <option value="PUBLIC">PUBLIC</option>
                    <option value="PRIVATE">PRIVATE</option>
                  </select>
                  <div class="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown class="w-3 h-3 text-[#2C2C2C]" stroke-width="3" />
                  </div>
                </div>
                <span v-else>{{ trip.visibility }}</span>
              </div>
            </div>
          </div>

            <div class="relative" ref="mapDropdownContainer">
              <button @click="showMapDropdown = !showMapDropdown" class="p-2 hover:bg-gray-100 rounded transition-all">
                <MoreHorizontal class="w-6 h-6 text-[#2C2C2C]" stroke-width="2.5" />
              </button>

              <div v-if="showMapDropdown" class="absolute right-0 top-full mt-2 w-40 bg-white border-[2px] border-[#2C2C2C] rounded-lg shadow-[4px_4px_0px_0px_rgba(44,44,44,0.2)] overflow-hidden z-20">
                 <button @click="handleCopyTripClick" class="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-gray-50 transition-colors text-left">
                  <Copy class="w-4 h-4 text-[#2C2C2C]" stroke-width="2.5" />
                  <span class="font-bold text-sm text-[#2C2C2C]">여행 복사</span>
                </button>

                <button 
                  v-if="trip.isOwner" 
                  @click="handleEditClick" 
                  class="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-gray-50 transition-colors text-left border-t border-gray-200"
                >
                  <Edit class="w-4 h-4 text-[#2C2C2C]" stroke-width="2.5" />
                  <span class="font-bold text-sm text-[#2C2C2C]">일정 수정</span>
                </button>

                <button 
                  v-if="trip.isOwner" 
                  @click="handleDeleteTripClick" 
                  class="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-red-50 transition-colors text-left border-t border-gray-200"
                >
                  <Trash2 class="w-4 h-4 text-red-500" stroke-width="2.5" />
                  <span class="font-bold text-sm text-red-500">여행 삭제</span>
                </button>
              </div>
            </div>
          </div>
        </div>


      <div
        class="flex-1 flex overflow-hidden border-[3px] border-[#2C2C2C] rounded-b-xl isolate transform-gpu"
        :class="activeTab === 'map' ? 'border-t-[3px]' : 'border-t-0'"
      >
        <div v-if="activeTab === 'map'" class="flex-1 flex overflow-hidden">
          <div class="w-[320px] bg-white border-r-[3px] border-[#2C2C2C] flex flex-col overflow-hidden flex-shrink-0">
            <div class="p-4 border-b-[2px] border-gray-200">
              <div class="flex items-center gap-2 overflow-x-auto no-scrollbar">
                <button
                  v-for="day in days"
                  :key="day.dayNumber"
                  @click="activeDay = day.dayNumber"
                  :class="[
                    'px-4 py-2 rounded-lg font-black text-sm uppercase tracking-wide transition-all flex-shrink-0 border-[2px]',
                    activeDay === day.dayNumber
                      ? 'bg-[#2C2C2C] text-white border-[#2C2C2C]'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-[#2C2C2C]',
                  ]"
                >
                  Day {{ day.dayNumber }}
                </button>
              </div>
            </div>

            <div class="flex-1 overflow-y-auto p-4 bg-gray-50">
              <h3 class="font-black text-sm uppercase tracking-wide text-gray-700 mb-3">
                선택된 장소 ({{ currentDayPlaces.length }})
              </h3>

              <div v-if="currentDayPlaces.length > 0" class="space-y-2">
                <div
                  v-for="(place, index) in currentDayPlaces"
                  :key="place.id"
                  class="p-3 bg-white border-[2px] border-[#2C2C2C] rounded-lg hover:shadow-[2px_2px_0px_0px_rgba(44,44,44,0.2)] transition-all cursor-pointer group"
                  @click="handlePlaceClick(place)"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-lg border-[2px] border-[#2C2C2C] flex items-center justify-center font-black text-sm flex-shrink-0 bg-[#9BCCC4]"
                    >
                      {{ index + 1 }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <h4 class="font-black text-sm truncate leading-tight">{{ place.name }}</h4>
                      <p class="text-xs font-bold text-gray-600 truncate">{{ place.category }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-8">
                <div class="w-12 h-12 bg-gray-100 border-[2px] border-gray-300 rounded-lg mx-auto mb-3 flex items-center justify-center">
                  <MapPin :size="24" :stroke-width="2" class="text-gray-400" />
                </div>
                <p class="text-sm font-bold text-gray-500">선택된 장소가 없습니다</p>
              </div>
            </div>
          </div>

          <div class="flex-1 flex flex-col bg-gray-100">
            <div class="flex-1 relative">
              <KakaoMap
                ref="kakaoMapRef"
                class="absolute inset-0 w-full h-full"
                :center="mapCenter"
                :level="7"
                :markers="markerPositions"
                :selected-marker-id="selectedMarkerId"
                :show-plan-line="true"
                @marker-click="handleMarkerClick"
              />
              <div v-if="markerPositions.length === 0" class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="text-center">
                  <div class="w-14 h-14 bg-white border-[3px] border-[#2C2C2C] rounded-full flex items-center justify-center mx-auto mb-3 shadow-[4px_4px_0px_0px_rgba(44,44,44,0.4)]">
                    <MapPin :size="26" :stroke-width="2.5" class="text-[#2C2C2C]" />
                  </div>
                  <p class="font-bold text-gray-700">코스에 담긴 장소가 지도에 표시됩니다</p>
                </div>
              </div>
            </div>

            <PlaceDetailPanel
              :place="selectedPlace"
              @close="selectedPlace = null"
              @open-detail="handleOpenPlaceDetailModal"
            />
          </div>
        </div>

        <div v-if="activeTab === 'log'" class="p-1 flex-1 overflow-y-auto flex items-center justify-center bg-gray-50">
          <div v-if="logLoading" class="text-center text-lg font-bold text-gray-600">
            로그를 불러오는 중...
          </div>

          <div v-else-if="tripLog" class="w-full h-full">
              <TripLogContent
                  :log-detail="tripLog"
                  :trip-detail="localTrip"
                  :initial-liked="isLiked"
                  :show-header="false"
                  layout="horizontal"
                  @update-like="handleLogLikeUpdate"
                  @place-click="handleLogPlaceClick"
                  @login-required="isLoginAlertVisible = true"
                  @refresh-comments="fetchTripLog(trip.id)"
                  @edit="handleEditLogClick"
                  @delete="handleDeleteLogClick"
              />
          </div>

          <div v-else class="text-center mb-20 p-12 flex flex-col justify-center items-center">
              <p class="text-lg font-bold text-gray-700 mb-6">아직 로그를 작성하지 않았어요!</p>
              <button
                  @click="handleWriteLogClick"
                  class="flex items-center gap-2 px-6 py-3 bg-white border-[2px] border-[#2C2C2C] rounded-full font-bold shadow-[3px_3px_0px_0px_rgba(44,44,44,1)] hover:shadow-[4px_4px_0px_0px_rgba(44,44,44,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all uppercase focus:outline-none"
              >
                  <Pencil :size="16" :stroke-width="3" /> 글 쓰기
              </button>
          </div>
        </div>
      </div>
    </div>

    <PlaceDetailModal
        v-if="showPlaceDetailModal && detailedPlace"
        :place="detailedPlace"
        @close="showPlaceDetailModal = false"
    />

    <AlertDialog
      :show="isLoginAlertVisible"
      title="로그인 필요"
      message="로그인 후 이용해주세요!"
      confirm-button-text="로그인"
      close-button-text="취소"
      @close="isLoginAlertVisible = false"
      @confirm="handleLoginConfirm"
    />

    <AlertDialog
      :show="showCopyConfirm"
      title="여행 복사"
      message="계획을 복사하시겠습니까?"
      confirm-button-text="복사"
      close-button-text="취소"
      @close="showCopyConfirm = false"
      @confirm="handleCopyConfirm"
    />

    <AlertDialog
      :show="showDeleteConfirm"
      title="여행 삭제"
      message="계획을 삭제하시겠습니까?"
      confirm-button-text="삭제"
      close-button-text="취소"
      @close="showDeleteConfirm = false"
      @confirm="handleDeleteTripConfirm"
    />

    <AlertDialog
      :show="showLogDeleteConfirm"
      title="기록 삭제"
      message="이 기록을 삭제하시겠습니까?"
      confirm-button-text="삭제"
      close-button-text="취소"
      @close="showLogDeleteConfirm = false"
      @confirm="handleLogDeleteConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watchEffect, reactive, watch } from 'vue'
import { Calendar, MapPin, Edit, ListChecks, Shield, ChevronDown, Pencil, User, Heart, MessageCircle, Trash, MoreHorizontal, Share, Trash2, Maximize2, Copy } from 'lucide-vue-next'
import KakaoMap from '@/components/common/KakaoMap.vue'
import PlaceDetailPanel from '@/components/trip/PlaceDetailPanel.vue'
import PlaceDetailModal from '@/components/modal/PlaceDetailModal.vue'
import TripLogContent from '@/components/trip-log/TripLogContent.vue'
import { updateTrip, requestScrapTrip, deleteTrip } from '@/apis/trip/index'
import type { TripDetailResponseDto, SpotResponseDto} from '@/apis/trip/types'
import { TripStatus } from '@/types/common'
import type { TripLogDetail } from '@/types/trip/trip.model'
import { getTripLogDetail, deleteTripLog, getTripLogLikeStatus } from '@/apis/trip-log/index'
import AlertDialog from '@/components/common/AlertDialog.vue'
import { handleImageError } from '@/utils/imageHandler'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

interface DayPlanDisplay {
  dayNumber: number
  places: SpotResponseDto[]
}

const props = withDefaults(defineProps<{
  trip: TripDetailResponseDto & { duration?: string; description?: string; views?: number; imageUrl?: string }
  initialPlaceId?: number | null
  initialTab?: 'map' | 'log'
  logData?: TripLogDetail | null
  initialIsLiked?: boolean
}>(), {
  initialTab: 'map',
  initialIsLiked: false
})

const emit = defineEmits(['close', 'edit', 'write', 'edit-log', 'refresh', 'update'])


const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 1. 상태 동기화 (드롭다운 즉시 반응용)
const localTrip = reactive({ ...props.trip })
watchEffect(() => {
  Object.assign(localTrip, props.trip)
})

// 2. 탭 & 로그 상태
// 2. 탭 & 로그 상태
const activeTab = ref<'map' | 'log'>((route.query.tab as 'map' | 'log') || props.initialTab || 'map')
const tripLog = ref<TripLogDetail | null>(props.logData || null)
const isLoginAlertVisible = ref(false)

const handleLoginConfirm = () => {
  isLoginAlertVisible.value = false
  router.push({ name: 'login' })
  emit('close')
}

// 3. 지도 & 장소 관련 상태
const kakaoMapRef = ref<any>(null)
const activeDay = ref(1)
const selectedPlace = ref<SpotResponseDto | null>(null)
const selectedMarkerId = ref<number | string | null>(null)
const showPlaceDetailModal = ref(false) // Nested Modal State
const detailedPlace = ref<SpotResponseDto | null>(null)

const days = computed<DayPlanDisplay[]>(() => {
  const grouped = props.trip.tripItems.reduce((acc, item) => {
    if (!acc[item.dayNumber]) {
      acc[item.dayNumber] = { dayNumber: item.dayNumber, places: [] }
    }
    acc[item.dayNumber]!.places.push(item.spot)
    return acc
  }, {} as Record<number, DayPlanDisplay>)

  return Object.values(grouped).sort((a, b) => a.dayNumber - b.dayNumber)
})

watchEffect(() => {
  if (props.initialPlaceId) {
    const initialItem = props.trip.tripItems.find(item => item.spot.id === props.initialPlaceId)
    if (initialItem) {
      activeDay.value = initialItem.dayNumber
      setTimeout(() => {
        handlePlaceClick(initialItem.spot)
      }, 0)
    }
  } else if (days.value.length > 0) {
    activeDay.value = days.value[0]!.dayNumber
  }
})

const currentDayPlaces = computed(() => {
  const day = days.value.find((d) => d.dayNumber === activeDay.value)
  return day ? day.places : []
})

const markerPositions = computed(() =>
  currentDayPlaces.value
    .filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number')
    .map((p, index) => ({
      id: p.id,
      lat: p.lat as number,
      lng: p.lng as number,
      type: 'plan' as const,
      order: index + 1,
    })),
)

const mapCenter = computed(() => {
  const first = currentDayPlaces.value.find(
    (p) => typeof p.lat === 'number' && typeof p.lng === 'number',
  )
  if (first && typeof first.lat === 'number' && typeof first.lng === 'number') {
    return { lat: first.lat, lng: first.lng }
  }
  return { lat: 37.5665, lng: 126.978 }
})

const logLoading = ref(false)
const isLiked = ref(props.initialIsLiked)

const fetchTripLog = async (tripId: number) => {
    const targetLogId = props.trip.logId || tripLog.value?.logId
    if(!targetLogId) return

    logLoading.value = true;
    try {
        const [logResponse, likeResponse] = await Promise.all([
          getTripLogDetail(targetLogId),
          useAuthStore().isLoggedIn ? getTripLogLikeStatus(targetLogId) : Promise.resolve({ liked: false })
        ])
        tripLog.value = logResponse;
        isLiked.value = likeResponse.liked
    } catch (error: any) {
        console.error('fetchTripLog error:', error)
        if (error?.response?.status === 404){
          console.warn(`tripId[${tripId}] 로그가 없습니다`)
          tripLog.value = null // Only nullify if 404
        }
        else alert('로그를 불러오는 중 오류가 발생했습니다.')
    } finally {
        logLoading.value = false;
        if(tripLog.value) {
           emit('update', {
              type: 'sync',
              logId: tripLog.value.logId,
              likeCount: tripLog.value.likeCount,
              liked: isLiked.value,
              commentCount: tripLog.value.commentCount
           })
        }
    }
}

const handleLogLikeUpdate = (payload: { logId: number; likeCount: number; liked: boolean }) => {
    if(tripLog.value && tripLog.value.logId === payload.logId) {
        tripLog.value.likeCount = payload.likeCount
        isLiked.value = payload.liked
        emit('update', { type: 'like', ...payload })
    }
}

const handleLogPlaceClick = (placeId: number) => {
    activeTab.value = 'map'
    const item = props.trip.tripItems.find(i => i.spot.id === placeId)
    if(item) {
        activeDay.value = item.dayNumber
        // wait for map ?
        setTimeout(() => {
             handlePlaceClick(item.spot)
        }, 100)
    }
}

// 탭 핸들러
const handleTabClick = (tab: 'map' | 'log') => {
  activeTab.value = tab
  // router.replace({ query: { ...route.query, tab } }) // Remove URL sync to prevent sticky state
}

// URL 변경 감지 (뒤로가기 등)
watch(() => route.query.tab, (newTab) => {
  if (newTab === 'map' || newTab === 'log') {
    activeTab.value = newTab
  } else {
    activeTab.value = 'map'
  }
})

// 탭 변경 감지 및 로그 데이터 로드
watch(activeTab, (newTab) => {
    if (newTab === 'log' && !tripLog.value && !logLoading.value) {
        if (props.logData) {
            tripLog.value = props.logData
            isLiked.value = props.initialIsLiked
        } else if (props.trip.logId) {
             fetchTripLog(props.trip.id);
        }
    }
}, { immediate: true })

// 상태 변경 핸들러
const handleStatusChange = async (event: Event) => {
  const newStatus = (event.target as HTMLSelectElement).value as TripStatus
  try {
    await updateTrip(props.trip.id, { status: newStatus })
    localTrip.status = newStatus
    emit('refresh')
  } catch (error) {
    console.error('Failed to update status:', error)
    alert('상태 변경에 실패했습니다.')
  }
}

// 공개 여부 변경 핸들러
const handleVisibilityChange = async (event: Event) => {
  const newVisibility = (event.target as HTMLSelectElement).value as any
  try {
    await updateTrip(props.trip.id, { visibility: newVisibility })
    localTrip.visibility = newVisibility
    emit('refresh')
  } catch (error) {
    console.error('Failed to update visibility:', error)
    alert('공개 여부 변경에 실패했습니다.')
  }
}

// 로그 관련 핸들러
const showLogDeleteConfirm = ref(false)

const handleDeleteLogClick = async () => {
  showDropdown.value = false // Close dropdown
  if (!logLoading.value && tripLog.value && props.trip.isOwner){
     showLogDeleteConfirm.value = true
  }
}

const handleLogDeleteConfirm = async () => {
    if(!tripLog.value) return 

    try {
      await deleteTripLog(tripLog.value.logId)
      showLogDeleteConfirm.value = false
      
      emit('delete-log', tripLog.value!.logId)
      emit('close')
    } catch (error) {
      console.error('로그 삭제 실패', error)
      alert('로그 삭제 실패')
    }
}

const handleEditLogClick = () => {
  showDropdown.value = false // Close dropdown
  if(tripLog.value) emit('edit-log', tripLog.value )
}

const showDropdown = ref(false)
const headerDropdownContainer = ref<HTMLElement | null>(null)
const showToast = ref(false)
const toastMessage = ref('')

const handleShare = () => {
    showDropdown.value = false
    const logId = tripLog.value?.logId || props.trip.logId
    if (!logId) {
        alert('로그 정보를 찾을 수 없습니다.')
        return
    }
    const url = `${window.location.origin}/diary/${logId}`
    navigator.clipboard.writeText(url).then(() => {
        toastMessage.value = '링크가 복사되었습니다!'
        showToast.value = true
        setTimeout(() => {
            showToast.value = false
        }, 2000)
    })
}

const handleWriteLogClick = () => {
  emit('write', props.trip)
}

const showMapDropdown = ref(false)
const mapDropdownContainer = ref<HTMLElement | null>(null)

const handleEditClick = () => {
  showMapDropdown.value = false
  emit('edit', props.trip)
}

// 여행 복사 관련
const showCopyConfirm = ref(false)

const handleCopyTripClick = () => {
  showMapDropdown.value = false
  showCopyConfirm.value = true
}

const handleCopyConfirm = async () => {
  try {
    await requestScrapTrip(props.trip.id)
    showCopyConfirm.value = false
    
    // 부모 컴포넌트에게 위임 (토스트, 리프레시)
    emit('copy')
    emit('close')
  } catch (error) {
    console.error('Copy trip failed:', error)
    alert('여행 복사에 실패했습니다.')
  }
}

// 여행 삭제 관련
const showDeleteConfirm = ref(false)

const handleDeleteTripClick = () => {
  showMapDropdown.value = false
  showDeleteConfirm.value = true
}

const handleDeleteTripConfirm = async () => {
  try {
    await deleteTrip(props.trip.id)
    showDeleteConfirm.value = false
    
    // emit('refresh') // Refactored to emit 'delete' for optimistic update
    emit('delete', props.trip.id)
    emit('close')
  } catch (error) {
    console.error('Delete trip failed:', error)
    alert('여행 삭제에 실패했습니다.')
  }
}

// 지도 및 장소 핸들러
const handlePlaceClick = (place: SpotResponseDto) => {
  selectedPlace.value = place
  selectedMarkerId.value = place.id
  if (place.lat && place.lng && kakaoMapRef.value) {
    let finalLat = place.lat

    const map = kakaoMapRef.value.map
    if (!map) {
      kakaoMapRef.value.panTo(place.lat, place.lng)
      return
    }

    const bounds = map.getBounds()
    const mapDiv = kakaoMapRef.value.$el

    if (bounds && mapDiv && mapDiv.offsetHeight > 0) {
      const mapHeightInPixels = mapDiv.offsetHeight
      const pixelOffset = 85
      const latSpan = bounds.getNorthEast().getLat() - bounds.getSouthWest().getLat()
      const latOffset = (latSpan / mapHeightInPixels) * pixelOffset
      finalLat -= latOffset
    }

    kakaoMapRef.value.panTo(finalLat, place.lng)
  }
}

const handleMarkerClick = (id: number | string) => {
  const place = currentDayPlaces.value.find((p) => p.id === id)
  if (place) {
    handlePlaceClick(place)
  }
}

// [중요] 상세 모달 열기 핸들러
const handleOpenPlaceDetailModal = (place: SpotResponseDto) => {
    detailedPlace.value = place
    showPlaceDetailModal.value = true
}

const handleExpandClick = () => {
  if (tripLog.value) {
    router.push({ name: 'trip-log-detail', params: { logId: tripLog.value.logId } })
  }
}

const displayDuration = computed(() => {
  const start = props.trip.startDate
  if (start) {
    return start
  } else {
    return '날짜 미정'
  }
})

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (showPlaceDetailModal.value) return
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', handleClickOutside)
})

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (showDropdown.value && headerDropdownContainer.value && !headerDropdownContainer.value.contains(target)) {
    showDropdown.value = false
  }
  if (showMapDropdown.value && mapDropdownContainer.value && !mapDropdownContainer.value.contains(target)) {
    showMapDropdown.value = false
  }
}

const handleBackdropClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    emit('close')
  }
}

const navigateToUserLog = (userId: number) => {
  const targetId = userId || (props.trip.isOwner && authStore.user?.id);
  
  if (targetId) {
    router.push({ name: 'user-log', params: { userId: targetId } })
  } else {
    console.warn('Navigation failed: Missing author ID')
  }
}
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
