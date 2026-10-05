<template>
  <div
    class="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-6 md:p-10 lg:p-20 font-sans"
  >
    <div class="w-full max-w-6xl mb-4">
      <h1
        class="text-4xl md:text-6xl cursor-pointer tracking-tighter transition-transform text-white font-bold inline-block"
      >
        <span class="bg-[#1b1d0d] px-4 py-1 rounded-t-2xl"
          >TRIT<span class="text-[#9BCCC4]">.</span></span
        >
      </h1>
    </div>

    <div
      class="w-full border-4 border-[#1b1d0d] max-w-6xl min-h-[60vh] md:min-h-[65vh] bg-white rounded-b-2xl rounded-tr-2xl shadow-[#1b1d0d] shadow-[8px_8px_0px_rgba(27,29,13,1)] overflow-hidden flex flex-col md:flex-row"
    >
      <!-- Left side: Slider (Hidden on small mobile if needed, or adjusted) -->
      <div
        class="hidden md:flex md:w-1/2 p-6 lg:p-10 border-b-4 md:border-b-0 md:border-r-2 border-[#1b1d0d] items-center justify-center bg-white"
      >
        <div
          class="w-full aspect-square max-w-md relative bg-white flex items-center justify-center overflow-visible"
        >
          <div class="w-full">
            <AuthSlider :slides="slides" />
          </div>
        </div>
      </div>

      <!-- Right side: Content -->
      <div class="w-full md:w-1/2 p-8 md:p-10 lg:p-16 flex flex-col justify-center bg-white">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AuthSlider from '@/components/auth/AuthSlider.vue'
import sliderImg1 from '@/assets/slider-img1.png'
import sliderImg2 from '@/assets/slider-img2.png'

// 슬라이더 항목의 타입을 정의합니다.
interface SlideItem {
  // 텍스트를 분리합니다.
  textBeforeHighlight: string
  highlightWord: string // 강조할 키워드
  textAfterHighlight: string
  content: string
  image: string
}

const slides: SlideItem[] = [
  {
    content: '여행 계획부터 여행 일기까지,',
    textBeforeHighlight: '당신의 여행을',
    highlightWord: '한 곳에',
    textAfterHighlight: '정리해보세요.',
    image: sliderImg1,
  },
  {
    content: '팔로우한 사람들의 여행 일지를 살펴보고,',
    textBeforeHighlight: '요즘 ',
    highlightWord: '핫한 여행지',
    textAfterHighlight: '를 확인해보세요.',
    image: sliderImg2,
  },
]
</script>
