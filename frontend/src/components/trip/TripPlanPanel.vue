<template>
  <div
    class="bg-white border-r-[3px] border-[#2C2C2C] flex flex-col h-full relative flex-shrink-0 z-20"
  >
    <div v-if="isEditMode" class="p-3 border-b-[2px] border-gray-200 relative">
      <div class="relative">
        <input
          v-model="localSearchQuery"
          @keyup.enter="$emit('search')"
          type="text"
          placeholder="장소를 검색하세요 (Enter)"
          class="w-full pl-8 pr-3 py-2 border-[2px] border-[#2C2C2C] rounded-xl font-bold text-[11px] focus:outline-none focus:ring-2 focus:ring-[#9BCCC4] transition-all"
        />
        <Search
          class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer hover:text-[#2C2C2C]"
          @click="$emit('search')"
          stroke-width="2.5"
        />
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-3 bg-gray-50">
      <div class="flex items-center gap-1 mb-2.5 overflow-x-auto no-scrollbar">
        <button
          v-for="day in days"
          :key="day.dayNumber"
          @click="$emit('update:activeDay', day.dayNumber)"
          :class="[
            'px-2.5 py-1 rounded-md font-black text-[9px] uppercase tracking-wide transition-all flex-shrink-0',
            activeDay === day.dayNumber
              ? 'bg-[#2C2C2C] text-white border-[2px] border-[#2C2C2C]'
              : 'bg-white text-gray-600 border-[2px] border-gray-300 hover:border-[#2C2C2C]',
          ]"
        >
          Day {{ day.dayNumber }}
        </button>
        <button
          v-if="isEditMode"
          @click="$emit('add-day')"
          class="px-1.5 py-1 bg-[#F9CA6B] border-[2px] border-[#2C2C2C] rounded-md font-black text-[9px] uppercase tracking-wide hover:shadow-[2px_2px_0px_0px_rgba(44,44,44,0.3)] transition-all flex-shrink-0"
        >
          <Plus class="w-3 h-3" stroke-width="3" />
        </button>
      </div>

      <div class="flex items-center justify-between mb-2">
        <h3 class="font-black text-[9px] uppercase tracking-wide text-gray-700">
          Selected ({{ currentDayPlaces.length }})
        </h3>
        <button
          v-if="isEditMode && days.length > 1"
          @click="$emit('remove-day', activeDay)"
          class="text-[8px] font-bold text-red-600 hover:text-red-700 uppercase tracking-wide"
        >
          Delete Day {{ activeDay }}
        </button>
      </div>

      <div v-if="currentDayPlaces.length > 0">
        <draggable
          v-model="currentDayPlaces"
          item-key="id"
          class="space-y-1.5 mb-4"
          ghost-class="opacity-50"
          :disabled="!isEditMode"
          :animation="200"
        >
          <template #item="{ element: place, index }">
            <div
              @click="$emit('click-place', place)"
              class="p-4 bg-white border-[2px] border-[#2C2C2C] rounded-xl hover:shadow-[2px_2px_0px_0px_rgba(44,44,44,0.2)] transition-all group flex items-center gap-3 cursor-pointer"
              :class="{ 'cursor-move': isEditMode }"
            >
              <div v-if="isEditMode" class="drag-handle flex-shrink-0 cursor-grab">
                <GripVertical class="w-3 h-3 text-gray-400" stroke-width="2.5" />
              </div>
              <div
                class="w-7 h-7 rounded border-[2px] border-[#2C2C2C] flex items-center justify-center font-black text-[11.5px] flex-shrink-0 bg-[#9BCCC4]"
              >
                {{ index + 1 }}
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-black text-[12.5px] truncate leading-tight">{{ place.name }}</h4>
                <p class="text-[10px] font-bold text-gray-600 truncate">{{ place.category }}</p>
              </div>

              <button
                v-if="isEditMode"
                @click.stop="$emit('remove-place', index)"
                class="w-4 h-4 bg-red-50 border-[1px] border-red-300 rounded hover:bg-red-100 flex items-center justify-center transition-colors flex-shrink-0"
              >
                <X class="w-2.5 h-2.5 text-red-600" stroke-width="2.5" />
              </button>
            </div>
          </template>
        </draggable>
      </div>

      <div v-else class="text-center py-6 mb-4">
        <div
          class="w-10 h-10 bg-gray-100 border-[2px] border-gray-300 rounded-lg mx-auto mb-2 flex items-center justify-center"
        >
          <MapPin class="w-5 h-5 text-gray-400" stroke-width="2" />
        </div>
        <p class="text-[11px] font-bold text-gray-500">아직 선택된 장소가 없어요</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import draggable from 'vuedraggable'
import { Search, MapPin, Plus, GripVertical, X } from 'lucide-vue-next'
import type { Place } from '@/types/trip/place.model'

interface DayPlan {
  dayNumber: number
  places: Place[]
}

const props = defineProps<{
  days: DayPlan[]
  activeDay: number
  isEditMode: boolean
  searchQuery: string
}>()

const emit = defineEmits<{
  (e: 'update:searchQuery', val: string): void
  (e: 'update:activeDay', val: number): void
  (e: 'search'): void
  (e: 'remove-place', index: number): void
  (e: 'add-day'): void
  (e: 'remove-day', dayNum: number): void
  (e: 'update-places', newPlaces: Place[]): void
  (e: 'click-place', place: Place): void
}>()

const localSearchQuery = computed({
  get: () => props.searchQuery,
  set: (newValue: string) => {
    emit('update:searchQuery', newValue)
  }
})

const currentDayPlaces = computed<Place[]>({ 
    get: () => {
        const day = props.days.find((d) => d.dayNumber === props.activeDay)
        return day ? day.places : []
    },
    set: (newPlaces: Place[]) => {
        emit('update-places', newPlaces) 
    }
})

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
