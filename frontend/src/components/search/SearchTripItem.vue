<template>
  <div
    class="bg-white border-[2px] border-[#2C2C2C] rounded-xl p-4 hover:shadow-[4px_4px_0px_0px_rgba(44,44,44,0.15)] transition-all cursor-pointer group"
  >
    <div class="flex items-center gap-4">
      <!-- Image Placeholder -->
      <div
        class="w-24 h-24 border-[2px] border-[#2C2C2C] rounded-lg overflow-hidden flex-shrink-0 bg-[#FFF8ED] flex items-center justify-center"
      >
          <Map :size="32" :stroke-width="2" class="text-[#2C2C2C] group-hover:scale-110 transition-transform duration-300" />
      </div>
      <!-- Content -->
      <div class="flex-1 min-w-0">
        <h5
          class="text-xl font-black mb-1 group-hover:text-[#E88555] transition-colors truncate"
        >
          {{ trip.title }}
        </h5>
        <div class="flex items-center gap-2 text-xs font-bold mb-2 text-gray-600">
          <MapPin :size="14" :stroke-width="2" />
          <span>{{ trip.spot_names.length }}개 장소</span>
          <span class="text-gray-400">•</span>
          <span>{{ duration }}</span>
        </div>
        <p class="text-sm font-medium text-gray-700 mb-2 line-clamp-2">
           {{ trip.spot_names.join(' - ') }}
        </p>
        <div class="flex items-center justify-between">
          <div class="flex gap-1.5 flex-wrap">
            <span
              v-for="(cat, idx) in trip.spot_categories.slice(0, 3)"
              :key="idx"
              class="px-2.5 py-0.5 bg-[#FFF8ED] border-[2px] border-[#2C2C2C] rounded-full text-xs font-black"
            >
              #{{ cat }}
            </span>
          </div>
          <!-- Views omitted as per plan -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Map, MapPin } from 'lucide-vue-next'
import type { TripSearchDoc } from '@/apis/search'

const props = defineProps<{
  trip: TripSearchDoc
}>()

const duration = computed(() => {
    if (!props.trip.start_date || !props.trip.end_date) return ''
    const start = new Date(props.trip.start_date)
    const end = new Date(props.trip.end_date)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 
    return `${diffDays} Days`
})

</script>
