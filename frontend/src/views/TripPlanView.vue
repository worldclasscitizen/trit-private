<template>
  <div class="min-h-screen bg-[#F5F5F5] h-screen flex flex-col font-sans">
    <TripPlanHeader
      :trip-title="trip.tripTitle.value"
      :location-summary="trip.tripLocationSummary.value"
      :trip-date="trip.tripDate.value"
      :formatted-date="trip.formattedDate.value"
      :is-edit-mode="trip.isEditMode.value"
      :total-places-count="trip.allSelectedPlaces.value.length"
      :trip-status="trip.tripStatus.value"
      :trip-visibility="trip.tripVisibility.value"
      @update:trip-title="trip.tripTitle.value = $event"
      @update:trip-date="trip.tripDate.value = $event"
      @update:trip-status="trip.tripStatus.value = $event"
      @update:trip-visibility="trip.tripVisibility.value = $event"
      @back="handleBack"
      @save="handleSave"
      @delete="handleDelete"
      @edit="trip.enterEditMode"
    />

    <div class="flex-1 flex overflow-hidden relative z-10">
      <TripPlanPanel
        :style="{ width: `${panelWidth}px` }"
        :days="trip.days.value"
        :active-day="trip.activeDay.value"
        :is-edit-mode="trip.isEditMode.value"
        :search-query="searchQuery"
        @update:search-query="searchQuery = $event"
        @update:active-day="trip.activeDay.value = $event"
        @search="mapInteraction.triggerSearch"
        @add-day="trip.addDay"
        @remove-day="trip.removeDay"
        @remove-place="trip.removePlace"
        @update-places="trip.updatePlaces"
        @click-place="showDetailAndPan"
      />

      <div
        v-if="trip.isEditMode.value"
        class="w-[6px] -ml-[3px] z-30 cursor-col-resize flex items-center justify-center hover:bg-[#9BCCC4] transition-colors opacity-0 hover:opacity-100 active:opacity-100 active:bg-[#9BCCC4]"
        @mousedown="startResize"
      >
        <div class="flex flex-col gap-[2px]">
          <div class="w-[3px] h-[3px] rounded-full bg-[#2C2C2C]"></div>
          <div class="w-[3px] h-[3px] rounded-full bg-[#2C2C2C]"></div>
          <div class="w-[3px] h-[3px] rounded-full bg-[#2C2C2C]"></div>
        </div>
      </div>

      <TripSearchListPanel
        v-if="isSearchPanelOpen"
        :results="searchResults"
        :is-loading="isSearching"
        :selected-id="mapInteraction.selectedMarkerId.value"
        @close="closeSearchPanel"
        @add-place="handleAddPlace"
        @click-item="showDetailAndPan"
      />

      <div class="flex-1 flex flex-col bg-gray-100">
        <div class="flex-1 relative">
          <KakaoMap
            ref="kakaoMapRef"
            class="absolute inset-0"
            :center="mapCenter"
            :level="5"
            :show-plan-line="true"
            :markers="mapInteraction.markerPositions.value"
            :selected-marker-id="mapInteraction.selectedMarkerId.value"
            @marker-click="showDetailAndPanFromMarker"
            @map-move="mapInteraction.onMapMove"
          />

          <div
            v-if="mapInteraction.showReSearchButton.value"
            class="absolute top-6 left-1/2 -translate-x-1/2 z-20 animate-fade-in-up"
          >
            <button
              @click="mapInteraction.triggerSearch"
              class="flex items-center gap-2 px-4 py-2.5 bg-white border-[2px] border-[#2C2C2C] rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.15)] hover:bg-gray-50 active:scale-95 transition-all text-xs font-black text-[#2C2C2C]"
            >
              <RotateCw class="w-3.5 h-3.5" stroke-width="2.5" />
              현 지도에서 재검색
            </button>
          </div>
        </div>

        <PlaceDetailPanel
          :place="selectedPlaceForDetail"
          @close="selectedPlaceForDetail = null"
          @open-detail="handleOpenPlaceDetailModal"
        />
      </div>
    </div>
    
    <!-- Place Detail Modal -->
    <PlaceDetailModal 
        v-if="showPlaceDetailModal && detailedPlace" 
        :place="detailedPlace" 
        @close="showPlaceDetailModal = false" 
    />

    <!-- AI Chatbot Floating Button -->
    <TripAiChat 
      :fetch-candidates="fetchCandidates" 
      :highlight-candidate="highlightCandidate"
      :trip-title="trip.tripTitle.value"
      :formatted-date="trip.formattedDate.value"
      :all-selected-places="trip.allSelectedPlaces.value"
      :search-results="searchResults"
      @search-spot="handleChatSpotSearch"
    />

    <AlertDialog
        :show="dialogState.show"
        :title="dialogState.title"
        :message="dialogState.message"
        :confirm-button-text="dialogState.confirmButtonText"
        :show-cancel-button="dialogState.showCancelButton"
        @close="closeDialog"
        @confirm="handleDialogConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { RotateCw } from 'lucide-vue-next'
import KakaoMap from '@/components/common/KakaoMap.vue'
import TripPlanHeader from '@/components/trip/TripPlanHeader.vue'
import TripPlanPanel from '@/components/trip/TripPlanPanel.vue'
import TripSearchListPanel from '@/components/trip/TripSearchListPanel.vue'
import PlaceDetailPanel from '@/components/trip/PlaceDetailPanel.vue'
import PlaceDetailModal from '@/components/modal/PlaceDetailModal.vue'
import type { Place } from '@/types/trip/place.model'

// Import Composables
import { useResizablePanel } from '@/composables/common/useResizablePanel'
import { usePlaceSearch } from '@/composables/trip/usePlaceSearch'
import { useTripPlan } from '@/composables/trip/useTripPlan'
import { useMapInteraction } from '@/composables/trip/useMapInteraction'
import TripAiChat from '@/components/trip/TripAiChat.vue' // [NEW]

// 1. 패널 리사이징 로직
const initialPanelWidth = 300
const { width: panelWidth, startResize } = useResizablePanel({
  initialWidth: initialPanelWidth,
  minWidth: 200,
  maxWidth: 300
})

// [NEW] AI 추천을 위한 주변 후보 장소 검색 (Frontend Kakao SDK 사용)
// 다양한 카테고리 검색 (관광지, 문화시설, 음식점, 카페, 공원)
const fetchCandidates = async (): Promise<any[]> => {
  return new Promise((resolve) => {
    if (!kakaoMapRef.value?.map || !(window as any).kakao?.maps?.services) {
      resolve([])
      return
    }

    const map = kakaoMapRef.value.map
    const center = map.getCenter()
    const ps = new (window as any).kakao.maps.services.Places()

    // 검색할 카테고리 코드 목록 (다양하게)
    const categories = ['AT4', 'CT1', 'FD6', 'CE7', 'PK6'] 
    
    // Store results per category
    const categoryResults: Record<string, any[]> = {}
    let completedCount = 0

    categories.forEach(category => {
      ps.categorySearch(category, (data: any[], status: any) => {
        if (status === (window as any).kakao.maps.services.Status.OK) {
           categoryResults[category] = data
        } else {
           categoryResults[category] = []
        }
        completedCount++
        
        if (completedCount === categories.length) {
          // Flatten results: taking top 15 from each category to ensure diversity
          const combinedResults: any[] = []
          categories.forEach(cat => {
             const items = categoryResults[cat] || []
             combinedResults.push(...items.slice(0, 15))
          })

          const uniqueMap = new Map()
          combinedResults.forEach(item => {
             if (!uniqueMap.has(item.id)) {
                uniqueMap.set(item.id, item)
             }
          })
          
          const uniqueResults = Array.from(uniqueMap.values())
          
          resolve(uniqueResults.map((item: any) => ({
             id: item.id, // For map linking
             name: item.place_name,
             category: item.category_group_name || '기타',
             address: item.road_address_name || item.address_name,
             lat: item.y,
             lng: item.x,
             placeUrl: item.place_url
          })))
        }
      }, {
        location: center,
        radius: 2000, 
        sort: (window as any).kakao.maps.services.SortBy.DISTANCE
      })
    })
  })
}

const highlightCandidate = (candidate: any) => {
  if (candidate && candidate.lat && candidate.lng) {
     // 1. 마커를 표시하기 위해 검색 결과에 추가 (기존 검색 결과 덮어씌움)
     searchResults.value = [candidate]
     isSearchPanelOpen.value = true // 마커 표시 트리거

     // 2. 하단 상세 패널 열기 및 지도 이동
     showDetailAndPan(candidate)
  }
}

// 2. 검색 로직
const {
  searchQuery,
  searchResults,
  isSearching,
  isSearchPanelOpen,
  searchPlaces,
  closeSearchPanel,
} = usePlaceSearch()

// 3. 여행 데이터 로직
const trip = useTripPlan()

watch(() => trip.isEditMode.value, (newVal) => {
    if (!newVal) {
        panelWidth.value = initialPanelWidth
    }
})

// 4. [NEW] 지도 인터랙션 로직 (위의 상태들을 주입해서 연결)
const mapInteraction = useMapInteraction({
  searchResults,
  allSelectedPlaces: trip.allSelectedPlaces,
  searchQuery,
  isSearchPanelOpen,
  searchPlaces,
  activeDay: trip.activeDay, // activeDay 추가
  days: trip.days, // days 추가
})

// 템플릿에서 ref를 쓰기 위해 꺼내줌 (구조분해 해도 되지만, mapInteraction.xxx로 쓰는 게 출처가 명확함)
// 단, ref="kakaoMapRef" 연결을 위해 이것만 별도로 꺼내줍니다.
const { kakaoMapRef } = mapInteraction

const selectedPlaceForDetail = ref<Place | null>(null)
const showPlaceDetailModal = ref(false)
const detailedPlace = ref<Place | null>(null)

// Helper to find a place from any list by its ID (trip item ID or kakaoPlaceId)
const mapCenter = ref({ lat: 37.5443, lng: 127.0557 })

const findPlaceById = (id: number | string): Place | undefined => {
  // Combine search results and all planned places into one array
  const allPlaces = [...searchResults.value, ...trip.allSelectedPlaces.value]
  // Find the place that matches either the trip item ID or the Kakao Place ID
  return allPlaces.find((p) => p.id === id || p.kakaoPlaceId === id)
}

// Wrapper for place/item clicks to show detail panel and pan map with offset
const showDetailAndPan = (place: Place) => {
  selectedPlaceForDetail.value = place
  mapInteraction.handlePlaceClick(place, { panWithOffset: true })
}

// Wrapper for marker clicks to find place data, show panel, and pan map with offset
const showDetailAndPanFromMarker = (id: number | string) => {
  const place = findPlaceById(id)
  if (place) {
    selectedPlaceForDetail.value = place
    mapInteraction.handleMarkerClick(id, { panWithOffset: true })
  } else {
    mapInteraction.handleMarkerClick(id)
  }
}

const handleAddPlace = (place: Place) => {
  const newPlace = trip.addPlace(place)
  if (newPlace) {
    showDetailAndPan(newPlace)
  }
}

// Handler for opening full detail modal from the side panel
const handleOpenPlaceDetailModal = (place: Place) => {
    detailedPlace.value = place
    showPlaceDetailModal.value = true
}

// Ai Chat Search Handler
const handleChatSpotSearch = (keyword: string) => {
  searchQuery.value = keyword
  isSearchPanelOpen.value = true
  mapInteraction.triggerSearch()
}

// --- Dialog Logic ---
import AlertDialog from '@/components/common/AlertDialog.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const dialogState = ref({
    show: false,
    title: '알림',
    message: '',
    confirmButtonText: '확인',
    showCancelButton: false,
    onConfirm: () => {},
})

const closeDialog = () => {
    dialogState.value.show = false
}

const handleDialogConfirm = () => {
    dialogState.value.onConfirm()
    closeDialog()
}

const showAlert = (message: string, title = '알림', onConfirm?: () => void) => {
    dialogState.value = {
        show: true,
        title,
        message,
        confirmButtonText: '확인',
        showCancelButton: false,
        onConfirm: onConfirm || (() => {}),
    }
}

const showConfirm = (message: string, onConfirm: () => void, title = '확인') => {
     dialogState.value = {
        show: true,
        title,
        message,
        confirmButtonText: '확인',
        showCancelButton: true,
        onConfirm,
    }
}


// --- Action Handlers (Replaces direct composable calls) ---

const handleSave = async () => {
  try {
     await trip.saveTrip(closeSearchPanel)
     showAlert('저장되었습니다!')
  } catch (error: any) {
     const message = error.message || '저장에 실패했습니다.'
     showAlert(message)
  }
}

const handleBack = () => {
  if (trip.isEditMode.value) {
    showConfirm('작성을 취소하시겠습니까? \n 변경사항이 저장되지 않습니다.', async () => {
       const wasDraft = trip.tripStatus.value === 'DRAFT' || trip.tripStatus.value === undefined;
       await trip.discardChanges() 
       closeSearchPanel()
       
       if (wasDraft) {
           router.back()
       }
    })
  } else {
    router.back()
  }
}

const handleDelete = () => {
   showConfirm('정말 삭제하시겠습니까?', async () => {
      try {
        await trip.deleteTrip()
        showAlert('삭제되었습니다.', '알림', () => {
           router.push('/trips')
        })
      } catch (error: any) {
        showAlert('삭제에 실패했습니다.')
      }
   })
}

</script>

<style scoped>

.font-sans {
  font-family: 'Outfit', sans-serif;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translate(-50%, 10px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out forwards;
}
</style>