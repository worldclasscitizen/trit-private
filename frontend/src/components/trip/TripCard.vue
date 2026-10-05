<template>
  <div
    class="bg-white border-[3px] border-[#2C2C2C] rounded-xl overflow-hidden cursor-pointer transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(44,44,44,1)] shadow-[4px_4px_0px_0px_rgba(44,44,44,1)]"
    @click="emit('openModal', trip.id)"
  >
    <div class="p-5 border-b-[3px] border-[#2C2C2C]" :style="{ backgroundColor: headerColor }">
      <div class="flex items-center justify-between mb-3 h-6">
        <div class="flex items-center gap-1.5 text-xs text-[#2C2C2C] font-bold">
          <Calendar class="w-3.5 h-3.5" stroke-width="2.5" />
          <span>{{ displayDateRange }}</span>
        </div>

        <div v-if="isEditable" class="flex items-center gap-1.5">
          <!-- Status Toggle Button -->
          <button
            @click.stop="emit('copy', trip.id)"
            class="w-7 h-7 border-[2px] border-[#2C2C2C] rounded-md hover:shadow-[2px_2px_0px_0px_rgba(44,44,44,0.8)] hover:translate-x-[-1px] hover:translate-y-[-1px] flex items-center justify-center transition-all focus:outline-none bg-white"
            title="여행 복사"
          >
            <Copy class="w-3.5 h-3.5 text-[#2C2C2C]" stroke-width="2.5" />
          </button>

          <button
            v-if="trip.isOwner"
            @click.stop="handleToggleStatus"
            class="w-7 h-7 border-[2px] border-[#2C2C2C] rounded-md hover:shadow-[2px_2px_0px_0px_rgba(44,44,44,0.8)] hover:translate-x-[-1px] hover:translate-y-[-1px] flex items-center justify-center transition-all focus:outline-none"
            :class="[trip.status===TripStatus.COMPLETED ? 'bg-[#E88555]' : 'bg-white']"
            :title="trip.status === TripStatus.COMPLETED ? '계획중으로 변경' : '완료 처리'"
          >
            <Check 
            class="w-4 h-4 text-[#2C2C2C]" 
            stroke-width="3" />
          </button> 
        </div>
      </div>

      <div class="overflow-hidden relative group/text w-full">
        <h3
          ref="titleRef"
          class="font-black text-2xl tracking-tight leading-tight text-[#2C2C2C] font-sans whitespace-nowrap block transition-none group-hover/text:transition-transform group-hover/text:ease-linear"
          :class="{ 'group-hover/text:-translate-x-[var(--scroll-amount)]': isOverflowing }"
          :style="{ '--scroll-amount': scrollAmount + 'px', transitionDuration: duration + 's' }"
        >
          {{ trip.title }}
        </h3>
      </div>
    </div>

    <div class="p-5 bg-white">
      <div class="flex items-center gap-2 mb-4">
        <MapPin class="w-4 h-4 text-[#2C2C2C]" stroke-width="2.5" />
        <span class="text-sm font-black text-[#2C2C2C] truncate">
          {{ trip.locationSummary || `코스 ${trip.spots}개` }}
        </span>
      </div>

      <div class="space-y-2">
        <div
          v-for="(spot, index) in trip.spotPreviews"
          :key="index"
          class="flex items-center gap-3 py-1"
        >
          <div
            class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 border-[2.5px] border-[#2C2C2C]"
            :style="{ backgroundColor: getNumberColor(index) }"
          >
            {{ index + 1 }}
          </div>
          <span class="text-sm font-bold text-[#2C2C2C] truncate">{{ spot.name }}</span>
        </div>
      </div>

      <div class="mt-4 text-center h-[20px]">
        <button
          v-if="trip.spots > trip.spotPreviews.length"
          class="text-xs font-black text-[#2C2C2C] hover:underline focus:outline-none"
        >
          +{{ trip.spots - trip.spotPreviews.length }}개 더보기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { Calendar, MapPin, Check, Copy } from 'lucide-vue-next'
import type { TripResponseDto } from '@/apis/trip/types'
import { updateTrip } from '@/apis/trip/index'
import { TripStatus } from '@/types/common'

const props = withDefaults(defineProps<{
  trip: TripResponseDto,
  isEditable?: boolean
}>(),
  {
    isEditable: true
  }
)
const emit = defineEmits<{
  (e: 'openModal', id: number): void
  (e: 'navigate', page: string, id?: number): void
  (e: 'refresh'): void
  (e: 'copy', id: number): void
}>()

const statusColors: Record<TripStatus, string> = {
  COMPLETED: '#F9CA6B',
  PLANNED: '#9BCCC4',
  DRAFT: '#E88555',
}

const headerColor = computed(() => statusColors[props.trip.status] || '#9BCCC4')

const numberColors = ['#F9CA6B', '#9BCCC4', '#E88555']
const getNumberColor = (idx: number) => numberColors[idx % numberColors.length]

const handleToggleStatus = async () => {
  const newStatus = props.trip.status === TripStatus.COMPLETED ? TripStatus.PLANNED : TripStatus.COMPLETED
  try {
    await updateTrip(props.trip.id, { status: newStatus })
    emit('refresh')
  } catch (error) {
    console.error('Failed to toggle status:', error)
    alert('상태 변경에 실패했습니다.')
  }
}

const displayDateRange = computed(() => {
  const start = props.trip.startDate
  const completed = props.trip.completedDate

  if (start) {
    return start
  } else if (completed) {
    return completed
  } else {
    return '날짜 미정'
  }
})

const titleRef = ref<HTMLElement | null>(null)
const isOverflowing = ref(false)
const scrollAmount = ref(0)
const duration = ref(0)

const checkOverflow = async () => {
  await nextTick()
  const el = titleRef.value
  if (el) {
    if (el.scrollWidth > el.clientWidth) {
      isOverflowing.value = true
      scrollAmount.value = el.scrollWidth - el.clientWidth
      duration.value = scrollAmount.value * 0.01
    } else {
      isOverflowing.value = false
      scrollAmount.value = 0
      duration.value = 0
    }
  }
}

onMounted(checkOverflow)
watch(() => props.trip.title, checkOverflow)
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
