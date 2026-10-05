<template>
  <div class="bg-white border-b-[3px] border-[#2C2C2C] px-6 py-3 flex-shrink-0">
    <div class="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
      <!-- Back Button -->
      <button
        @click="$emit('back')"
        class="w-10 h-10 bg-white border-[2px] border-[#2C2C2C] rounded-lg hover:shadow-[2px_2px_0px_0px_rgba(44,44,44,0.8)] hover:translate-x-[-1px] hover:translate-y-[-1px] flex items-center justify-center transition-all flex-shrink-0"
        :title="isEditMode ? '취소' : '뒤로가기'"
      >
        <ArrowLeft class="w-5 h-5" stroke-width="2.5" />
      </button>

      <!-- Title -->
      <div class="flex-1">
        <input
          v-if="isEditMode"
          :value="tripTitle"
          @input="$emit('update:tripTitle', ($event.target as HTMLInputElement).value)"
          type="text"
          placeholder="여행 이름을 입력하세요"
          class="w-full px-3 py-2 border-[2px] border-[#2C2C2C] rounded-lg font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#9BCCC4]"
        />
        <div
          v-else
          class="w-full px-3 py-2 border-[2px] border-gray-300 rounded-lg font-bold text-sm bg-gray-50"
        >
          {{ tripTitle || '여행 이름' }}
        </div>
      </div>

      <!-- Right Section -->
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-2 pr-2 border-r-[2px] border-gray-300 text-sm">
          <!-- Date -->
          <div class="flex items-center">
            <template v-if="isEditMode">
              <input
                :value="tripDate"
                @input="$emit('update:tripDate', ($event.target as HTMLInputElement).value)"
                type="date"
                class="px-3 py-2 border-[2px] border-[#2C2C2C] rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#9BCCC4] cursor-pointer bg-white"
              />
            </template>
            <div v-else class="px-3 py-2 border-[2px] border-gray-300 rounded-lg bg-gray-50">
              <span class="font-bold text-gray-700">{{ formattedDate }}</span>
            </div>
          </div>

          <!-- Status -->
          <div class="flex items-center">
            <template v-if="isEditMode">
              <select
                :value="tripStatus || 'PLANNED'"
                @change="$emit('update:tripStatus', $event.target.value)"
                class="px-3 py-2 border-[2px] border-[#2C2C2C] rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#9BCCC4] cursor-pointer bg-white"
              >
                <option v-for="s in userSelectableStatuses" :key="s" :value="s">{{ s }}</option>
              </select>
            </template>
            <div v-else class="px-3 py-2 border-[2px] border-gray-300 rounded-lg bg-gray-50">
              <span class="font-bold text-gray-700">{{ tripStatus || 'PLANNED' }}</span>
            </div>
          </div>

          <!-- Visibility -->
          <div class="flex items-center">
            <template v-if="isEditMode">
              <select
                :value="tripVisibility || 'PUBLIC'"
                @change="$emit('update:tripVisibility', $event.target.value)"
                class="px-3 py-2 border-[2px] border-[#2C2C2C] rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#9BCCC4] cursor-pointer bg-white"
              >
                <option value="PUBLIC">PUBLIC</option>
                <option value="PRIVATE">PRIVATE</option>
              </select>
            </template>
            <div v-else class="px-3 py-2 border-[2px] border-gray-300 rounded-lg bg-gray-50">
              <span class="font-bold text-gray-700">{{ tripVisibility || 'PUBLIC' }}</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <template v-if="isEditMode">
          <button
            @click="$emit('save')"
            class="flex items-center gap-2 px-4 py-2 bg-[#F9CA6B] border-[2px] border-[#2C2C2C] rounded-lg font-black text-sm tracking-tight shadow-[3px_3px_0px_0px_rgba(44,44,44,1)] hover:shadow-[4px_4px_0px_0px_rgba(44,44,44,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all uppercase flex-shrink-0"
          >
            <Save class="w-4 h-4" stroke-width="3" /> Save
          </button>
          <button
              @click="$emit('delete')"
              class="w-10 h-10 bg-white border-[2px] border-[#2C2C2C] rounded-lg flex items-center justify-center transition-all flex-shrink-0 shadow-[3px_3px_0px_0px_rgba(44,44,44,1)] hover:shadow-[4px_4px_0px_0px_rgba(44,44,44,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]"
              title="삭제"
            >
              <Trash2 class="w-5 h-5" stroke-width="2.5" />
            </button>
        </template>
        <template v-else>
          <div class="flex items-center gap-2">
            <button
              @click="$emit('edit')"
              class="flex items-center gap-2 px-4 py-2 bg-[#9BCCC4] border-[2px] border-[#2C2C2C] rounded-lg font-black text-sm tracking-tight shadow-[3px_3px_0px_0px_rgba(44,44,44,1)] hover:shadow-[4px_4px_0px_0px_rgba(44,44,44,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all uppercase flex-shrink-0"
            >
              <Edit class="w-4 h-4" stroke-width="3" /> Edit
            </button>
            <button
              @click="$emit('delete')"
              class="w-10 h-10 bg-white border-[2px] border-[#2C2C2C] rounded-lg flex items-center justify-center transition-all flex-shrink-0 shadow-[3px_3px_0px_0px_rgba(44,44,44,1)] hover:shadow-[4px_4px_0px_0px_rgba(44,44,44,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]"
              title="삭제"
            >
              <Trash2 class="w-5 h-5" stroke-width="2.5" />
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowLeft, Save, Edit, Trash2, MapPin } from 'lucide-vue-next'
import { TripStatus } from '@/types/common'
import type { TripVisibility } from '@/types/trip/trip.model'

const props = withDefaults(
  defineProps<{
    tripTitle: string
    tripDate: string
    formattedDate: string
    isEditMode: boolean
    totalPlacesCount: number
    tripStatus: TripStatus | null
    tripVisibility: TripVisibility | null
  }>(),
  {
    tripStatus: TripStatus.PLANNED,
    tripVisibility: 'PUBLIC' as any,
  },
)

defineEmits<{
  (e: 'back'): void
  (e: 'save'): void
  (e: 'delete'): void
  (e: 'edit'): void
  (e: 'update:tripTitle', value: string): void
  (e: 'update:tripDate', value: string): void
  (e: 'update:tripStatus', value: TripStatus): void
  (e: 'update:tripVisibility', value: TripVisibility): void
}>()

const userSelectableStatuses = computed(() => {
  const statuses = Object.values(TripStatus)
  return statuses.filter((s) => s !== TripStatus.DRAFT)
})
</script>