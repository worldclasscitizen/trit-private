<script setup lang="ts">
import { ref, computed } from 'vue';
import type { UserAIAnalysisResponseDto } from '@/apis/user/types'
import { requestFetchUserAIAnalysis } from '@/apis/user/index'
import { WandSparkles, Sparkles } from 'lucide-vue-next';

const analysisData = ref<UserAIAnalysisResponseDto | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

const props = defineProps<{
  initialSummary?: string | null
  isMyProfile?: boolean
}>()

const emit = defineEmits<{
  (e: 'analysis-completed'): void
}>()

const fetchAnalysisData = async () => {
  isLoading.value = true
  error.value = null
  analysisData.value = null

  try {
    const response = await requestFetchUserAIAnalysis()
    analysisData.value = response
    emit('analysis-completed')
  } catch (err) {
    console.error("Failed to fetch analysis data:", err);
    error.value = "데이터를 불러오는 데 실패했습니다.";
  } finally {
    isLoading.value = false
  }
}

const formattedData = computed(() => {
  // 1. 분석된 데이터가 있으면 그것을 우선 사용
  if (analysisData.value) {
    const { keywords, summary, scores } = analysisData.value
    return {
      type: 'full',
      summary,
      keywords,
      preferences: formatScores(scores)
    }
  }

  // 2. 초기 요약본(initialSummary)이 있을 때 처리
  if (props.initialSummary) {
    try {
      // 2-1. JSON 형식인지 확인하여 파싱 시도
      const parsed = JSON.parse(props.initialSummary)

      // 파싱된 데이터가 분석 데이터 구조를 가지고 있는지 확인
      if (parsed.keywords && parsed.scores && parsed.summary) {
         return {
          type: 'full',
          summary: parsed.summary,
          keywords: parsed.keywords,
          preferences: formatScores(parsed.scores)
        }
      }
    } catch {
      // JSON 파싱 실패 시 일반 텍스트 요약으로 처리
    }

    // 2-2. JSON이 아니거나 구조가 다르면 단순 요약으로 처리
    return {
      type: 'summary',
      summary: props.initialSummary,
      keywords: [],
      preferences: []
    }
  }

  // 3. 데이터 없음
  return null
})

const formatScores = (scores: { rest: number, exploration: number, activity: number, gourmet: number }) => {
  const rawPreferences = [
    { name: "휴식", key: 'rest', value: Math.min(100, Math.max(0, scores.rest)) },
    { name: "탐험", key: 'exploration', value: Math.min(100, Math.max(0, scores.exploration)) },
    { name: "활동", key: 'activity', value: Math.min(100, Math.max(0, scores.activity)) },
    { name: "미식", key: 'gourmet', value: Math.min(100, Math.max(0, scores.gourmet)) },
  ];

  return rawPreferences.map((pref, index) => ({
    ...pref,
    colorClass: GAUGE_COLORS[index % GAUGE_COLORS.length]
  }));
}

// --- 게이지 색상 정의 ---
const GAUGE_COLORS = [
  'bg-[#9BCCC4]', // 1. 휴식
  'bg-[#87C3E1]', // 2. 탐험
  'bg-[#FFCD74]', // 3. 활동
  'bg-[#FF8888]', // 4. 미식
];
</script>

<template>
  <!-- 1. 데이터 없음 -->
  <div v-if="!formattedData && !isLoading && !error" class="bg-white border-[3px] border-[#2C2C2C] rounded-[15px] p-8 shadow-[4px_4px_0px_0px_rgba(44,44,44,1)] flex flex-col items-center justify-center gap-4 relative min-h-[150px]">
      <div class="absolute top-3 left-4 text-xs font-semibold text-gray-500 flex flex-row items-center gap-1">
        <WandSparkles :size="14"/>AI 여행 스타일 분석
      </div>
      <p class="text-gray-600 font-medium text-sm">아직 여행 스타일 분석 결과가 없어요!</p>
      <button
        v-if="isMyProfile"
        class="px-5 py-2.5 bg-[#2C2C2C] text-white rounded-full font-bold text-sm hover:bg-gray-800 transition-colors flex items-center gap-2"
        @click="fetchAnalysisData"
      >
        <Sparkles :size="16" />
        AI로 내 여행 스타일 분석하기
      </button>
  </div>

  <!-- 2. 데이터가 있거나 로딩/에러 상태인 경우 -->
  <div v-else-if="formattedData || isLoading || error" class="bg-white border-[3px] border-[#2C2C2C] rounded-[15px] p-6 shadow-[4px_4px_0px_0px_rgba(44,44,44,1)] flex flex-col lg:flex-row gap-6 relative">
      <div class="absolute top-3 left-4 text-xs font-semibold text-gray-500 flex flex-row items-center gap-1">
        <WandSparkles :size="14"/>AI가 분석한 나의 여행 스타일
      </div>

      <!-- 로딩 중 -->
      <div v-if="isLoading" class="w-full text-center py-10 flex flex-col items-center justify-center gap-3">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p class="text-gray-500 text-sm">여행 로그를 분석하고 있습니다...</p>
      </div>

      <!-- 에러 -->
      <div v-else-if="error" class="w-full text-center py-10">
        <p class="text-red-500 font-bold mb-2">{{ error }}</p>
        <button v-if="isMyProfile" @click="fetchAnalysisData" class="text-sm underline text-gray-500">다시 시도</button>
      </div>

      <!-- 데이터 표시 -->
      <template v-else-if="formattedData">
        <!-- Dashboard Type (Full Analysis) -->
        <template v-if="formattedData.type === 'full'">
          <div class="flex-1 lg:w-1/2 mt-5">
            <div class="mb-4">
              <div v-if="formattedData.keywords.length" class="flex flex-wrap gap-2">
                <span
                  v-for="tag in formattedData.keywords"
                  :key="tag"
                  class="bg-[#9BCCC4] text-[#2C2C2C] text-xs font-semibold px-2.5 py-0.5 rounded-full"
                >
                  {{ tag }}
                </span>
              </div>
            </div>

            <div class="space-y-3">
              <div v-for="pref in formattedData.preferences" :key="pref.key">
                <div class="flex justify-between items-center mb-1">
                  <span class="text-sm font-medium text-[#2C2C2C]">{{ pref.name }}</span>
                  <span class="text-xs font-semibold text-gray-600">{{ pref.value }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="h-2 rounded-full"
                    :class="pref.colorClass"
                    :style="{ width: `${pref.value}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex-1 lg:w-1/2 border-l-2 lg:pl-6 border-gray-200 mt-4 flex flex-col">
            <h3 class="text-base font-bold text-gray-600 uppercase mb-2">나의 여행 스타일</h3>
            <p class="text-gray-800 text-sm leading-relaxed whitespace-pre-line">
              {{ formattedData.summary }}
            </p>
            <!-- 재분석 버튼 (Optional) -->
             <div v-if="isMyProfile" class="mt-auto pt-4 flex justify-end">
               <button @click="fetchAnalysisData" class="text-xs text-gray-400 hover:text-gray-600 underline">
                 다시 분석하기
               </button>
             </div>
          </div>
        </template>

        <!-- Summary Type (Only Summary) -->
        <template v-else-if="formattedData.type === 'summary'">
           <div class="w-full mt-5">
              <h3 class="text-base font-bold text-gray-600 uppercase mb-3">나의 여행 스타일</h3>
              <p class="text-gray-800 text-sm leading-relaxed whitespace-pre-line mb-4">
                {{ formattedData.summary }}
              </p>

              <div v-if="isMyProfile" class="flex justify-center pt-2 border-t border-gray-100">
                <button
                  class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2"
                  @click="fetchAnalysisData"
                >
                  <Sparkles :size="14" />
                  상세 분석 보기 (게이지 & 키워드 update)
                </button>
              </div>
           </div>
        </template>
      </template>
  </div>
</template>
