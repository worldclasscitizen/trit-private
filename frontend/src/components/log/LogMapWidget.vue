<script setup lang="ts">
import { ref, watch, type PropType } from 'vue'
import KakaoMap from '@/components/common/KakaoMap.vue'
import type { UserCompletedTripDetailDto } from '@/apis/user/types'

// --- TYPES ---
interface LegendTrip { 
  tripId: number
  tripTitle: string
  startDate: string
  endDate: string
  color?: string
}

interface TripPath {
  path: { lat: number; lng: number }[]
  color?: string
}

interface TripMarker {
  lat: number
  lng: number
  name: string
  color?: string
  type: 'plan'
  // ⭐ 핵심 수정: 마커가 속한 여행 ID를 추가
  tripId: number 
}

// --- PROPS ---
const props = defineProps({
  completedTrips: {
    type: Array as PropType<UserCompletedTripDetailDto[]>,
    required: true
  }
})

// --- REFS ---
const colors: string[] = [
  '#E6194B', '#3CB44B', '#FFE119', '#4363D8', '#F58231',
  '#911EB4', '#46F0F0', '#F032E6', '#BCF60C', '#FABEBE',
  '#008080', '#E6BEFF', '#9A6324', '#FFFAC8', '#800000',
  '#AAFFC3', '#808000', '#FFD8B1', '#000075', '#808080'
]

const legendDays = ref<LegendTrip[]>([])
const tripPaths = ref<TripPath[]>([])
const tripMarkers = ref<TripMarker[]>([])
const mapCenter = ref({ lat: 37.5665, lng: 126.9780 })
const tripColorMap = new Map<number, string>()

const getTripColor = (tripId: number) => {
  if (!tripColorMap.has(tripId)) {
    const color = colors[tripColorMap.size % colors.length]!
    tripColorMap.set(tripId, color)
  }
  return tripColorMap.get(tripId)
}

// --- TRIP LOGIC ---
watch(
  () => props.completedTrips,
  (newTrips) => {
    if (!newTrips || newTrips.length === 0) {
      legendDays.value = []
      tripPaths.value = []
      tripMarkers.value = []
      return
    }

    const sortedTrips = newTrips.slice()
      .sort((a, b) => new Date(b.endDate || b.startDate || 0).getTime() - new Date(a.endDate || a.startDate || 0).getTime())

    const tripsToDisplay = sortedTrips.slice(0, 3)

    const newLegendTrips: LegendTrip[] = []
    const newTripPaths: TripPath[] = []
    const newTripMarkers: TripMarker[] = []
    const allDrawablePlaces: { lat: number; lng: number }[] = []

    tripsToDisplay.forEach(trip => {
      const tripColor = getTripColor(trip.id)
      const sortedItems = trip.tripItems.sort((a, b) => a.dayNumber - b.dayNumber || a.orderIndex - b.orderIndex)
      
      const path: { lat: number; lng: number }[] = []
      sortedItems.forEach(item => {
        newTripMarkers.push({
          lat: item.spot.lat,
          lng: item.spot.lng,
          name: item.spot.name,
          color: tripColor,
          type: 'plan',
          // ⭐ 수정 반영: tripId를 마커 데이터에 포함
          tripId: trip.id
        })
        path.push({ lat: item.spot.lat, lng: item.spot.lng })
      })

      if (path.length > 1) newTripPaths.push({ path, color: tripColor })
      if (path.length >= 1) allDrawablePlaces.push(...path)

      newLegendTrips.push({
        tripId: trip.id,
        tripTitle: trip.title,
        startDate: trip.startDate || '',
        endDate: trip.endDate || '',
        color: tripColor
      })
    })

    legendDays.value = newLegendTrips
    tripPaths.value = newTripPaths
    tripMarkers.value = newTripMarkers

    // 지도 중앙점 초기 계산
    const placesForCenter = allDrawablePlaces.length > 0 ? allDrawablePlaces : newTripMarkers
    if (placesForCenter.length > 0) {
      const avgLat = placesForCenter.reduce((sum, p) => sum + p.lat, 0) / placesForCenter.length
      const avgLng = placesForCenter.reduce((sum, p) => sum + p.lng, 0) / placesForCenter.length
      mapCenter.value = { lat: avgLat, lng: avgLng }
    }
  },
  { immediate: true, deep: true }
)

const mapLevel = ref<number>(8) 
// --- MAP FOCUS LOGIC ---
const focusTripOnMap = (tripId: number) => {
  const tripMarkersForThis = tripMarkers.value.filter(m => m.tripId === tripId) 
  
  if (tripMarkersForThis.length === 0) {
    console.warn(`Trip ID ${tripId} has no markers to focus on.`)
    return
  }
  
  // 중앙점 계산
  const avgLat = tripMarkersForThis.reduce((sum, m) => sum + m.lat, 0) / tripMarkersForThis.length
  const avgLng = tripMarkersForThis.reduce((sum, m) => sum + m.lng, 0) / tripMarkersForThis.length

  // 맵 중앙점 업데이트 -> KakaoMap 컴포넌트로 전달됨
  mapCenter.value = { lat: avgLat, lng: avgLng }
  mapLevel.value = 5
  console.log(mapCenter.value)
}




</script>

<template>
  <div class="bg-white border-[4px] border-[#2C2C2C] rounded-[30px] p-6 shadow-[0px_4px_0px_0px_rgba(44,44,44,1)]">
    <div class="flex justify-between items-center mb-3 px-2">
      <h2 class="font-black text-xl text-[#2C2C2C]">TRAVEL MAP</h2>
      <span class="text-sm font-semibold text-gray-600">{{ props.completedTrips.length }} trips</span>
    </div>

    <div class="w-full h-64 rounded-lg overflow-hidden border-2 border-[#2C2C2C]">
      <KakaoMap
        :center="mapCenter"
        :level="mapLevel" :polylines="tripPaths"
        :markers="tripMarkers"
        :is-clickable="false"
        :show-plan-line="false"
      />
    </div>

    <div class="mt-4 space-y-2 px-2">
      <h3 class="text-sm font-black text-[#2C2C2C] mb-2 px-1">최근 다녀온 여행</h3>
      <div v-if="props.completedTrips.length === 0" class="text-sm text-center text-gray-500 py-4">
        완료된 여행 기록이 없습니다.
      </div>

      <div 
        v-for="trip in legendDays" 
        :key="trip.tripId" 
        class="flex items-center py-1 cursor-pointer hover:bg-[#9BCCC4] hover:rounded-lg transition-all px-1 -mx-1" 
        @click="focusTripOnMap(trip.tripId)"
      >
        <div class="w-3 h-3 rounded-full mr-3 flex-shrink-0" :style="{ backgroundColor: trip.color }"></div>
        <div class="truncate">
          <span class="font-bold mr-2">{{ trip.tripTitle }}</span>
          <span class="text-gray-500">- {{ trip.startDate }} ~ {{ trip.endDate }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>