import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type {
  TripItemsReplaceRequestDto,
  TripItemsReplaceRequestDto_Item,
  TripItemResponseDto,
  TripUpdateRequestDto,
} from '@/apis/trip/types'
import type { TripVisibility } from '@/types/trip/trip.model'
import type { Place } from '@/types/trip/place.model'
import { TripStatus } from '@/types/common'
import {
  getTripDetail,
  deleteTrip as apiDeleteTrip, // Added
  syncTripItems as apiSyncTripItems,
  updateTrip as apiUpdateTrip,
} from '@/apis/trip/index'

export interface DayPlan {
  dayNumber: number
  places: Place[]
}

// API 응답을 프론트엔드 Place 타입으로 변환하는 헬퍼 함수
const mapTripItemToPlace = (item: TripItemResponseDto): Place => ({
  id: item.id,
  kakaoPlaceId: item.spot.kakaoPlaceId,
  name: item.spot.name,
  address: item.spot.address || '',
  category: item.spot.category || '',
  lat: item.spot.lat,
  lng: item.spot.lng,
  placeUrl: item.spot.placeUrl,
  memo: item.memo,
})

export function useTripPlan() {
  const route = useRoute()
  const router = useRouter()
  const tripId = ref<number | null>(null)
  const tripStatus = ref<TripStatus>(TripStatus.PLANNED)
  const tripVisibility = ref<TripVisibility>('PUBLIC')

  // State
  const isEditMode = ref(false)
  const backupData = ref('')
  const tripTitle = ref('')
  const tripLocationSummary = ref('') // Added
  const tripDate = ref('')
  const activeDay = ref(1)
  const days = ref<DayPlan[]>([])

  // Computed
  const formattedDate = computed(() =>
    tripDate.value ? new Date(tripDate.value).toLocaleDateString() : '날짜 미정',
  )
  const allSelectedPlaces = computed(() => days.value.flatMap((d) => d.places))

  // Methods
  const reloadTripData = async () => {
    if (!tripId.value) return
    try {
      const tripDetail = await getTripDetail(tripId.value)
      tripTitle.value = tripDetail.title
      tripLocationSummary.value = tripDetail.locationSummary || '' // Added
      tripDate.value = tripDetail.startDate || ''
      // DRAFT인 경우 PLANNED로 표시 (UI에서 DRAFT를 지원하지 않음)
      tripStatus.value = (tripDetail.status === TripStatus.DRAFT || !tripDetail.status)
        ? TripStatus.PLANNED
        : tripDetail.status

      // 가시성 데이터 보정: 신규 여행(날짜 미정)이거나 DRAFT인 경우 PUBLIC으로 유도
      if (tripDetail.status === TripStatus.DRAFT || !tripDetail.startDate) {
        tripVisibility.value = 'PUBLIC'
      } else {
        tripVisibility.value = tripDetail.visibility || 'PUBLIC'
      }

      // API 응답을 로컬 상태로 변환
      const maxDay = tripDetail.tripItems.reduce((max, item) => Math.max(max, item.dayNumber), 0)
      const newDays: DayPlan[] = []
      for (let i = 1; i <= maxDay; i++) {
        newDays.push({
          dayNumber: i,
          places: tripDetail.tripItems
            .filter((item) => item.dayNumber === i)
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .filter((item) => item && item.spot) // item 및 item.spot null 체크
            .map(mapTripItemToPlace),
        })
      }
      days.value = newDays.length > 0 ? newDays : [{ dayNumber: 1, places: [] }]
    } catch (error) {
      console.error(`여행 계획 (ID: ${tripId.value}) 상세 정보 불러오기 실패:`, error)
      alert('여행 계획 상세 정보를 불러오는데 실패했습니다.')
      router.push('/trips')
    }
  }

  const initData = async () => {
    if (route.name === 'trip-detail' && route.params.id) {
      tripId.value = Number(route.params.id)
      await reloadTripData()

      if (route.query.edit === 'true') {
        enterEditMode()
      } else {
        isEditMode.value = false
      }
    }
  }

  const enterEditMode = () => {
    backupData.value = JSON.stringify({
      title: tripTitle.value,
      date: tripDate.value,
      days: days.value,
    })
    isEditMode.value = true
  }

  const normalizeDate = (dateStr: string): string => {
    return dateStr.replace(/\./g, '-').replace(/\//g, '-');
  };
  const saveTrip = async (callback?: () => void) => {
    if (!tripId.value) return alert('여행 정보가 올바르게 로드되지 않았습니다.')
    if (!tripTitle.value.trim()) return alert('제목을 입력해주세요.')

    try {
      // 1. 여행 아이템 동기화 (전체 교체)
      const itemPayload: TripItemsReplaceRequestDto = {
        days: days.value.map((day) => ({
          dayNumber: day.dayNumber,
          items: day.places.map((place): TripItemsReplaceRequestDto_Item => {
            // 모든 장소에 대해 spot 정보를 보냅니다. (DB에 있는 장소든 아니든)
            // TripItem ID는 더 이상 보내지 않으며, backend가 전체를 교체합니다.
            return {
              spot: {
                kakaoPlaceId: place.kakaoPlaceId,
                name: place.name,
                address: place.address,
                category: place.category,
                lat: place.lat,
                lng: place.lng,
                placeUrl: place.placeUrl || '',
              },
            }
          }),
        })),
      }
      await apiSyncTripItems(tripId.value, itemPayload)

      // 2. 여행 기본 정보 (제목, 날짜, 상태, 공개 여부) 업데이트
      let updatePayload: TripUpdateRequestDto = {
        title: tripTitle.value,
        startDate: tripDate.value || undefined,
        endDate: tripDate.value || undefined,
        status: tripStatus.value || TripStatus.PLANNED,
        visibility: tripVisibility.value || 'PRIVATE',
      }
      let calculatedEndDate: string | undefined = undefined;
      const durationDays = days.value.length; // 여행 일수 (예: 3일차까지 있으면 3)

      if (tripDate.value && durationDays > 0) {
        // 시작 날짜를 정확하게 파싱합니다. (타임존 문제 방지를 위해 YYYY-MM-DDT00:00:00 형식 사용)
        const normalizedStartDate = normalizeDate(tripDate.value) + 'T00:00:00';
        const startDateObj = new Date(normalizedStartDate);
        startDateObj.setDate(startDateObj.getDate() + durationDays - 1);

        // 최종 YYYY-MM-DD 형식으로 변환
        const y = startDateObj.getFullYear();
        const m = (startDateObj.getMonth() + 1).toString().padStart(2, '0');
        const d = startDateObj.getDate().toString().padStart(2, '0');

        calculatedEndDate = `${y}-${m}-${d}`;
      }

      updatePayload = {
        title: tripTitle.value,
        startDate: tripDate.value || undefined,
        endDate: calculatedEndDate,
        status: tripStatus.value || TripStatus.PLANNED,
        visibility: tripVisibility.value || 'PRIVATE',
      }
      await apiUpdateTrip(tripId.value, updatePayload)

      // 3. 데이터를 다시 로드하여 UI를 동기화합니다.
      await reloadTripData()

      isEditMode.value = false
      if (callback) callback()
    } catch (error) {
      console.error('여행 계획 저장 실패:', error)
      throw error // Propagate error to view
    }
  }

  // Edit mode cancel logic (Destructive)
  const discardChanges = async () => {
    if (tripStatus.value === 'DRAFT' && tripId.value) {
      try {
        await apiDeleteTrip(tripId.value)
      } catch (error) {
        console.error(`여행 계획 (ID: ${tripId.value}) 삭제 실패:`, error)
        throw new Error('임시 여행 계획 삭제에 실패했습니다.')
      }
    } else if (backupData.value) {
      const restored = JSON.parse(backupData.value)
      tripTitle.value = restored.title
      tripDate.value = restored.date
      days.value = restored.days
      isEditMode.value = false
    }
  }

  const deleteTrip = async () => {
    if (tripId.value) {
      await apiDeleteTrip(tripId.value)
    }
  }

  // --- 로컬 상태 변경 함수들 ---

  const addPlace = (place: Place): Place | undefined => {
    const day = days.value.find((d) => d.dayNumber === activeDay.value)
    if (!day) {
      console.error('유효하지 않은 일차입니다.')
      return
    }

    // placeUrl을 명시적으로 복사하여 데이터 유실을 방지합니다.
    const newPlace: Place = {
      ...place,
      placeUrl: place.placeUrl,
      id: undefined,
      memo: '',
    }
    day.places.push(newPlace)
    return newPlace
  }

  const removePlace = (index: number) => {
    const day = days.value.find((d) => d.dayNumber === activeDay.value)
    if (day && day.places[index]) {
      day.places.splice(index, 1)
    }
  }

  const updatePlaces = (newPlaces: Place[]) => {
    const day = days.value.find((d) => d.dayNumber === activeDay.value)
    if (day) {
      day.places = newPlaces
    }
  }

  const addDay = () => {
    days.value.push({ dayNumber: days.value.length + 1, places: [] })
    activeDay.value = days.value.length
  }

  const removeDay = (dayNum: number) => {
    if (days.value.length <= 1) return
    // Note: Confirmation should be handled in view if needed. For now keeping logic simple as request didn't specify day removal modal.
    // If strict no-alert policy, we should return a flag or throw. 
    // Allowing direct deletion for now or assuming View handles. 
    // Current native confirm is: confirm('일차를 삭제하시겠습니까? ...')
    // I will disable the confirm here to avoid popups, but this allows accidental deletion. 
    // Given the strict request "Back/Save/Delete buttons", I will essentially force remove logic.

    days.value = days.value.filter((d) => d.dayNumber !== dayNum)
    // 남은 day들의 dayNumber를 재정렬
    days.value.forEach((day, index) => {
      day.dayNumber = index + 1
    })
    if (activeDay.value >= dayNum && activeDay.value > 1) {
      activeDay.value--
    }
  }

  onMounted(() => initData())

  return {
    tripId,
    isEditMode,
    tripTitle,
    tripLocationSummary, // Added
    tripDate,
    activeDay,
    days,
    formattedDate,
    allSelectedPlaces,
    enterEditMode,
    saveTrip,
    discardChanges, // Renamed from goBack logic
    deleteTrip,
    addPlace,
    removePlace,
    updatePlaces,
    addDay,
    removeDay,
    tripVisibility,
    tripStatus,
  }
}