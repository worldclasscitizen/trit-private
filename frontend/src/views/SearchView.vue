<template>
  <div class="min-h-screen bg-[#F5F5F5]">
    <TravelNavbar current-page="search" @navigate="handleNavigate" />

    <div class="pt-28 max-w-[1440px] mx-auto px-12 py-12">
      <!-- Search Section -->
      <div class="mb-12 mt-8 max-w-[900px] mx-auto">
        <div class="mb-6">
          <h2
            class="text-5xl font-black tracking-tighter uppercase"
            style="font-family: 'Outfit', sans-serif"
          >
            Discover <span class="text-[#9BCCC4]">Places</span>
          </h2>
        </div>

        <!-- Search Bar -->
        <div class="flex gap-3 mb-6">
          <div class="flex-1 relative">
            <div class="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <Search :size="20" :stroke-width="2" class="text-gray-400" />
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="인기 여행지와 추천 키워드로 새로운 여행을 시작해보세요"
              @keypress.enter="handleSearch"
              class="w-full pl-14 pr-6 py-5 bg-white border-[2px] border-[#2C2C2C] rounded-2xl text-base font-bold focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(44,44,44,0.2)] transition-all placeholder:font-medium placeholder:text-gray-400"
            />
          </div>
          <button
            @click="handleSearch"
            class="px-10 py-5 bg-[#2C2C2C] text-white border-[2px] border-[#2C2C2C] rounded-2xl font-black text-base hover:shadow-[3px_3px_0px_0px_rgba(44,44,44,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all active:shadow-[1px_1px_0px_0px_rgba(44,44,44,1)] active:translate-x-[1px] active:translate-y-[1px] uppercase"
          >
            검색
          </button>
        </div>

        <!-- Popular Search Keywords (검색 전에만 표시) -->
        <div v-if="!hasSearched">
          <p class="text-sm font-bold text-gray-600 mb-3">인기 검색어</p>
          <div class="flex flex-wrap gap-2.5">
            <button
              v-for="(keyword, index) in recommendedKeywords"
              :key="index"
              @click="searchByKeyword(keyword)"
              class="px-5 py-2.5 bg-[#FFF8ED] border-[2px] border-[#2C2C2C] rounded-full text-sm font-black hover:bg-[#F9CA6B] hover:shadow-[3px_3px_0px_0px_rgba(44,44,44,0.15)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all active:shadow-[1px_1px_0px_0px_rgba(44,44,44,0.1)] active:translate-x-[1px] active:translate-y-[1px]"
            >
              {{ keyword }}
            </button>
          </div>
        </div>
      </div>

      <!-- Search Results Section -->
      <div v-if="hasSearched" class="max-w-[900px] mx-auto mb-12">
        <!-- Search Query Display -->
        <div class="mb-6">
          <h3 class="text-2xl font-black mb-2">
            '<span class="text-[#9BCCC4]">{{ currentSearchQuery }}</span
            >' 검색 결과
          </h3>
          <p class="text-sm font-bold text-gray-600">
            총 {{ totalResultsCount }}개의 결과를 찾았습니다
          </p>
        </div>

        <!-- Tabs -->
        <div class="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'px-4 py-2 rounded-lg transition-all text-sm font-black whitespace-nowrap focus:outline-none border-[2px]',
              activeTab === tab.id
                ? 'bg-[#2C2C2C] text-white border-[#2C2C2C]'
                : 'bg-white text-gray-600 border-gray-300 hover:border-[#2C2C2C]',
            ]"
          >
            {{ tab.label }} ({{ getTabCount(tab.id) }})
          </button>
        </div>

        <!-- Results Content -->
        <div class="space-y-4">
          <!-- All Tab or Places Tab -->
          <template v-if="activeTab === 'all' || activeTab === 'places'">
            <div v-if="filteredPlaces.length > 0 || (activeTab === 'all' && totalResultsCount > 0)">
              <div class="flex items-center justify-between mb-4">
                <h4 v-if="activeTab === 'all'" class="text-xl font-black uppercase tracking-tight">
                  PLACE
                </h4>
                <button
                  v-if="activeTab === 'all'"
                  @click="activeTab = 'places'"
                  class="text-sm font-bold text-gray-500 hover:text-[#2C2C2C] transition-colors"
                >
                  + 더보기
                </button>
              </div>
              <div v-if="filteredPlaces.length > 0" class="space-y-3">
                <SearchPlaceItem
                  v-for="(place, index) in activeTab === 'all'
                    ? filteredPlaces.slice(0, 3)
                    : filteredPlaces"
                  :key="place.id"
                  :place="place"
                  @click="handlePlaceClick(place, index)"
                />
              </div>
              <div v-else class="text-center py-8 text-gray-400 font-bold text-sm bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  검색 결과가 없습니다.
              </div>
            </div>
          </template>

          <!-- All Tab or Trips Tab -->
          <template v-if="activeTab === 'all' || activeTab === 'trips'">
            <div v-if="filteredTrips.length > 0 || (activeTab === 'all' && totalResultsCount > 0)" :class="{ 'mt-8': activeTab === 'all' }">
              <div class="flex items-center justify-between mb-4">
                <h4 v-if="activeTab === 'all'" class="text-xl font-black uppercase tracking-tight">
                  TRIP
                </h4>
                <button
                  v-if="activeTab === 'all'"
                  @click="activeTab = 'trips'"
                  class="text-sm font-bold text-gray-500 hover:text-[#2C2C2C] transition-colors"
                >
                  + 더보기
                </button>
              </div>
              <div v-if="filteredTrips.length > 0" class="space-y-3">
                <SearchTripItem
                  v-for="trip in activeTab === 'all'
                    ? filteredTrips.slice(0, 3)
                    : filteredTrips"
                  :key="trip.trip_id"
                  :trip="trip"
                  @click="handleTripClick(trip)"
                />
              </div>
              <div v-else class="text-center py-8 text-gray-400 font-bold text-sm bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  검색 결과가 없습니다.
              </div>
            </div>
          </template>

          <!-- All Tab or Logs Tab -->
          <template v-if="activeTab === 'all' || activeTab === 'logs'">
            <div v-if="filteredLogs.length > 0 || (activeTab === 'all' && totalResultsCount > 0)" :class="{ 'mt-8': activeTab === 'all' }">
              <div class="flex items-center justify-between mb-4">
                <h4 v-if="activeTab === 'all'" class="text-xl font-black uppercase tracking-tight">
                  LOG
                </h4>
                <button
                  v-if="activeTab === 'all'"
                  @click="activeTab = 'logs'"
                  class="text-sm font-bold text-gray-500 hover:text-[#2C2C2C] transition-colors"
                >
                  + 더보기
                </button>
              </div>
              <div v-if="filteredLogs.length > 0" class="space-y-3">
                <SearchLogItem
                  v-for="log in activeTab === 'all'
                    ? filteredLogs.slice(0, 3)
                    : filteredLogs"
                  :key="log.log_id"
                  :log="log"
                  @click="handleLogClick(log)"
                />
              </div>
              <div v-else class="text-center py-8 text-gray-400 font-bold text-sm bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  검색 결과가 없습니다.
              </div>
            </div>
          </template>

          <!-- No Results -->
          <div
            v-if="
              (activeTab === 'all' && totalResultsCount === 0) ||
              (activeTab === 'places' && filteredPlaces.length === 0) ||
              (activeTab === 'trips' && filteredTrips.length === 0) ||
              (activeTab === 'logs' && filteredLogs.length === 0)
            "
            class="text-center py-12"
          >
            <div
              class="w-16 h-16 bg-gray-100 border-[2px] border-gray-300 rounded-xl mx-auto mb-4 flex items-center justify-center"
            >
              <Search :size="32" :stroke-width="2" class="text-gray-400" />
            </div>
            <p class="text-lg font-black text-gray-600 mb-1">검색 결과가 없습니다</p>
            <p class="text-sm font-bold text-gray-500">다른 키워드로 검색해보세요</p>
          </div>
        </div>
      </div>

      <!-- Hot Places TOP 10 (검색 전에만 표시) -->
      <div v-if="!hasSearched" class="max-w-[900px] mx-auto">
        <h2
          class="text-5xl mb-6 font-black tracking-tighter uppercase"
          style="font-family: 'Outfit', sans-serif"
        >
          Hot Place <span class="text-[#E88555]">Top 10</span>
        </h2>

        <div class="space-y-4">
          <div
            v-for="(place, index) in hotPlaces"
            :key="place.id"
            @click="handlePlaceClick(place, index)"
            class="bg-white border-[2px] border-[#2C2C2C] rounded-2xl p-5 shadow-[3px_3px_0px_0px_rgba(44,44,44,0.1)] hover:shadow-[6px_6px_0px_0px_rgba(44,44,44,0.15)] group cursor-pointer"
          >
            <div class="flex items-center gap-5">
              <!-- Rank Number -->
              <div
                :class="[
                  'w-16 h-16 border-[2px] border-[#2C2C2C] rounded-xl flex items-center justify-center flex-shrink-0',
                  index < 3 ? 'bg-[#F9CA6B]' : 'bg-[#FFF8ED]',
                ]"
              >
                <span class="text-3xl font-black" style="font-family: 'Bebas Neue', sans-serif">
                  {{ index + 1 }}
                </span>
              </div>

              <!-- Thumbnail Image -->
              <div
                class="w-32 h-32 border-[2px] border-[#2C2C2C] rounded-xl overflow-hidden flex-shrink-0"
              >
                <img
                  :src="place.imageUrl"
                  :alt="place.name"
                  class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  @error="handleImageError"
                />
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between mb-2">
                  <h3
                    class="text-2xl font-black tracking-tight group-hover:text-[#E88555] transition-colors"
                    style="font-family: 'Poppins', sans-serif"
                  >
                    {{ place.name }}
                  </h3>
                  <div
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-[#F9CA6B] border-[2px] border-[#2C2C2C] rounded-full flex-shrink-0 ml-3"
                  >
                    <Star :size="16" :stroke-width="2" class="fill-current text-[#2C2C2C]" />
                    <span class="text-sm font-black">{{ place.rating }}</span>
                  </div>
                </div>
                
                <div class="flex items-center gap-2 text-sm font-bold mb-4 text-gray-700">
                  <MapPin :size="16" :stroke-width="2" />
                  <span>{{ place.location }}</span>
                </div>
                
                <div class="flex items-center justify-between">
                  <!-- Tags -->
                  <div class="flex gap-2 flex-wrap">
                    <span
                      v-for="(tag, idx) in place.tags"
                      :key="idx"
                      class="px-3 py-1 bg-[#9BCCC4] border-[2px] border-[#2C2C2C] rounded-full text-xs font-black"
                    >
                      #{{ tag }}
                    </span>
                  </div>
                  
                  <!-- Views removed -->
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ScrollToTop />

    <!-- Diary Modal -->
    <!-- Diary Modal (Needs update if reuse is desired, or use new Log Detail Modal) -->
    <!-- For now, disable modal loop or adapt if needed. 
         DiaryCommentModal expects specific props. 
         Let's assume we might just want to view it for now or skipping detail integration as not requested explicitly?
         Actually, let's keep it commented out or remove if not compatible. 
         User only asked for "Card Integration". Detail view wasn't specifying LOGS Detail Modal update.
         I'll leave it but using selectedLog which might not match props. 
         Safest is to not render it or implement a placeholder if user clicks. 
         But wait, DiaryCommentModal is for existing Diary. 
         TripLog data is different. I'll comment it out to avoid type errors.
    -->
    <!-- Diary Modal (Log Detail) -->
    <DiaryCommentModal
      v-if="selectedLogId"
      :log-id="selectedLogId"
      :author-id="selectedAuthorId"
      :initial-liked="selectedLiked"
      @close="handleLogClose"
      @update="handleLogUpdate"
    />

    <!-- Course/Trip Modal -->
    <TripDetailModal
      v-if="selectedTrip"
      :trip="selectedTrip"
      @close="handleTripClose"
      @edit="handleTripEdit"
      :initial-tab="'map'"
    />

    <!-- Place Detail Modal -->
    <PlaceDetailModal 
      v-if="selectedPlace" 
      ref="placeDetailModalRef"
      :place="selectedPlace" 
      :disable-keydown="!!selectedLogId"
      @close="selectedPlace = null" 
      @open-trip-log="handleOpenTripLog"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNavigate } from '@/composables/common/useNavagation'
import TravelNavbar from '@/components/common/TravelNavbar.vue'
import ScrollToTop from '@/components/common/ScrollToTop.vue'
import { Search, MapPin, Star, Heart, MessageCircle, Map, BookOpen } from 'lucide-vue-next'
import DiaryCommentModal from '@/components/modal/DiaryCommentModal.vue'
import TripDetailModal from '@/components/modal/TripDetailModal.vue'
import PlaceDetailModal from '@/components/modal/PlaceDetailModal.vue'
import SearchPlaceItem from '@/components/search/SearchPlaceItem.vue'
import SearchTripItem from '@/components/search/SearchTripItem.vue'
import SearchLogItem from '@/components/search/SearchLogItem.vue'
import { usePlaceSearch } from '@/composables/trip/usePlaceSearch'
import { searchApi, type TripSearchDoc, type TripLogSearchDoc } from '@/apis/search'
import { getTripDetail } from '@/apis/trip'
import { spotApi } from '@/apis/spot'
import { spotReviewApi } from '@/apis/spot-review'

const router = useRouter()
const { handleNavigate } = useNavigate()
const {
  searchQuery,
  searchResults,
  isSearching,
  searchPlaces
} = usePlaceSearch()

// UI에서 표시할 쿼리 (검색 완료 후 업데이트)
const currentSearchQuery = ref('')
// 검색 실행 여부
const hasSearched = ref(false)
const activeTab = ref<'all' | 'places' | 'trips' | 'logs'>('all')

const selectedLogId = ref<number | null>(null)
const selectedAuthorId = ref<number | undefined>(undefined)
const selectedLiked = ref<boolean>(false)

// selectedTrip type is effectively 'any' because TripDetailModal expects a complex object (TripResponseDto-ish + UI fields)
// We will assign a mapped object to it.
const selectedTrip = ref<any>(null)
const selectedPlace = ref<any>(null)
const placeDetailModalRef = ref<any>(null)
const selectedCategory = ref<string>('')
const hasLogUpdates = ref(false)

// API Results
const filteredTrips = ref<TripSearchDoc[]>([])
const filteredLogs = ref<TripLogSearchDoc[]>([])

// ... (Rest of the computed properties) ...

const handleOpenTripLog = (payload: { logId: number, authorId: number, liked: boolean }) => {
    selectedLogId.value = payload.logId
    selectedAuthorId.value = payload.authorId
    selectedLiked.value = payload.liked
}

const handleLogUpdate = (payload: { logId: number; likeCount: number; liked: boolean }) => {
    hasLogUpdates.value = true
    if (placeDetailModalRef.value) {
        placeDetailModalRef.value.updateTripLogState(payload.logId, { likeCount: payload.likeCount, liked: payload.liked })
    }
}

const handleLogClose = () => {
    selectedLogId.value = null
    hasLogUpdates.value = false
    const query = { ...route.query }
    delete query.tab
    router.replace({ query })
}

const handleTripClose = () => {
    selectedTrip.value = null
    const query = { ...route.query }
    delete query.tab
    router.replace({ query })
}

const handleTripClick = async (trip: TripSearchDoc) => {
  try {
    const detail = await getTripDetail(trip.trip_id)
      selectedTrip.value = {
      ...detail,
      // Manual mapping for fields that might be missing or need UI transform
      description: detail.tripItems && detail.tripItems.length > 0 
          ? detail.tripItems.map((item:any) => item.spot.name).join(' → ') 
          : '장소 없음',
      // UI fields Mock/Calculated
      duration: calculateDuration(detail.startDate, detail.endDate),
      views: 0, // Mock for now
      imageUrl: '', // Mock
    }
  } catch (e) {
      console.error(e)
      alert("여행 상세 정보를 불러오는데 실패했습니다.")
  }
}

const calculateDuration = (start?: string, end?: string) => {
    if (!start || !end) return ''
    const s = new Date(start)
    const e = new Date(end)
    const diffTime = Math.abs(e.getTime() - s.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 
    return `${diffDays} Days`
}

const handleTripEdit = (trip: any) => {
  // 편집 모드로 이동
  router.push(`/create-trip?id=${trip.trip_id}`)
  selectedTrip.value = null
}

const handlePlaceClick = (place: any, index?: number) => {
  selectedPlace.value = {
    number: index !== undefined ? index + 1 : 1,
    name: place.name,
    // API 결과에 맞게 추가 매핑 필요시 여기서 처리
    ...place
  }
}

const handleLogClick = (log: TripLogSearchDoc) => {
    selectedLogId.value = log.log_id
    selectedAuthorId.value = log.user_id
    selectedLiked.value = false // Default, modal will fetch fresh data
}

// Mock Data
const recommendedKeywords = [
  '성수동',
  '카페',
  '한강',
  '맛집',
  '북촌',
  '을지로',
  '연남동',
  '망원동',
  '익선동',
  '강남',
]

import { allPlaces } from '@/data/mockData'

// Mock Courses Data
const allCourses = [
  {
    id: 1,
    title: '성수동 힙스터 코스',
    spots: 5,
    duration: '반나절',
    description: '대림창고 - 어반비즈 - 그리노성수 - 성수연방 - 테라로사 성수점',
    tags: ['카페', '성수동', '사진'],
    views: 15230,
    imageUrl:
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  },
  {
    id: 2,
    title: '한강 자전거 라이딩',
    spots: 8,
    duration: '하루',
    description: '망원한강공원 → 양화대교 → 반포한강공원 → 뚝섬한강공원 순환 코스',
    tags: ['한강', '자전거', '운동'],
    views: 23450,
    imageUrl:
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  },
  {
    id: 3,
    title: '북촌 한옥마을 & 익선동 투어',
    spots: 6,
    duration: '반나절',
    description: '전통과 현대가 공존하는 서울의 매력을 느낄 수 있는 문화 코스',
    tags: ['전통', '카페', '북촌'],
    views: 18920,
    imageUrl:
      'https://images.unsplash.com/photo-1528360983277-13d401cdc186?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  },
  {
    id: 4,
    title: '을지로 레트로 맛집 투어',
    spots: 7,
    duration: '하루',
    description: '을지로 인쇄골목과 숨은 맛집들을 돌아보는 미식 여행',
    tags: ['맛집', '레트로', '을지로'],
    views: 21340,
    imageUrl:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  },
  {
    id: 5,
    title: '연남동 감성 카페 투어',
    spots: 4,
    duration: '반나절',
    description: '연남동의 숨은 보석 같은 카페들을 찾아가는 여유로운 오후',
    tags: ['카페', '연남동', '힐링'],
    views: 16780,
    imageUrl:
      'https://images.unsplash.com/photo-1511081692775-05d0f180a065?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  },
]

// Mock Diaries Data
const allDiaries = [
  {
    id: 1,
    author: '여행러버',
    authorAvatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    date: '2024.11.28',
    title: '성수동 카페 투어 다녀왔어요!',
    location: '서울 성동구',
    content:
      '대림창고부터 시작해서 성수동 일대 핫한 카페들을 다 돌아봤어요. 사진 찍기도 너무 좋고 커피도 맛있었어요. 특히 그리노 성수의 플랫화이트 추천!',
    likes: 234,
    comments: 18,
    images: [
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
      'https://images.unsplash.com/photo-1501492693223-0b319f96b8e1?w=800',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800',
    ],
    course: [
      { number: 1, name: '대림창고' },
      { number: 2, name: '그리노 성수' },
      { number: 3, name: '어반비즈' },
      { number: 4, name: '테라로사 성수' },
    ],
  },
  {
    id: 2,
    author: '서울탐방',
    authorAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    date: '2024.11.25',
    title: '북촌한옥마을 야경이 정말 예뻐요',
    location: '서울 종로구',
    content:
      '낮에도 이쁘지만 밤에 가면 한옥의 조명이 정말 아름다워요. 사람도 적고 사진 찍기 딱 좋았습니다. 데이트 코스로 강력 추천!',
    likes: 189,
    comments: 12,
    images: [
      'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800',
      'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800',
    ],
    course: [
      { number: 1, name: '북촌한옥마을' },
      { number: 2, name: '삼청동' },
      { number: 3, name: '인사동' },
    ],
  },
  {
    id: 3,
    author: '맛집헌터',
    authorAvatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    date: '2024.11.22',
    title: '을지로 숨은 맛집 대공개',
    location: '서울 중구',
    content:
      '을지로에는 정말 숨은 맛집들이 많아요. 레스토랑 소공, 인쇄골목 근처 분식집 등 현지인만 아는 곳들을 다녀왔습니다!',
    likes: 312,
    comments: 24,
    images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'],
    course: [
      { number: 1, name: '인쇄골목' },
      { number: 2, name: '레스토랑 소공' },
      { number: 3, name: '을지면옥' },
    ],
  },
  {
    id: 4,
    author: '자전거매니아',
    authorAvatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    date: '2024.11.20',
    title: '한강 자전거 라이딩 완주!',
    location: '서울 한강',
    content:
      '망원에서 출발해서 뚝섬까지 왕복했어요. 날씨 좋은 날 한강 라이딩 정말 최고입니다. 중간중간 편의점도 많고 쉬어갈 곳도 많아요.',
    likes: 145,
    comments: 8,
    images: [
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
      'https://images.unsplash.com/photo-1571333250630-f0230c320b6d?w=800',
      'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=800',
    ],
    course: [
      { number: 1, name: '망원한강공원' },
      { number: 2, name: '양화대교' },
      { number: 3, name: '반포한강공원' },
      { number: 4, name: '뚝섬한강공원' },
    ],
  },
  {
    id: 5,
    author: '카페투어',
    authorAvatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    date: '2024.11.18',
    title: '연남동 숨은 카페 추천',
    location: '서울 마포구 연남동',
    content:
      '연남동에는 정말 예쁜 카페들이 많아요. 히든트랙, 연남방앗간 등 인스타감성 카페부터 조용한 북카페까지 다양합니다.',
    likes: 267,
    comments: 15,
    images: [
      'https://images.unsplash.com/photo-1511081692775-05d0f180a065?w=800',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800',
    ],
    course: [
      { number: 1, name: '히든트랙' },
      { number: 2, name: '연남방앗간' },
      { number: 3, name: '연남서식' },
    ],
  },
  {
    id: 6,
    author: '강남러버',
    authorAvatar:
      'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop',
    date: '2024.11.15',
    title: '청담동 럭셔리 거리 산책',
    location: '서울 강남구 청담동',
    content: '청담동 명품 거리와 감성 카페들을 둘러봤어요. 비싸지만 분위기 하나는 끝내줍니다!',
    likes: 198,
    comments: 11,
    images: ['https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800'],
    course: [
      { number: 1, name: '에르메스 청담' },
      { number: 2, name: '압구정 카페' },
    ],
  },
]

const hotPlaces = ref<any[]>([])

import { useRoute } from 'vue-router'

// Computed - Filtered Results
// 장소: API 결과 사용
const filteredPlaces = computed(() => {
  return searchResults.value.map(place => ({
    id: place.id,
    name: place.name,
    // API에서 이미지가 오면 사용, 없으면 null
    imageUrl: place.thumbnailUrl || null,
    // 평점 정보 없음
    rating: 0.0,
    location: place.address,
    description: place.address, // 상세 설명이 없으므로 주소로 대체
    // 카테고리를 태그로 사용
    tags: place.category ? place.category.split(' > ').slice(-1) : ['장소'],
    views: 0, // 조회수 정보 없음
    phone: place.phone,
    website: place.placeUrl,
    kakaoPlaceId: place.kakaoPlaceId,
    lat: place.lat,
    lng: place.lng
  }))
})

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    currentSearchQuery.value = searchQuery.value
    hasSearched.value = true
    activeTab.value = 'all'
    
    // Call API
    searchPlaces()
    searchTrips()
    searchLogs()
  } else {
    // 검색어가 비어있을 경우 초기화
    hasSearched.value = false
    currentSearchQuery.value = ''
    searchQuery.value = ''
    activeTab.value = 'all'
    searchResults.value = []
    filteredTrips.value = []
    filteredLogs.value = []
  }
}

const searchLogs = async () => {
    try {
        filteredLogs.value = await searchApi.searchTripLogs(currentSearchQuery.value)
    } catch (e) {
        console.error(e)
        filteredLogs.value = []
    }
}

const searchTrips = async () => {
    try {
        filteredTrips.value = await searchApi.searchTrips(currentSearchQuery.value)
    } catch (e) {
        console.error(e)
        filteredTrips.value = []
    }
}

const searchByKeyword = (keyword: string) => {
  searchQuery.value = keyword
  handleSearch()
}
const route = useRoute()

onMounted(async () => {
    // 1. Check for query param 'q' (Keyword Search)
    if (route.query.q) {
        searchQuery.value = route.query.q as string
        handleSearch()
    }

    // 2. Load Hot Places
    try {
        const places = await spotApi.getHotPlaces()
        // Fetch stats for each place
        const placesWithStats = await Promise.all(places.map(async (place) => {
             try {
                const stats = await spotReviewApi.getSpotReviewStats(place.id)
                return {
                    ...place,
                    imageUrl: place.thumbnailUrl,
                    location: place.address,
                    rating: stats.averageRating || 0.0,
                    reviewCount: stats.reviewCount || 0,
                    tags: place.category ? place.category.split(' > ').slice(-1) : ['핫플레이스']
                }
             } catch (e) {
                 return {
                    ...place,
                    imageUrl: place.thumbnailUrl,
                    location: place.address,
                    rating: 0.0,
                    reviewCount: 0,
                    tags: place.category ? place.category.split(' > ').slice(-1) : ['핫플레이스']
                 }
             }
        }))
        hotPlaces.value = placesWithStats
    } catch (e) {
        console.error("Failed to fetch hot places", e)
        hotPlaces.value = []
    }
})

// Clean up Mock Data - filteredCourses logic removed


// Clean up Mock Data - filteredDiaries logic removed


const totalResultsCount = computed(() => {
  return filteredPlaces.value.length + filteredTrips.value.length + filteredLogs.value.length
})

const tabs = [
  { id: 'all' as const, label: 'ALL' },
  { id: 'places' as const, label: 'PLACE' },
  { id: 'trips' as const, label: 'TRIP' },
  { id: 'logs' as const, label: 'LOG' },
]

const getTabCount = (tabId: string) => {
  if (tabId === 'all') return totalResultsCount.value
  if (tabId === 'places') return filteredPlaces.value.length
  if (tabId === 'trips') return filteredTrips.value.length
  if (tabId === 'logs') return filteredLogs.value.length
  return 0
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

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
