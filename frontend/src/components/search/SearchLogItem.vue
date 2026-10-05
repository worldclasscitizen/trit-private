<template>
  <div
    class="bg-white border-[2px] border-[#2C2C2C] rounded-xl p-4 hover:shadow-[4px_4px_0px_0px_rgba(44,44,44,0.15)] transition-all cursor-pointer group"
  >
    <div class="flex gap-4">
      <!-- Images Grid (Left side) -->
      <div v-if="log.image_urls && log.image_urls.length > 0" class="w-32 h-32 flex-shrink-0">
         <!-- Single Image -->
        <div
          v-if="log.image_urls.length === 1"
          class="w-full h-full border-[2px] border-[#2C2C2C] rounded-lg overflow-hidden"
        >
          <img
            :src="log.image_urls[0]"
            :alt="log.title"
            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            @error="handleImageError"
          />
        </div>
        <!-- Multiple Images (Max 4) -->
        <div
          v-else
          class="grid grid-cols-2 gap-1 w-full h-full border-[2px] border-[#2C2C2C] rounded-lg overflow-hidden bg-white"
        >
          <div
            v-for="(img, idx) in log.image_urls.slice(0, 4)"
            :key="idx"
            class="overflow-hidden relative h-full"
          >
            <img
              :src="img"
              :alt="`${log.title} ${idx + 1}`"
              class="w-full h-full object-cover absolute inset-0"
              @error="handleImageError"
            />
             <!-- Overlay for +N on the 4th image if more exist -->
             <div 
               v-if="idx === 3 && log.image_urls.length > 4" 
               class="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold"
             >
                +{{ log.image_urls.length - 4 }}
             </div>
          </div>
        </div>
      </div>
      
      <!-- Fallback if no images (Optional: Show placeholder or just Icon) -->
      <div v-else class="w-32 h-32 flex-shrink-0 border-[2px] border-[#2C2C2C] rounded-lg overflow-hidden bg-[#FFF8ED] flex items-center justify-center">
         <BookOpen :size="32" :stroke-width="2" class="text-[#2C2C2C]" />
      </div>

      <!-- Content (Right side) -->
      <div class="flex-1 min-w-0 flex flex-col justify-center">
        
        <!-- Date & Location -->
        <div class="flex items-center gap-2 mb-2 text-xs font-bold text-gray-500">
             <span>{{ formatDate(log.created_at) }}</span>
             <span class="text-gray-300">|</span>
             <MapPin :size="12" :stroke-width="2" />
             <span class="truncate">{{ log.trip_location_summary || '위치 정보 없음' }}</span>
        </div>

        <!-- Title -->
        <h5
          class="text-lg font-black mb-1 group-hover:text-[#9BCCC4] transition-colors truncate"
        >
          {{ log.title }}
        </h5>

        <!-- Content Snippet -->
        <p class="text-sm font-medium text-gray-700 mb-0 line-clamp-2">
          {{ stripHtml(log.content) }}
        </p>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MapPin, BookOpen } from 'lucide-vue-next'
import type { TripLogSearchDoc } from '@/apis/search'

defineProps<{
  log: TripLogSearchDoc
}>()

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  // target.src = '/images/no-image.jpg' // Placeholder logic
}

const formatDate = (dateStr: string) => {
    if(!dateStr) return ''
    return dateStr.split('T')[0].replaceAll('-', '.')
}

const stripHtml = (html: string) => {
  if (!html) return ''
  return html.replace(/<[^>]*>?/gm, '')
}
</script>
