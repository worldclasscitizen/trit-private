<template>
  <div
    v-if="place"
    class="h-40 bg-white border-t-[3px] border-[#2C2C2C] flex relative flex-shrink-0 overflow-hidden cursor-pointer hover:bg-gray-50 transition-colors"
    @click="$emit('open-detail', place)"
  >
    <!-- Left: Image Section -->
    <div class="w-[160px] h-full flex-shrink-0 relative border-r border-gray-100 bg-gray-50">
        <img v-if="place.thumbnailUrl" :src="place.thumbnailUrl" class="w-full h-full object-cover" />
        <div v-else class="w-full h-full flex items-center justify-center">
             <MapPin :size="24" class="text-gray-300" />
        </div>
    </div>

    <!-- Right: Content Section -->
    <div class="flex-1 p-4 flex flex-col min-w-0 bg-transparent">
       <!-- Close Button -->
       <button
          @click.stop="$emit('close')"
          class="absolute top-3 right-3 p-1 text-gray-400 hover:text-[#2C2C2C] hover:bg-gray-200 rounded-full transition-colors z-10"
        >
          <X :size="16" />
        </button>

       <!-- Category & Rating -->
       <div class="flex items-center gap-2 mb-1">
          <span class="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">
             {{ place.category }}
          </span>
          <div class="flex items-center gap-1 -ml-1 scale-90 origin-left">
             <Star :size="12" class="fill-[#FFD60A] text-[#FFD60A]" />
             <span class="text-xs font-black text-[#2C2C2C]">{{ reviewStats.averageRating.toFixed(1) }}</span>
             <span class="text-[10px] text-gray-400 font-medium">({{ reviewStats.reviewCount }})</span>
          </div>
       </div>

       <!-- Title -->
       <div class="mb-auto pr-6">
          <h3 class="text-lg font-black text-[#2C2C2C] leading-tight group-hover:text-[#9BCCC4] transition-colors truncate">
              {{ place.name }}
          </h3>
       </div>

       <!-- Info -->
       <div class="mt-2 space-y-1.5">
           <div class="flex items-center gap-1.5 text-xs font-bold text-gray-600">
             <MapPin :size="13" class="flex-shrink-0 text-gray-400" />
             <span class="truncate">{{ place.address }}</span>
           </div>
           
           <div v-if="place.phone" class="flex items-center gap-1.5 text-xs font-bold text-gray-600">
             <Phone :size="13" class="flex-shrink-0 text-gray-400" />
             <span class="truncate">{{ place.phone }}</span>
           </div>

           <div v-if="place.placeUrl" class="flex items-center gap-1.5 group/link cursor-pointer" @click.stop>
             <ArrowUpRight :size="13" class="flex-shrink-0 text-gray-400 group-hover/link:text-[#9BCCC4] transition-colors" />
             <a :href="place.placeUrl" target="_blank" class="text-xs text-gray-400 group-hover/link:text-[#9BCCC4] underline decoration-gray-300 underline-offset-2 transition-colors">
               상세보기
             </a>
           </div>
       </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { X, MapPin, Globe, Star, MessageSquare, ArrowUpRight, Phone } from 'lucide-vue-next'
import type { SpotResponseDto } from '@/apis/trip/types'
import { spotReviewApi } from '@/apis/spot-review'

const props = defineProps<{
  place: SpotResponseDto | null
}>()

const emit = defineEmits(['close', 'open-detail'])

const reviewStats = ref({ averageRating: 0, reviewCount: 0 })



const fetchReviewStats = async () => {
    if(!props.place?.id) return
    try {
        // Backend expects 'spotId' (number) but place might be from Kakao search (no ID yet if not saved)
        // Check if place has an ID. If it's pure Kakao data in search phase, it might not have our DB ID.
        // However, trip items usually have DB ID if saved. 
        // If place.id is missing or looks like kakao ID, we might need check/create logic which exists in 'createSpot'.
        // But for this panel appearing in search, it's safer to just show 0 if no ID.
        if (props.place.id) {
             const stats = await spotReviewApi.getSpotReviewStats(props.place.id)
             reviewStats.value = stats
        } else {
             reviewStats.value = { averageRating: 0, reviewCount: 0 }
        }
    } catch (e) {
        console.error("Failed to fetch stats", e)
        reviewStats.value = { averageRating: 0, reviewCount: 0 }
    }
}

watch(() => props.place, () => {
    fetchReviewStats()
}, { immediate: true })

</script>
