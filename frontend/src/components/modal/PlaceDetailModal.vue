<template>
  <div class="fixed inset-0 bg-black/60 z-[60]" @click.stop="emit('close')">
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-6 pointer-events-none">
      <div
        class="bg-white border-[3px] border-[#2C2C2C] rounded-2xl shadow-[8px_8px_0px_0px_rgba(44,44,44,1)] max-w-2xl w-full max-h-[85vh] flex flex-col pointer-events-auto overflow-hidden"
        @click.stop
      >
        <!-- Header Section -->
        <div class="relative w-full min-h-[250px] flex flex-col justify-end overflow-hidden" 
             :class="localPlace.imageUrl ? 'bg-gray-900' : 'bg-white border-b-[3px] border-[#2C2C2C]'">
             
             <!-- Background Image -->
             <div v-if="localPlace.imageUrl" class="absolute inset-0 z-0">
                <img :src="localPlace.imageUrl" class="w-full h-full object-cover opacity-90" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
             </div>

             <!-- Close Button -->
             <button
                @click="emit('close')"
                class="absolute top-6 right-6 p-2 border-[2px] border-[#2C2C2C] rounded-lg bg-white hover:bg-gray-50 transition-colors z-20 shadow-sm"
              >
                <X class="w-5 h-5 text-[#2C2C2C]" stroke-width="2" />
              </button>

             <!-- Header Content -->
             <div class="p-6 relative z-10 w-full pt-16">
                  <div class="pr-12">
                     <div class="flex flex-wrap gap-2 mb-3">
                      <span
                        v-for="(tag, index) in localPlace.tags"
                        :key="index"
                        :class="[
                            'px-2.5 py-1 border-[2px] rounded-full text-xs font-black',
                            localPlace.imageUrl 
                                ? 'bg-white/90 border-transparent text-[#2C2C2C]' 
                                : 'bg-[#9BCCC4] border-[#2C2C2C] text-[#2C2C2C]'
                        ]"
                      >
                        #{{ tag }}
                      </span>
                    </div>
                    
                    <h2 
                        class="text-4xl font-black tracking-tight font-sans leading-tight mb-3"
                        :class="localPlace.imageUrl ? 'text-white drop-shadow-md' : 'text-[#2C2C2C]'"
                    >
                      {{ localPlace.name }}
                    </h2>
                  </div>
                  
                  <!-- Compact Info Bar -->
                   <div 
                        class="flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold"
                        :class="localPlace.imageUrl ? 'text-gray-200' : 'text-gray-600'"
                    >
                     <div class="flex items-center gap-1.5">
                       <MapPin class="w-4 h-4" :class="localPlace.imageUrl ? 'text-white' : 'text-[#2C2C2C]'" stroke-width="2.5" />
                       <span class="truncate max-w-[200px]">{{ localPlace.address || '주소 정보 없음' }}</span>
                     </div>
                     
                     <div v-if="localPlace.phone" class="flex items-center gap-1.5">
                       <Phone class="w-4 h-4" :class="localPlace.imageUrl ? 'text-white' : 'text-[#2C2C2C]'" stroke-width="2.5" />
                       <span>{{ localPlace.phone }}</span>
                     </div>
                     
                     <div v-if="localPlace.website" class="flex items-center gap-1.5">
                       <Globe class="w-4 h-4" :class="localPlace.imageUrl ? 'text-white' : 'text-[#2C2C2C]'" stroke-width="2.5" />
                       <a :href="localPlace.website" target="_blank" class="hover:text-[#E88555] hover:underline truncate max-w-[150px]">
                         {{ truncateUrl(localPlace.website) }}
                       </a>
                     </div>
                   </div>
             </div>
        </div>

        <div class="flex-1 overflow-y-auto bg-[#FAFAFA]">
          <div class="p-6">
            <!-- Trip Logs Section -->
            <div v-if="tripLogs.length > 0" class="mb-12 relative min-h-[200px]">
              <Transition
                  enter-active-class="transition-opacity duration-200"
                  leave-active-class="transition-opacity duration-200"
                  enter-from-class="opacity-0"
                  leave-to-class="opacity-0"
              >
                  <div 
                      v-if="isRefreshing" 
                      class="absolute inset-0 bg-white/50 z-10 rounded-xl"
                  ></div>
              </Transition>

              <h3 class="text-xl font-black uppercase text-[#2C2C2C] mb-4 flex items-center gap-2">
                Trip Logs 
                <span class="px-2 py-0.5 bg-[#9BCCC4] text-white text-xs rounded-full">{{ tripLogs.length }}{{ tripLogsHasNext ? '+' : '' }}</span>
              </h3>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  v-for="log in tripLogs" 
                  :key="log.logId"
                  class="bg-white border-[2px] border-[#2C2C2C] rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-transform hover:-translate-y-1"
                  @click="emit('open-trip-log', { logId: log.logId, liked: log.liked, authorId: log.authorId })"
                >
                  <!-- Image -->
                  <div class="h-40 bg-gray-100 relative">
                     <img 
                      v-if="log.images && log.images.length > 0" 
                      :src="log.images[0].imageUrl" 
                      class="w-full h-full object-cover"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
                        <span class="text-xs font-bold">No Image</span>
                    </div>
                  </div>
                  
                  <!-- Content -->
                  <div class="p-3">
                     <h4 class="font-black text-sm text-[#2C2C2C] line-clamp-1 mb-1">{{ log.title }}</h4>
                     <p class="text-xs text-gray-500 line-clamp-2 mb-2 h-8">{{ stripHtml(log.content) }}</p>
                     
                     <div class="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                        <div class="flex items-center gap-1.5">
                           <div class="w-5 h-5 rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
                              <img :src="log.authorImageUrl || `https://i.pravatar.cc/150?u=${log.authorNickname}`" class="w-full h-full object-cover" />
                           </div>
                           <span class="text-xs font-bold text-gray-600 truncate max-w-[80px]">{{ log.authorNickname }}</span>
                        </div>
                        <div class="flex items-center gap-2 text-xs font-bold text-gray-400">
                           <div class="flex items-center gap-0.5">
                              <Heart class="w-3 h-3 fill-gray-400 text-gray-400" /> {{ log.likeCount }}
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              </div>

               <!-- Load More Trip Logs -->
               <div v-if="tripLogsHasNext" class="mt-4 text-center">
                  <button 
                    @click="fetchTripLogs(true)"
                    class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-black text-[#2C2C2C] transition-colors disabled:opacity-50"
                    :disabled="isTripLogsLoading"
                  >
                    {{ isTripLogsLoading ? 'Loading...' : 'More Trip Logs' }}
                  </button>
               </div>
            </div>

            <div v-if="tripLogs.length > 0" class="w-full h-[2px] bg-gray-100 mb-8 border-t border-dashed border-gray-300"></div>

            <!-- Reviews Highlight -->
            <div class="bg-white border-[2px] border-[#2C2C2C] rounded-xl p-5 mb-6 shadow-[4px_4px_0px_0px_rgba(44,44,44,0.1)]">
               <div class="flex flex-col sm:flex-row gap-6 items-start">
                 <!-- Rating Stats -->
                 <div class="flex flex-col items-center justify-center min-w-[120px] pt-2">
                    <span class="text-5xl font-black text-[#2C2C2C] tracking-tighter">{{ localPlace.rating.toFixed(1) }}</span>
                    <div class="flex gap-0.5 my-1">
                      <div v-for="i in 5" :key="i" class="relative w-4 h-4">
                        <Star class="absolute inset-0 w-4 h-4 text-gray-200 fill-gray-200" stroke-width="1.5" />
                        <div class="absolute inset-0 overflow-hidden" :style="{ width: `${Math.max(0, Math.min(100, (localPlace.rating - (i - 1)) * 100))}%` }">
                            <Star class="absolute left-0 w-4 h-4 fill-[#FFD60A] text-[#2C2C2C]" stroke-width="1.5" />
                        </div>
                      </div>
                    </div>
                    <span class="text-xs font-bold text-gray-500">{{ localPlace.reviews.toLocaleString() }} Reviews</span>
                 </div>
                 
                 <div class="hidden sm:block w-[2px] self-stretch bg-gray-100"></div>
                 
                 <div class="flex-1 w-full flex flex-col items-end">
                    <p class="text-sm font-black text-gray-800 mb-2 w-full text-left">
                        이 장소는 나에게 어떤 곳이었나요? 기록을 남겨주세요!
                    </p>
                    <div class="flex items-center gap-1 cursor-pointer mb-3 w-full" @mouseleave="handleStarLeave">
                      <div
                        v-for="star in 5"
                        :key="star"
                        class="relative w-8 h-8"
                        @mousemove="(e) => handleStarHover(star - 1, e)"
                        @click="(e) => handleStarClick(star - 1, e)"
                      >
                        <Star class="absolute inset-0 w-8 h-8 text-gray-200 fill-gray-200" stroke-width="2" />
                        <div
                          class="absolute inset-0 overflow-hidden"
                          :style="{ width: `${getStarFillPercent(star - 1)}%` }"
                        >
                           <Star
                            class="absolute left-0 w-8 h-8 fill-[#FFD60A] text-[#2C2C2C]"
                            stroke-width="2"
                          />
                        </div>
                      </div>
                      <span v-if="userRating > 0" class="ml-2 text-sm font-bold text-[#E88555]">
                        {{ userRating.toFixed(1) }}점
                      </span>
                    </div>

                    <!-- Review Text Input -->
                    <div class="relative w-full">
                      <textarea
                        v-model="reviewContent"
                        placeholder="솔직한 리뷰를 남겨주세요."
                        class="w-full p-3 border-[2px] border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-[#2C2C2C] resize-none h-24 placeholder:text-gray-400"
                      ></textarea>
                      <button 
                      <button 
                        @click="submitReview"
                        :disabled="userRating === 0"
                        class="absolute bottom-3 right-3 px-4 py-1.5 bg-[#2C2C2C] text-white text-xs font-black rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-[#404040] transition-colors"
                      >
                        {{ myReview ? '수정하기' : '등록하기' }}
                      </button>
                    </div>
                 </div>
               </div>
            </div>

            <!-- Review List Header -->
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xl font-black uppercase text-[#2C2C2C]">Reviews</h3>
              <div class="flex gap-2">
                 <button 
                    @click="sortBy = 'latest'"
                    :class="[
                        'text-xs font-bold px-3 py-1.5 rounded-full border transition-colors',
                        sortBy === 'latest' 
                            ? 'bg-[#2C2C2C] text-white border-[#2C2C2C]' 
                            : 'bg-white text-gray-500 border-gray-300 hover:border-[#2C2C2C] hover:text-[#2C2C2C]'
                    ]"
                 >
                    최신순
                 </button>
                 <button 
                    @click="sortBy = 'rating'"
                    :class="[
                        'text-xs font-bold px-3 py-1.5 rounded-full border transition-colors',
                        sortBy === 'rating' 
                            ? 'bg-[#2C2C2C] text-white border-[#2C2C2C]' 
                            : 'bg-white text-gray-500 border-gray-300 hover:border-[#2C2C2C] hover:text-[#2C2C2C]'
                    ]"
                 >
                    별점순
                 </button>
              </div>
            </div>

            <!-- Review List -->
            <div class="space-y-4">
               <div v-if="reviews.length === 0" class="bg-white border-[2px] border-dashed border-gray-300 rounded-xl p-8 text-center">
                    <p class="text-gray-500 font-bold">아직 작성된 리뷰가 없습니다.<br/>첫 번째 리뷰를 남겨보세요!</p>
               </div>
               <div 
                v-for="review in displayedReviews" 
                :key="review.id" 
                class="bg-white border-[2px] border-[#2C2C2C] rounded-xl p-4 transition-colors"
               >
                  <div class="flex justify-between items-start mb-3">
                     <div class="flex items-center gap-3">
                        <!-- Avatar -->
                        <div class="w-10 h-10 rounded-full bg-white border-[2px] border-[#2C2C2C] flex items-center justify-center overflow-hidden">
                           <img :src="review.userProfileImage || `https://i.pravatar.cc/150?u=${review.userNickname}`" class="w-full h-full object-cover" />
                        </div>
                        <div>
                           <div class="font-black text-sm text-[#2C2C2C]">{{ review.userNickname }}</div>
                           <div class="text-xs font-bold text-gray-400">{{ formatDate(review.createdAt) }}</div>
                        </div>
                     </div>
                     <div class="flex items-center gap-2">
                        <div class="flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-[#2C2C2C]">
                            <Star class="w-3 h-3 fill-[#FFD60A] text-[#2C2C2C]" stroke-width="2" />
                            <span class="text-xs font-black">{{ review.rating.toFixed(1) }}</span>
                        </div>
                        <!-- Delete Button (Only for my review) -->
                        <button 
                            v-if="myReview && review.id === myReview.id"
                            @click="deleteReview"
                            class="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            title="리뷰 삭제"
                        >
                            <Trash2 class="w-4 h-4" stroke-width="2.5" />
                        </button>
                     </div>
                  </div>
                  <p class="text-sm font-medium text-gray-700 leading-relaxed">
                    {{ review.content }}
                  </p>
               </div>
            </div>
            
            <!-- Infinite Scroll Trigger -->
            <div ref="loadMoreTrigger" class="h-10 w-full flex items-center justify-center mt-4">
                 <div v-if="displayedReviewsCount < reviews.length" class="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2C2C2C]"></div>
            </div>


          </div>
        </div>
      </div>
    </div>
    
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
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { X, MapPin, Phone, Globe, Star, Trash2, Heart } from 'lucide-vue-next'
import { spotApi, type SpotRequestDto } from '@/apis/spot/index'
import { type SpotResponseDto } from '@/apis/search'
import { spotReviewApi, type SpotReviewResponseDto } from '@/apis/spot-review/index'
import { getTripLogsBySpot } from '@/apis/trip-log/index'
import type { TripLogFeedItemDto } from '@/apis/trip-log/types'
import { useAuthStore } from '@/stores/auth'
import AlertDialog from '@/components/common/AlertDialog.vue'

const props = defineProps<{
  place: any
  disableKeydown?: boolean
}>()

const emit = defineEmits(['close', 'open-trip-log'])
const authStore = useAuthStore()

// ... (Rest of the state definitions)

const spotId = ref<number | null>(null)
const spotResponse = ref<SpotResponseDto | null>(null)
const reviews = ref<SpotReviewResponseDto[]>([])
const reviewStats = ref<{ averageRating: number; reviewCount: number }>({
  averageRating: 0,
  reviewCount: 0,
})

// Trip Logs State
const tripLogs = ref<TripLogFeedItemDto[]>([])
const tripLogsCursor = ref<number | null>(null)
const tripLogsHasNext = ref(false)
const isTripLogsLoading = ref(false)
const isRefreshing = ref(false) // Visual effect state

const myReview = ref<SpotReviewResponseDto | null>(null)

const localPlace = computed(() => {
  const base = {
    name: props.place.name,
    tags: props.place.tags || [],
    address: props.place.location || props.place.address,
    phone: props.place.phone,
    website: props.place.website || props.place.placeUrl,
    imageUrl: props.place.imageUrl || props.place.thumbnailUrl
  }

  // API 응답이 있으면 덮어쓰기 (실제 DB 데이터 우선)
  if (spotResponse.value) {
      if (spotResponse.value.name) base.name = spotResponse.value.name
  }

  return {
    ...base,
    rating: reviewStats.value.averageRating,
    reviews: reviewStats.value.reviewCount
  }
})


// 사용자 평가 state
const userRating = ref<number>(0)
const hoverRating = ref<number>(0)
const reviewContent = ref<string>('')

const getAverageRatingRounded = () => {
  return Math.floor(localPlace.value.rating * 2) / 2
}
const handleStarHover = (starIndex: number, event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const x = event.clientX - rect.left
  const width = rect.width
  const rating = x < width / 2 ? starIndex + 0.5 : starIndex + 1
  hoverRating.value = rating
}

const handleStarClick = (starIndex: number, event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const x = event.clientX - rect.left
  const width = rect.width
  const rating = x < width / 2 ? starIndex + 0.5 : starIndex + 1

  if (userRating.value === rating) {
    userRating.value = 0
  } else {
    userRating.value = rating
  }
}

const handleStarLeave = () => {
  hoverRating.value = 0
}

const getStarFillPercent = (starIndex: number) => {
  const displayRating = hoverRating.value || userRating.value || getAverageRatingRounded()
  const starPosition = starIndex + 1

  if (displayRating >= starPosition) {
    return 100
  } else if (displayRating > starIndex) {
    return (displayRating - starIndex) * 100
  } else {
    return 0
  }
}

// Dialog State
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

// Close on Esc
const handleKeydown = (e: KeyboardEvent) => {
    if (props.disableKeydown) return
    if (e.key === 'Escape' && !dialogState.value.show) {
        emit('close')
    }
}

onMounted(() => {
    fetchSpotData()
    document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
})

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
        confirmButtonText: '삭제',
        showCancelButton: true,
        onConfirm,
    }
}

const fetchSpotData = async () => {
    try {
        // 1. 장소 생성 (Upsert) - 없으면 생성, 있으면 조회됨 (Upsert)
        const createData: SpotRequestDto = {
            kakaoPlaceId: props.place.kakaoPlaceId,
            name: props.place.name,
            address: props.place.location || props.place.address || '',
            category: props.place.category || '기타',
            lat: props.place.lat || 0,
            lng: props.place.lng || 0,
            placeUrl: props.place.placeUrl || '',
            thumbnailUrl: props.place.imageUrl || props.place.thumbnailUrl || ''
        }
        
        // POST /spots 호출 (200 OK or 201 Created)
        let spot = await spotApi.createSpot(createData)

        if (spot) {
            spotId.value = spot.id
            spotResponse.value = spot
            
            // 3. 리뷰 및 통계 조회
            const [reviewsData, statsData] = await Promise.all([
                spotReviewApi.getSpotReviews(spot.id),
                spotReviewApi.getSpotReviewStats(spot.id),
                fetchTripLogs() // Initial fetch for trip logs
            ])

            // New API response structure: { myReview, reviews }
            reviews.value = reviewsData.reviews || []
            myReview.value = reviewsData.myReview
            reviewStats.value = statsData
            
            // If myReview exists but is not in reviews list, add it (so user sees it in the list too)
            if (myReview.value) {
                const exists = reviews.value.find(r => r.id === myReview.value?.id)
                if (!exists) {
                    reviews.value.unshift(myReview.value)
                }
            }

            // Populate input if myReview exists
            if (myReview.value) {
                userRating.value = myReview.value.rating
                reviewContent.value = myReview.value.content
            } else {
                // Reset inputs if no review
                userRating.value = 0
                reviewContent.value = ''
            }
        }

    } catch (e) {
        console.error('Failed to fetch spot data:', e)
    }
}

const fetchTripLogs = async (isLoadMore = false) => {
    if (!spotId.value) return
    if (isTripLogsLoading.value) return
    
    // If not load more, reset
    if (!isLoadMore) {
        tripLogsCursor.value = null
        tripLogs.value = []
    }

    try {
        isTripLogsLoading.value = true
        const response = await getTripLogsBySpot(spotId.value, {
            cursor: tripLogsCursor.value,
            limit: 5 // 소량만 로드
        })
        
        if (isLoadMore) {
             tripLogs.value.push(...response.content)
        } else {
             tripLogs.value = response.content
        }
        
        tripLogsCursor.value = response.nextCursor
        tripLogsHasNext.value = response.hasNext

    } catch (e) {
        console.error('Failed to fetch trip logs:', e)
    } finally {
        isTripLogsLoading.value = false
    }
}

const updateTripLogState = (logId: number, newState: { likeCount?: number; liked?: boolean }) => {
    const log = tripLogs.value.find(l => l.logId === logId)
    if (log) {
        if (newState.likeCount !== undefined) log.likeCount = newState.likeCount
    }
}

const refreshWithEffect = async () => {
    isRefreshing.value = true
    await new Promise(resolve => setTimeout(resolve, 150)) // 0.15초 (짧은 깜빡임)
    isRefreshing.value = false
}

const submitReview = async () => {
    if (userRating.value === 0 || !spotId.value) return
    
    try {
        if (myReview.value) {
            // Update existig review using PATCH
             await spotReviewApi.updateSpotReview(myReview.value.id, {
                rating: userRating.value,
                content: reviewContent.value
            })
            showAlert('리뷰가 수정되었습니다!', '알림', async () => {
                await fetchSpotData()
            })
        } else {
            // Create new review
            await spotReviewApi.postSpotReview({
                spotId: spotId.value,
                rating: userRating.value,
                content: reviewContent.value
            })
             showAlert('리뷰가 등록되었습니다!', '알림', async () => {
                // Clear inputs if it was a new review
                reviewContent.value = ''
                userRating.value = 0
                await fetchSpotData()
            })
        }

    } catch (e) {
        console.error('Failed to submit review:', e)
        showAlert('리뷰 저장에 실패했습니다.')
    }
}

const deleteReview = async () => {
    if (!myReview.value) return
    
    showConfirm('정말 리뷰를 삭제하시겠습니까?', async () => {
        try {
            await spotReviewApi.deleteSpotReview(myReview.value!.id)
            showAlert('리뷰가 삭제되었습니다.', '알림', async () => {
                 // Reset inputs
                reviewContent.value = ''
                userRating.value = 0
                myReview.value = null // Explicitly clear myReview to switch back to 'Create' mode immediately
                
                await fetchSpotData()
            })
        } catch (e) {
            console.error('Failed to delete review:', e)
            showAlert('리뷰 삭제에 실패했습니다.')
        }
    })
}

// Helper to format date
const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString()
}

// Helper to truncate URL
const truncateUrl = (url: string) => {
  if (!url) return ''
  return url.length > 30 ? url.substring(0, 30) + '...' : url
}

// Helper to strip HTML
const stripHtml = (html: string) => {
  if (!html) return ''
  const tmp = document.createElement('DIV')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

// Sort & Pagination state
const sortBy = ref<'latest' | 'rating'>('latest')
const displayedReviewsCount = ref(10)
const loadMoreTrigger = ref<HTMLElement | null>(null)

const processedReviews = computed(() => {
    const list = [...reviews.value] // Create a copy
    if (sortBy.value === 'latest') {
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else {
        return list.sort((a, b) => b.rating - a.rating)
    }
})

const displayedReviews = computed(() => {
    return processedReviews.value.slice(0, displayedReviewsCount.value)
})

let observer: IntersectionObserver | null = null

const setupIntersectionObserver = () => {
    if (observer) observer.disconnect()
    
    observer = new IntersectionObserver((entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && displayedReviewsCount.value < processedReviews.value.length) {
            // Load more
            setTimeout(() => {
                displayedReviewsCount.value += 10
            }, 300) // Slight delay for UX
        }
    }, {
        root: null, // viewport
        threshold: 0.1
    })

    if (loadMoreTrigger.value) {
        observer.observe(loadMoreTrigger.value)
    }
}



// Watchers: no additional imports needed here as they are at the top
watch(reviews, async () => {
    displayedReviewsCount.value = 10
    await nextTick()
    setupIntersectionObserver()
})

watch(sortBy, async () => {
    displayedReviewsCount.value = 10
    await nextTick()
    setupIntersectionObserver()
})

watch(loadMoreTrigger, () => {
    setupIntersectionObserver()
})

defineExpose({
    updateTripLogState,
    refreshWithEffect
})
</script>

<style scoped>
</style>
