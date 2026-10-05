<template>
  <div
    v-if="isLoading"
    class="fixed inset-0 bg-black/60 flex flex-col items-center justify-center z-[70] p-6"
    @click="emit('close')"
  >
    <button
      @click.stop="emit('close')"
      class="absolute top-6 right-6 z-10 text-white hover:opacity-80 transition-opacity"
    >
      <span class="font-black text-3xl drop-shadow-[2px_2px_6px_rgba(0,0,0,0.6)]">✕</span>
    </button>
    
    <div 
        class="relative w-full max-w-4xl h-[85vh] bg-white rounded-xl flex items-center justify-center shadow-2xl"
        @click.stop
    >
        <div class="w-12 h-12 border-[4px] border-[#2C2C2C] border-t-transparent rounded-full animate-spin"></div>
    </div>
  </div>
  
  <div
    v-else-if="error"
    class="fixed inset-0 bg-black/60 flex flex-col items-center justify-center z-[70] p-6"
    @click="emit('close')"
  >
    <div class="text-red-500 font-black text-2xl bg-white p-8 rounded-lg">
      {{ error }}
    </div>
  </div>

  <TripDetailModal
    v-else-if="tripDetail && logDetail"
    :trip="tripDetail"
    :initial-tab="'log'"
    :log-data="logDetail"
    :initial-is-liked="props.initialLiked"
    @close="emit('close')"
    @refresh="fetchLogDetail"
    @update="emit('update', $event)"
    @edit="emit('edit', $event)"
    @edit-log="emit('edit-log', $event)"
    @delete-log="(id) => { emit('delete-log', id); emit('close') }"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, watchEffect } from 'vue'
import { getTripDetail } from '@/apis/trip/index'
import { getTripLogDetail } from '@/apis/trip-log/index'
import type { TripDetailResponseDto } from '@/apis/trip/types'
import type { TripLogDetail } from '@/types/trip/trip.model'
import TripDetailModal from './TripDetailModal.vue'

const props = defineProps<{
  logId: number
  authorId?: number // Optional since it might be missing in some contexts, but passed from feed
  initialLiked?: boolean
}>()

const emit = defineEmits(['close', 'update', 'edit', 'edit-log', 'refresh'])

const logDetail = ref<TripLogDetail | null>(null)
const tripDetail = ref<TripDetailResponseDto | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

// 데이터 로드
const fetchLogDetail = async () => {
  try {
    if(!logDetail.value) isLoading.value = true
    error.value = null
    
    // 1. Log 상세 조회
    const fetchedLogDetail = await getTripLogDetail(props.logId)
    logDetail.value = {
      ...fetchedLogDetail,
      logId: props.logId,
      authorId: props.authorId || fetchedLogDetail.authorId || 0
    }

    // 2. Trip 상세 조회 (Log에 연결된 Trip)
    if (fetchedLogDetail.tripId) {
       try {
          const fetchedTripDetail = await getTripDetail(fetchedLogDetail.tripId)
          tripDetail.value = {
            ...fetchedTripDetail,
            logId: props.logId
          }
       } catch (e: any) {
          // 403 error means the trip is PRIVATE and user doesn't have access
          // Public Log but Private Trip is a valid case (only show log)
          // But TripDetailModal usually requires trip data.
          // In this case, we might need a fallback or display error.
          if (e?.response?.status === 403) {
            console.warn('Trip is PRIVATE or access denied')
            // If we can't load trip, we probably can't show the modal fully 
            // as it depends on trip data structure.
            error.value = '비공개 여행 일정입니다.' 
          } else {
            throw e
          }
       }
    }
  } catch (e) {
    console.error('Failed to fetch data:', e)
    error.value = '데이터를 불러오는 데 실패했습니다.'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchLogDetail)
</script>

<style scoped>
.course-badge:hover {
  background-color: var(--hover-color);
}

.no-animation-enter-active,
.no-animation-leave-active {
  transition: none;
}
</style>

