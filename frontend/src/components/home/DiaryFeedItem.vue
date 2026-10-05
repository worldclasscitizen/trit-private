<template>
  <div class="mb-8 block relative">
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
        class="fixed top-6 right-6 z-[60] bg-white border-[3px] border-[#2C2C2C] rounded-xl shadow-[4px_4px_0px_0px_rgba(44,44,44,0.3)] px-5 py-3 flex items-center gap-3"
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
      class="bg-white rounded-xl border-[2px] border-[#2C2C2C] p-6 shadow-[4px_4px_0px_0px_rgba(44,44,44,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(44,44,44,1)] transition-all"
    >
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" @click="navigateToUserLog">
          <div
            class="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-[2px] border-[#2C2C2C] bg-gray-100"
          >
            <img :src="props.authorImageUrl" :alt="props.authorNickname" class="w-full h-full object-cover" />
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="font-black text-base text-[#2C2C2C] leading-none">{{ props.authorNickname }}</h4>
            <div class="flex items-center gap-1.5 text-xs font-bold text-gray-500 mt-1">
              <span>{{ props.locationSummary }}</span>
              <span class="text-gray-300">•</span>
              <span>{{ props.createdAt }}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
             @click="handleShare"
             class="w-8 h-8 flex items-center justify-center border-[2px] border-[#2C2C2C] rounded-lg bg-white hover:bg-gray-50 hover:shadow-[2px_2px_0px_0px_rgba(44,44,44,0.1)] transition-all focus:outline-none"
          >
            <Share2 class="w-4 h-4 text-[#2C2C2C]" stroke-width="2.5" />
          </button>

        </div>
      </div>

      <h3 class="text-lg font-black text-[#2C2C2C] mb-3 leading-snug tracking-tight">{{ title }}</h3>

      <!-- <div v-if="course && course.length > 0" class="mb-4 flex items-center flex-wrap gap-1.5">
        <div v-for="(place, index) in course" :key="index" class="flex items-center gap-1.5">
          <button
            class="course-badge flex items-center gap-1 px-2.5 py-1 border-[2px] border-[#2C2C2C] rounded-full bg-white shadow-[1px_1px_0px_0px_rgba(44,44,44,0.1)] cursor-pointer hover:shadow-[2px_2px_0px_0px_rgba(44,44,44,0.15)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all focus:outline-none"
            :style="{ '--hover-color': getBadgeColor(index) }"
            @click="selectedPlace = place"
          >
            <span class="text-xs font-black text-[#2C2C2C]">{{ place.number }}</span>
            <span class="text-xs font-black text-[#2C2C2C] whitespace-nowrap">{{
              place.name
            }}</span>
          </button>
          <ChevronRight
            v-if="index < course.length - 1"
            class="w-3 h-3 text-gray-400 flex-shrink-0"
            stroke-width="3"
          />
        </div>
      </div> -->

      <div
        v-if="allImages.length > 0"
        class="mb-5 select-none cursor-pointer bg-white border border-gray-200 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]"
        @click="handleOpenLog"
      >
        <!-- Single Image -->
        <div v-if="allImages.length === 1" class="w-full">
          <img :src="allImages[0]" class="aspect-[4/3] w-full object-cover bg-gray-100" />
        </div>
        
        <!-- Carousel for 2+ Images -->
        <div v-else class="relative group">
          <div class="overflow-hidden">
            <div
              class="flex transition-transform duration-500 ease-in-out will-change-transform"
              :style="{
                transform: `translateX(-${currentImageIndex * 100}%)`,
              }"
            >
              <div
                v-for="(img, idx) in allImages"
                :key="idx"
                class="w-full flex-shrink-0 aspect-[4/3] bg-gray-100"
              >
                <img :src="img" class="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          <div v-if="allImages.length > 1" class="absolute inset-0 flex items-center justify-between px-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <button
              v-if="currentImageIndex > 0"
              @click.stop="prevImage"
              class="pointer-events-auto w-9 h-9 bg-white border-[2px] border-[#2C2C2C] shadow-[2px_2px_0px_0px_rgba(44,44,44,0.5)] rounded-full flex items-center justify-center hover:scale-105 transition-all text-[#2C2C2C]"
            >
              <ChevronLeft class="w-5 h-5" stroke-width="3" />
            </button>
            <div v-else class="w-9"></div>

             <button
              v-if="currentImageIndex < allImages.length - 1"
              @click.stop="nextImage"
              class="pointer-events-auto w-9 h-9 bg-white border-[2px] border-[#2C2C2C] shadow-[2px_2px_0px_0px_rgba(44,44,44,0.5)] rounded-full flex items-center justify-center hover:scale-105 transition-all text-[#2C2C2C]"
            >
              <ChevronRight class="w-5 h-5" stroke-width="3" />
            </button>
             <div v-else class="w-9"></div>
          </div>

           <div class="absolute bottom-3 right-3 bg-[#2C2C2C] text-white text-xs font-black px-2.5 py-1 rounded-md border-[2px] border-white pointer-events-none shadow-md">
            {{ currentImageIndex + 1 }} / {{ allImages.length }}
          </div>
        </div>
      </div>

      <div class="relative mb-4">
        <p
          class="text-sm leading-relaxed font-medium text-[#2C2C2C] whitespace-pre-line cursor-pointer line-clamp-2"
          @click="handleOpenLog"
          v-html="processedContent"
        >
        </p>
      </div>

      <div class="flex items-center justify-between pt-4 mt-2 border-t-[2px] border-[#F0F0F0]">
        <div class="flex items-center gap-2">
          <button
            @click="toggleLike"
            :class="[
              'flex items-center gap-1.5 px-3 py-1.5 border-[2px] border-[#2C2C2C] rounded-md font-black text-xs transition-all uppercase focus:outline-none shadow-[2px_2px_0px_0px_rgba(44,44,44,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none',
              isLiked
                ? 'bg-[#FF6B9D] text-white'
                : 'bg-white text-[#2C2C2C]',
            ]"
          >
            <Heart
              :class="['w-3.5 h-3.5', isLiked ? 'fill-current' : 'fill-none']"
              stroke-width="2.5"
            />
            <span>Like {{ currentLikes }}</span>
          </button>

          <button
            @click="handleOpenLog"
             class="flex items-center gap-1.5 px-3 py-1.5 border-[2px] border-[#2C2C2C] rounded-md font-black text-xs transition-all uppercase focus:outline-none bg-white text-[#2C2C2C] shadow-[2px_2px_0px_0px_rgba(44,44,44,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
          >
            <MessageCircle class="w-3.5 h-3.5" stroke-width="2.5" />
            <span>Comment {{ currentCommentCount }}</span>
          </button>
        </div>
      </div>
    </div>
    <Teleport to="body">
      <PlaceDetailModal v-if="selectedPlace" :place="selectedPlace" @close="selectedPlace = null" />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Heart,
  MessageCircle,
  Share2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-vue-next'
import PlaceDetailModal from '@/components/modal/PlaceDetailModal.vue'
import type { TripLogFeedItemDto } from '@/apis/trip-log/types';
import { likeTripLog, unlikeTripLog } from '@/apis/trip-log/index'

interface CourseItem {
  number: number
  name: string
}

const props = defineProps<TripLogFeedItemDto>();
const router = useRouter()

const navigateToUserLog = () => {
  if (props.authorId) {
    router.push({ name: 'user-log', params: { userId: props.authorId } })
  }
}
// State
const isLiked = ref(props.liked)
const currentLikes = ref(props.likeCount)
const currentCommentCount = ref(props.commentCount)
const currentImageIndex = ref(0)
const showToast = ref(false)
const toastMessage = ref('')

// Watch props for external updates (e.g. from modal sync)
import { watch } from 'vue'
watch(() => props.liked, (newVal) => isLiked.value = newVal)
watch(() => props.likeCount, (newVal) => currentLikes.value = newVal)
watch(() => props.commentCount, (newVal) => currentCommentCount.value = newVal)

// Modal States
const selectedPlace = ref<CourseItem | null>(null)

const emit = defineEmits<{
  (e: 'open-log', payload: { logId: number; authorId: number; liked: boolean }): void
}>()

const handleOpenLog = () => {
    emit('open-log', { logId: props.logId, authorId: props.authorId, liked: isLiked.value })
}

// Scrap Logic



// Images Logic
const allImages = computed(() => {
  // props.images가 존재하면, .map을 사용하여 imageUrl 속성만 추출
  if (props.images && props.images.length > 0) {
    return props.images.map(img => img.imageUrl);
  }
  return [];
});
const prevImage = () => {
   currentImageIndex.value = Math.max(0, currentImageIndex.value - 1)
}
const nextImage = () => {
    currentImageIndex.value = Math.min(allImages.value.length - 1, currentImageIndex.value + 1)
}

// Like Action
const toggleLike = async() => {
  let response
  if (isLiked.value){
    response = await unlikeTripLog(props.logId)
  } else {
    response = await likeTripLog(props.logId)
  }
  currentLikes.value = response.likeCount
  isLiked.value = !isLiked.value
}

// Share Action
const handleShare = async () => {
  const diaryUrl = `${window.location.origin}/diary/${props.logId}`

  try {
    await navigator.clipboard.writeText(diaryUrl)

    toastMessage.value = '링크가 복사되었습니다!'
    showToast.value = true

    setTimeout(() => {
      showToast.value = false
    }, 2500)
  } catch (err) {
    console.error('클립보드 복사 실패:', err)
  }
}



const handleModalUpdate = (payload: any) => {
  if (payload.type === 'like') {
    isLiked.value = payload.liked
    currentLikes.value = payload.likeCount
  } else if (payload.type === 'sync') {
    isLiked.value = payload.liked
    currentLikes.value = payload.likeCount
    if (typeof payload.commentCount === 'number') {
      currentCommentCount.value = payload.commentCount
    }
  }
}

// Course Badge Colors
//const colors = ['#FFD60A', '#FF6B9D', '#98D8C8', '#B4E4FF', '#E88555']
//const getBadgeColor = (idx: number) => colors[idx % colors.length]

const imageMap = computed(() => {
  const map = new Map<string, string>();
  if (props.images) {
    props.images.forEach(img => {
      map.set(img.imageRefKey, img.imageUrl);
    });
  }
  return map;
});

// 2. 본문 내용 처리: 플레이스홀더를 <img> 태그로 대체
const processedContent = computed(() => {
  let text = props.content || '';
  
  // 1. Remove {{img_key_...}} placeholders
  text = text.replace(/\{\{img_key_(\d+)\}\}/g, '');

  // 2. Remove raw <img> tags if any
  text = text.replace(/<img[^>]*>/g, '');

  return text;
});


</script>

<style scoped>
.course-badge:hover {
  background-color: var(--hover-color);
}
</style>
