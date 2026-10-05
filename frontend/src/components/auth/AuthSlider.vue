<template>
  <div class="w-full max-w-sm mx-auto text-center">
    <div class="min-h-[360px] flex items-center justify-center relative pb-20">
      <transition name="slide" mode="out-in">
        <div
          :key="currentSlideIndex"
          class="flex flex-col items-center justify-center text-center"
        >
          <div class="mb-1 w-32 h-32 md:w-40 md:h-40 lg:w-[340px] lg:h-[340px]">
            <img
              v-if="currentSlide!.image"
              :src="getAssetUrl(currentSlide!.image)"
              :alt="currentSlide!.highlightWord"
              class="w-full h-full object-contain"
            />
            <div
              v-else
              class="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center text-5xl opacity-80 border border-dashed border-gray-400 text-gray-400"
            >
              🖼️
            </div>
          </div>

          <p class="text-xl font-bold mb-2 text-gray-800">
            {{ currentSlide!.content }}
          </p>

          <p class="text-xl font-semibold text-gray-800">
            {{ currentSlide!.textBeforeHighlight }}<span class="bg-[#CFF500] rounded-lg px-1">{{ currentSlide!.highlightWord }}</span>{{ currentSlide!.textAfterHighlight }}
          </p>
        </div>
      </transition>

      <div class="flex justify-center space-x-2 absolute bottom-1 left-1/2 -translate-x-1/2">
        <span
          v-for="(_, index) in props.slides"
          :key="index"
          @click="goToSlide(index)"
          :class="[
            'h-2 w-2 rounded-full cursor-pointer transition-all duration-300',
            currentSlideIndex === index ? 'bg-gray-700 w-5' : 'bg-gray-700'
          ]"
        ></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

interface SlideItem {
  textBeforeHighlight: string;
  highlightWord: string;
  textAfterHighlight: string;
  content: string;
  image: string;
}

interface SliderProps {
  slides: SlideItem[];
  interval?: number;
}

const props = withDefaults(defineProps<SliderProps>(), {
  interval: 5000,
});

const currentSlideIndex = ref(0);
let timer: number | null = null;

// 현재 슬라이드
const currentSlide = computed(() => {
  return props.slides[currentSlideIndex.value];
});

// 이미지 경로 처리
const getAssetUrl = (path?: string): string => {
  if (!path) return '';
  return new URL(path, import.meta.url).href;
};

// 다음 슬라이드
const nextSlide = () => {
  currentSlideIndex.value =
    (currentSlideIndex.value + 1) % props.slides.length;
};

// 특정 슬라이드로 이동
const goToSlide = (index: number) => {
  currentSlideIndex.value = index;
  resetTimer();
};

// 타이머
const startTimer = () => {
  timer = window.setInterval(nextSlide, props.interval);
};

const resetTimer = () => {
  if (timer) clearInterval(timer);
  startTimer();
};

onMounted(startTimer);
onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: opacity 0.6s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
}
</style>
