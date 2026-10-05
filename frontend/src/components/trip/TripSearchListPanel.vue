<template>
  <div
    class="w-[300px] bg-white border-r-[3px] border-[#2C2C2C] flex flex-col h-full relative flex-shrink-0"
  >
    <div class="p-4 border-b-[2px] border-gray-200 flex items-center justify-between bg-gray-50">
      <h3 class="font-black text-[12px] uppercase tracking-wide text-[#2C2C2C]">
        Search Results ({{ results.length }})
      </h3>
      <button
        @click="$emit('close')"
        class="w-6 h-6 flex items-center justify-center hover:bg-gray-200 rounded transition-colors"
      >
        <X class="w-4 h-4 text-[#2C2C2C]" stroke-width="2.5" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-3 bg-white">
      <div v-if="isLoading" class="py-10 text-center">
        <div
          class="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2C2C2C] mx-auto mb-2"
        ></div>
        <p class="text-[10px] font-bold text-gray-400">검색 중...</p>
      </div>

      <template v-else-if="results.length > 0">
        <div
          v-for="place in results"
          :key="place.id"
          :ref="
            (el) => {
              if (el && place.kakaoPlaceId) itemRefs[place.kakaoPlaceId] = el as HTMLElement
            }
          "
          class="mb-3 last:mb-0"
        >
          <div
            @click="$emit('click-item', place)"
            class="p-3 border-[2px] border-[#2C2C2C] rounded-xl hover:shadow-[4px_4px_0px_0px_rgba(44,44,44,0.1)] transition-all bg-white group cursor-pointer"
            :class="[
              String(place.kakaoPlaceId) === String(selectedId)
                ? 'border-[#9BCCC4] bg-[#F0FAF9] shadow-[4px_4px_0px_0px_rgba(155,204,196,0.6)]'
                : 'border-[#2C2C2C] bg-white hover:border-[#9BCCC4] hover:shadow-[4px_4px_0px_0px_rgba(44,44,44,0.1)]',
            ]"
          >
            <div class="flex items-start gap-2 mb-2">
              <div
                class="w-8 h-8 rounded-lg border-[2px] border-[#2C2C2C] flex items-center justify-center flex-shrink-0 bg-[#9BCCC4]"
              >
                <component
                  :is="getCategoryIcon(place.category)"
                  class="w-4 h-4 text-[#2C2C2C]"
                  stroke-width="2.5"
                />
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 mb-0.5">
                  <h4 class="font-black text-[12px] text-[#2C2C2C] leading-tight truncate">
                    {{ place.name }}
                  </h4>
                  <a
                    v-if="place.url"
                    :href="place.url"
                    target="_blank"
                    class="text-gray-400 hover:text-[#2C2C2C] transition-colors flex-shrink-0"
                    title="카카오맵 상세정보"
                    @click.stop
                  >
                    <ExternalLink class="w-3 h-3" stroke-width="2.5" />
                  </a>
                </div>
                <span
                  class="inline-block px-1.5 py-0.5 rounded border-[1.5px] border-gray-200 text-[9px] font-bold text-gray-500 truncate max-w-full"
                >
                  {{ place.category }}
                </span>
              </div>
            </div>

            <p class="text-[10px] font-bold text-gray-500 mb-1 truncate px-1">
              {{ place.address }}
            </p>

            <p
              class="text-[10px] font-bold text-gray-400 mb-3 truncate px-1 flex items-center gap-1"
              :class="{ 'invisible select-none': !place.phone }"
            >
              <Phone class="w-3 h-3" />
              {{ place.phone || '00-0000-0000' }}
            </p>

            <button
              @click.stop="$emit('add-place', place)"
              class="w-full py-2 flex items-center justify-center gap-1 bg-[#2C2C2C] text-white rounded-lg hover:bg-black transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              <Plus class="w-3 h-3" stroke-width="3" />
              <span class="text-[10px] font-bold uppercase tracking-wide">Add to Plan</span>
            </button>
          </div>
        </div>
      </template>

      <div v-else class="py-10 text-center">
        <p class="text-[11px] font-bold text-gray-400">검색 결과가 없습니다.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue' // [2] watch, nextTick 추가
import { X, Plus, ExternalLink, Phone } from 'lucide-vue-next'
import type { Place } from '@/types/trip/place.model'
import { getCategoryIcon } from '@/utils/placeCategory'

const props = defineProps<{
  results: Place[]
  isLoading: boolean
  selectedId?: number | string | null
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'add-place', place: Place): void
  (e: 'click-item', place: Place): void
}>()

// [3] 스크롤 이동 로직 추가
const itemRefs = ref<Record<string | number, HTMLElement>>({})

// results가 바뀌면 refs 초기화 (새로운 검색 시)
watch(
  () => props.results,
  () => {
    itemRefs.value = {}
  },
)

// selectedId가 바뀌면 해당 요소로 스크롤
watch(
  () => props.selectedId,
  async (newId) => {
    if (newId) {
      await nextTick() // DOM 렌더링 완료 대기
      const targetElement = itemRefs.value[newId]

      if (targetElement) {
        // 부드럽게 스크롤 이동 & 가운데 정렬
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  },
)
</script>
