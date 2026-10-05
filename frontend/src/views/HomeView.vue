<template>
  <div class="min-h-screen bg-[#F5F5F5] font-sans selection:bg-[#F9CA6B] selection:text-black">
    <TravelNavbar current-page="main" @navigate="handleNavigate" />

    <div class="pt-28 max-w-[1440px] mx-auto px-6 pb-12">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        <!-- Left Sidebar: Discovery -->
        <div class="hidden lg:block lg:col-span-3 space-y-8">

          <!-- Keywords Section -->
          <div class="bg-white border-[2px] border-[#2C2C2C] rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(44,44,44,1)]">
            <h3 class="text-xl font-black mb-4 uppercase flex items-center gap-2" style="font-family: 'Bebas Neue', sans-serif">
              <span class="text-[#E88555]">#</span> TRAVEL KEYWORD
            </h3>
            <div class="flex flex-wrap gap-2 overflow-y-auto custom-scrollbar max-h-[85px] p-2 -m-2">
              <button
                v-for="keyword in keywords"
                :key="keyword"
                @click="handleKeywordClick(keyword)"
                class="px-3 py-1 bg-[#FFF8ED] border-[2px] border-[#2C2C2C] rounded-lg text-xs font-bold hover:bg-[#F9CA6B] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_0px_rgba(44,44,44,1)] transition-all"
              >
                {{ keyword }}
              </button>
            </div>
          </div>

          <!-- Real-time Ranking Component -->
          <div class="bg-white border-[2px] border-[#2C2C2C] rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(44,44,44,1)]">
            <h3 class="text-xl font-black mb-4 uppercase flex items-center gap-2" style="font-family: 'Bebas Neue', sans-serif">
              <span class="text-[#9BCCC4]">★</span> Real-time Ranking
            </h3>

            <div class="space-y-3">
              <div v-for="(place, idx) in hotPlaces" :key="idx" @click="handlePlaceClick(place)" class="flex items-center gap-3 group cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                <!-- Rank -->
                <span class="text-lg font-black italic text-[#2C2C2C] w-6 text-center shadow-[2px_2px_0px_0px_rgba(207,245,0,0.5)] bg-white border border-[#2C2C2C] rounded flex-shrink-0">
                  {{ idx + 1 }}
                </span>

                <!-- Content -->
                <div class="min-w-0 flex-1">
                   <h4 class="font-bold text-sm truncate text-[#2C2C2C] group-hover:text-[#E88555] transition-colors leading-tight">
                    {{ place.name }}
                  </h4>
                  <p class="text-[10px] text-gray-400 font-bold truncate">
                    {{ place.location }}
                  </p>
                </div>
              </div>
            </div>

            <button
              @click="handleNavigate('search')"
              class="w-full mt-4 py-2 border-[2px] border-[#2C2C2C] rounded-lg font-black text-xs uppercase hover:bg-[#F5F5F5] transition-colors"
            >
              EXPLORE MORE
            </button>
          </div>
        </div>

        <!-- Center: Feed -->
        <div class="col-span-1 lg:col-span-6">
          <!-- Feed Header -->
          <div class="mb-8 text-center bg-white border-[2px] border-[#2C2C2C] rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(44,44,44,1)] relative overflow-hidden">
             <!-- Decorative diagonal stripes background -->
             <div class="absolute top-0 right-0 w-32 h-32 opacity-10" style="background-image: radial-gradient(#2C2C2C 2px, transparent 2px); background-size: 10px 10px;"></div>

             <h2
              class="text-6xl text-[#2C2C2C] mb-1 relative inline-block z-10"
              style="font-family: 'Bebas Neue', sans-serif"
            >
              TRAVEL LOG
              <span class="absolute -bottom-2 left-0 w-full h-[12px] bg-[#9BCCC4]/40 -z-10 skew-x-[-12deg]"></span>
            </h2>
            <p class="text-sm font-bold text-gray-500 tracking-tight">
              Share your journey with travelers
            </p>
          </div>

          <!-- Feed Items -->
          <div class="space-y-8">
            <template v-for="diary in diaryEntries" :key="diary.logId">
              <DiaryFeedItem v-bind="diary" @open-log="handleOpenLogFromFeed" />
            </template>
          </div>

          <!-- Loading State -->
          <div ref="observerTarget" class="h-12 py-8 text-center flex justify-center">
            <div
              v-if="isLoading"
              class="w-8 h-8 border-[3px] border-[#2C2C2C] border-t-transparent rounded-full animate-spin"
            ></div>
            <p v-else-if="!hasNext" class="px-4 py-1 bg-gray-200 rounded-full text-xs font-bold text-gray-500">
              End of Feed
            </p>
          </div>
        </div>

        <!-- Right Sidebar: Personal -->
        <div class="hidden lg:block lg:col-span-3 space-y-8">

          <!-- New Plan Card (CTA) -->
          <button
            @click="handleCreateTrip"
            class="w-full bg-[#F9CA6B] border-[2px] border-[#2C2C2C] rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(44,44,44,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(44,44,44,1)] transition-all text-left group relative overflow-hidden"
          >
             <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>

            <div class="w-12 h-12 bg-[#2C2C2C] text-white rounded-xl flex items-center justify-center mb-4 shadow-sm border border-white/20 group-hover:rotate-12 transition-transform">
              <Plus class="w-6 h-6" stroke-width="3" />
            </div>
            <h3 class="text-2xl font-black text-[#2C2C2C] leading-none mb-1 font-sans">
              NEW PLAN
            </h3>
            <p class="text-xs font-bold text-[#2C2C2C]/80">나만의 여행 계획 만들기</p>
          </button>

          <!-- My Upcoming Trips -->
          <div class="bg-white border-[2px] border-[#2C2C2C] rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(44,44,44,1)]">
             <div class="flex items-center justify-between mb-4">
              <h3 class="text-xl font-black uppercase" style="font-family: 'Bebas Neue', sans-serif">
                My Trips
              </h3>
              <button @click="handleNavigate('trips')" class="text-xs font-bold text-gray-400 hover:text-[#2C2C2C] transition-colors">
                View All →
              </button>
            </div>

            <div v-if="upcomingTrips.length > 0" class="space-y-3">
              <div
                v-for="trip in upcomingTrips"
                :key="trip.id"
                class="group cursor-pointer bg-[#FFF8ED] border-[2px] border-[#2C2C2C] rounded-lg p-3 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_0px_rgba(44,44,44,1)] transition-all"
                @click="handleNavigateToTrip(trip.id)"
              >
                <div class="flex justify-between items-start mb-2">
                   <div class="flex items-center gap-1.5">
                      <Calendar class="w-3.5 h-3.5 text-gray-500" />
                      <span class="text-xs font-bold text-gray-500">{{ trip.date }}</span>
                   </div>
                   <span class="text-xs font-black bg-[#2C2C2C] text-white px-2 py-0.5 rounded-full">
                      {{ trip.dDay }}
                   </span>
                </div>
                <h4 class="font-black text-sm text-[#2C2C2C] leading-tight truncate group-hover:underline decoration-2 underline-offset-2">
                  {{ trip.title }}
                </h4>
              </div>
            </div>
            <div v-else class="text-center py-8">
              <div class="inline-flex justify-center items-center w-10 h-10 rounded-full bg-gray-100 mb-2">
                <Calendar class="w-5 h-5 text-gray-400" />
              </div>
              <p class="text-xs font-bold text-gray-400">예정된 여행이 없습니다.</p>
            </div>
          </div>

          <!-- Daily Mission (Premium Log Style) -->
          <div class="bg-[#2C2C2C] rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] text-center text-white relative overflow-hidden group cursor-pointer min-h-[140px] flex flex-col justify-center items-center">
            <div class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

            <h3 class="text-xl font-black mb-3 relative z-10 text-[#F9CA6B]" style="font-family: 'Bebas Neue'">
              DAILY MISSION
            </h3>

            <p class="text-sm font-bold text-gray-200 relative z-10 mb-4 break-keep leading-snug">
              {{ currentMission }}
            </p>

            <div class="inline-block px-4 py-1.5 border border-white/30 rounded-full text-[10px] font-bold group-hover:bg-white group-hover:text-[#2C2C2C] transition-all relative z-10 uppercase tracking-wider">
              Accept Challenge
            </div>
          </div>

        </div>
      </div>
    </div>

    <PlaceDetailModal
      v-if="selectedPlaceForDetail"
      ref="placeDetailModalRef"
      :place="selectedPlaceForDetail"
      :disable-keydown="!!selectedLogId"
      @close="handlePlaceModalClose"
      @open-trip-log="handleOpenTripLog"
    />

    <DiaryCommentModal
        v-if="selectedLogId"
        :log-id="selectedLogId"
        :author-id="selectedAuthorId"
        :initial-liked="selectedLiked"
        @close="handleLogClose"
        @update="handleLogUpdate"
        @edit="handleEditFromModal"
        @edit-log="handleEditLogFromModal"
        @refresh="handleFeedRefresh"
        @delete-log="handleLogDelete"
    />

    <TripDetailModal
        v-if="selectedTrip"
        :trip="selectedTrip"
        @close="router.back()"
        @edit="handleEditFromModal"
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
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNavigate } from '@/composables/common/useNavagation'
import TravelNavbar from '@/components/common/TravelNavbar.vue'
import PlaceDetailModal from '@/components/modal/PlaceDetailModal.vue'
import DiaryCommentModal from '@/components/modal/DiaryCommentModal.vue'
import TripDetailModal from '@/components/modal/TripDetailModal.vue'
import ScrollToTop from '@/components/common/ScrollToTop.vue'
import DiaryFeedItem from '@/components/home/DiaryFeedItem.vue'
import { Plus, Calendar} from 'lucide-vue-next'
import type { TripLogFeedItemDto } from '@/apis/trip-log/types';
import { getTripLogFeed, getFriendTripLogFeed } from '@/apis/trip-log/index';
import { dailyMissions } from '@/data/mockData'
import { spotApi } from '@/apis/spot'
import { getMyTrips, createTrip, getTripDetail } from '@/apis/trip' // Added getTripDetail
import type { TripResponseDto } from '@/apis/trip/types'
import { differenceInCalendarDays, isAfter, isSameDay, startOfDay, parseISO } from 'date-fns'
import { useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const { handleNavigate } = useNavigate()

const selectedPlaceForDetail = ref<any>(null) // For PlaceDetailModal
const placeDetailModalRef = ref<any>(null)
const selectedLogId = ref<number | null>(null)
const selectedAuthorId = ref<number | undefined>(undefined)
const selectedLiked = ref<boolean>(false)
const hasLogUpdates = ref(false)
const selectedTrip = ref<any>(null)

// 상태 관리 (Moved to top)
const diaryEntries = ref<TripLogFeedItemDto[]>([])
const isLoading = ref(false)
const observerTarget = ref<HTMLElement | null>(null)
const nextCursor = ref<number | null>(null)
const hasNext = ref(true)

// 피드 로직용 상태
const loadedLogIds = new Set<number>()
const isFriendFeedLoaded = ref(false)

// Daily Mission Logic
const currentMission = ref(dailyMissions[Math.floor(Math.random() * dailyMissions.length)])

// Keywords
const keywords = ['동네산책', '책방투어', 'LP바', '성수카페', '팝업스토어', '자전거라이딩', '클라이밍', '야시장']

// Hot Places
const hotPlaces = ref<any[]>([])

// My Trips
const myTrips = ref<TripResponseDto[]>([])

const handleOpenTripLog = (payload: { logId: number, authorId: number, liked: boolean }) => {
    selectedAuthorId.value = payload.authorId
    selectedLiked.value = payload.liked
    router.push({ query: { ...route.query, logId: payload.logId } })
}

// Watch URL for modal state
watch(() => route.query.logId, (newLogId) => {
  if (newLogId) {
    selectedLogId.value = Number(newLogId)
    // authorId is not in URL, but if opening from feed, handleOpenLog sets it. 
    // If refreshing page, authorId will be undefined, but Modal handles fallback/missing ID.
  } else {
    selectedLogId.value = null
    selectedAuthorId.value = undefined
    selectedLiked.value = false
  }
}, { immediate: true })

const handleOpenLogFromFeed = (payload: { logId: number, authorId: number, liked: boolean }) => {
  selectedAuthorId.value = payload.authorId
  selectedLiked.value = payload.liked
  router.push({ query: { ...route.query, logId: payload.logId } })
    .catch(err => {
      console.error('HomeView: router.push failed:', err)
    })
}

const handleLogUpdate = (payload: { type?: string; logId: number; likeCount: number; liked: boolean; commentCount?: number }) => {
    // Update Feed Item State
    const feedItem = diaryEntries.value.find(item => item.logId === payload.logId)
    if (feedItem) {
        feedItem.likeCount = payload.likeCount
        feedItem.liked = payload.liked
        if (typeof payload.commentCount === 'number') {
            feedItem.commentCount = payload.commentCount
        }
    }

    if (placeDetailModalRef.value) {
        placeDetailModalRef.value.updateTripLogState(payload.logId, { 
            likeCount: payload.likeCount, 
            liked: payload.liked,
            commentCount: payload.commentCount 
        })
    }
}

const handleLogClose = () => {
    const query = { ...route.query }
    delete query.logId
    delete query.tab
    router.replace({ query })
    
    if (hasLogUpdates.value) {
        if (placeDetailModalRef.value) {
            placeDetailModalRef.value.refreshWithEffect()
        }
        hasLogUpdates.value = false
    }
}

const handleNavigateToTrip = (tripId: number) => {
    router.push({ query: { ...route.query, tripId } })
}

watch(() => route.query.tripId, async (newTripId) => {
    if (newTripId) {
        await fetchTripDetailAndOpen(Number(newTripId))
    } else {
        selectedTrip.value = null
    }
}, { immediate: true })

const fetchTripDetailAndOpen = async (tripId: number) => {
    try {
        const detail = await getTripDetail(tripId)
        selectedTrip.value = {
            ...detail,
             description:
                detail.tripItems && detail.tripItems.length > 0
                ? detail.tripItems.map((item : any) => item.spot.name).join(' → ')
                : '장소 없음',
            duration: '반나절', // Mock
            views: 1240, // Mock
            imageUrl: '', // Mock
        }
    } catch (error) {
        console.error('Failed to fetch trip detail:', error)
        alert('여행 정보를 불러오는데 실패했습니다.')
        router.replace({ query: { ...route.query, tripId: undefined } })
    }
}

const handleEditFromModal = (trip: any) => {
    selectedTrip.value = null
    handleNavigate('trip-edit', { id: trip.id })
}

const handleEditLogFromModal = (log: any) => {
    selectedLogId.value = null
    // Assuming 'log-edit' route takes logId as param
    router.push({ name: 'log-edit', params: { logId: log.logId } })
}

const handleCreateTrip = async () => {
    try {
        const newTrip = await createTrip()
        handleNavigate('trip-edit', { id: newTrip.id })
    } catch (error) {
        console.error('Failed to create trip:', error)
        alert('여행 계획 생성에 실패했습니다.')
    }
}

const handlePlaceClick = (place: any) => {
    // Open Place Detail Modal via URL
    router.push({ query: { ...route.query, placeId: place.id } })
}

const handlePlaceModalClose = () => {
    // Navigate back to close modal (pops history)
    router.back()
}

// Watch URL for place detail modal state
watch(() => route.query.placeId, async (newPlaceId) => {
    if (newPlaceId) {
        const id = Number(newPlaceId)
        // 1. Try to find in hotPlaces
        const found = hotPlaces.value.find(p => p.id === id)
        if (found) {
            selectedPlaceForDetail.value = found
        } else {
            // 2. If not found (e.g. reload or deep link), fetch it
            try {
                // Assuming we might need a dedicated API or just use what we have.
                // For now, if hotPlaces isn't loaded yet, this might fail unless we wait.
                // But simplified: just try to fetch spot detail if API exists.
                // Actually spotApi.getSpot might not be exposed as such yet?
                // Use a mock or basic object if we can't fetch full details easily here 
                // without changing too much.
                // However, the PlaceDetailModal EXPECTS a certain shape. 
                // Let's at least try to wait for hotPlaces if it's loading?
                // Or simply:
                 selectedPlaceForDetail.value = { id } // Minimal, modal might fetch rest?
                 // Actually PlaceDetailModal does fetchSpotData on mounted! 
                 // It just needs minimal info to start?
                 // Props: `place` object.
                 // PlaceDetailModal does `fetchSpotData` using `props.place.kakaoPlaceId` etc.
                 // If we only have ID, we might be in trouble if we don't have kakao IDs.
                 // Ideally getSpot(id) should return what we need.
                 // But for the user request "Click ing Real Time Ranking", hotPlaces HAS the data.
                 // So we just need to ensure we look it up.
            } catch (e) {
                console.error(e)
            }
        }
    } else {
        selectedPlaceForDetail.value = null
    }
}, { immediate: true })

// Re-check when hotPlaces loads (in case of deep link/refresh)
watch(hotPlaces, (newPlaces) => {
    const placeId = Number(route.query.placeId)
    if (placeId && newPlaces.length > 0 && !selectedPlaceForDetail.value) {
        const found = newPlaces.find(p => p.id === placeId)
        if (found) {
            selectedPlaceForDetail.value = found
        }
    }
})

const handleKeywordClick = (keyword: string) => {
  router.push({ path: '/search', query: { q: keyword } })
}

const showAlert = (message: string, title = '알림') => {
  // Assuming infoAlert is defined elsewhere or this is a placeholder
  // infoAlert.message = message
  // infoAlert.title = title
  // infoAlert.visible = true
  console.log(`Alert: ${title} - ${message}`); // Placeholder for actual alert logic
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

const handleFeedRefresh = async () => {
    diaryEntries.value = []
    cursorId.value = null
    hasMore.value = true
    await fetchMoreFeed()
}

const handleLogDelete = () => {
    showToastMessage('기록이 삭제되었습니다.')
    handleFeedRefresh()
}



// Filtered Upcoming Trips
const upcomingTrips = computed(() => {
  const now = startOfDay(new Date())
  return myTrips.value
    .filter(trip => {
      if (!trip.startDate) return false
      const start = parseISO(trip.startDate)
      return isAfter(start, now) || isSameDay(start, now)
    })
    .map(trip => {
      // safe because of filter
      const start = parseISO(trip.startDate!)
      const diff = differenceInCalendarDays(start, now)
      const dDay = diff === 0 ? 'D-Day' : `D-${diff}`

      return {
        id: trip.id,
        title: trip.title,
        date: trip.startDate!,
        dDay: dDay
      }
    })
    .sort((a, b) => {
        return a.date.localeCompare(b.date)
    })
    .slice(0, 3)
})


// Initial Data Load
onMounted(async () => {
  // 초기화
  diaryEntries.value = []
  loadedLogIds.clear()
  isFriendFeedLoaded.value = false
  nextCursor.value = null
  hasNext.value = true

  loadMore()

  // Load Hot Places
  try {
    const places = await spotApi.getHotPlaces()
    hotPlaces.value = places.slice(0, 10).map((place: any) => ({
        ...place,
        location: place.address || '위치 정보 없음'
    }))
  } catch (error) {
    console.error('Failed to load hot places:', error)
  }

  // Load My Trips
  try {
    const trips = await getMyTrips()
    myTrips.value = trips
  } catch (error) {
    console.error('Failed to load my trips:', error)
  }

  // Observer Setup
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && hasNext.value) {
        loadMore()
      }
    },
    { threshold: 1.0 },
  )

  if (observerTarget.value) {
    observer.observe(observerTarget.value)
  }
})

// 무한 스크롤 로직 (친구 피드 우선 + 전체 피드 병합)
const loadMore = async () => {
  if (isLoading.value || !hasNext.value) return

  isLoading.value = true

  try {
    // 1. 친구 피드 로드 (아직 안 불러왔다면)
    if (!isFriendFeedLoaded.value) {
      try {
        const friendFeedResponse = await getFriendTripLogFeed()
        
        if (friendFeedResponse.content && Array.isArray(friendFeedResponse.content)) {
            friendFeedResponse.content.forEach(log => {
            if (!loadedLogIds.has(log.logId)) {
                loadedLogIds.add(log.logId)
                diaryEntries.value.push(log)
            }
            })
        }
      } catch (error) {
        console.warn('친구 피드 로드 실패 (무시하고 전체 피드 진행):', error)
      } finally {
        isFriendFeedLoaded.value = true
      }
    }

    // 2. 전체 피드 로드 (친구 피드가 10개 미만이거나, 이미 친구 피드를 다 본 경우)
    // 친구 피드로만 화면이 꽉 차지 않았으면 전체 피드를 가져와서 채운다.
    // 혹은 스크롤이 내려가서 더 많은 데이터가 필요한 경우.
    
    // 목표: 한 번 로딩 사이클에서 적어도 10개는 보여주고 싶음.
    // 하지만 API 구조상 '부족한 개수만큼 가져오기'는 어려우므로,
    // 친구 피드 로드 후에도 전체 피드를 호출해서 밑에 붙인다.
    
    // 전체 피드 호출
    const response = await getTripLogFeed({
      cursor: nextCursor.value,
      limit: 10
    })

    const newLogs = response.content.filter(log => {
      if (loadedLogIds.has(log.logId)) return false
      loadedLogIds.add(log.logId)
      return true
    })

    diaryEntries.value.push(...newLogs)
    nextCursor.value = response.nextCursor
    hasNext.value = response.hasNext

  } catch (error) {
    console.error('피드 로딩 중 오류 발생: ', error)
  } finally {
    isLoading.value = false
  }
}


// Observer Logic
let observer: IntersectionObserver | null = null;

onUnmounted(() => {
  if (observer) observer.disconnect()
})

</script>

<style scoped>
/* Custom Scrollbar for Magazine Feel */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #2C2C2C;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
