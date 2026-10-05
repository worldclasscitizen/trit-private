<script setup lang="ts">
import { ref, computed, watchEffect, type PropType } from 'vue';
import type { UserCompletedTripDetailDto } from '@/apis/user/types';
import { getTripDetail } from '@/apis/trip/index'
import TripDetailModal from '@/components/modal/TripDetailModal.vue';
import { useNavigate } from '@/composables/common/useNavagation'
import type { TripDetailResponseDto } from '@/apis/trip/types';
import type { TripLogDetail } from '@/types/trip/trip.model';

interface LegendTrip {
  tripId: number; 
  title: string;
  startDate?: string;
  endDate?: string;
  color?: string;
}

const props = defineProps({
  completedTrips: {
    type: Array as PropType<UserCompletedTripDetailDto[]>,
    required: true
  }
});
const { handleNavigate } = useNavigate()
const colors = [
  '#E6194B', '#3CB44B', '#FFE119', '#4363D8', '#F58231',
  '#911EB4', '#46F0F0', '#F032E6', '#BCF60C', '#FABEBE',
].reverse();

const currentMonth = ref(new Date());
const dateColorMap = ref<Map<string, string>>(new Map());
const tripsForLegend = ref<LegendTrip[]>([]);
const selectedTrip = ref<TripDetailResponseDto | null>(null);
const isLoadingDetail = ref(false);

const formattedMonth = computed(() => {
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth() + 1;
  return `${year}.${month.toString().padStart(2, '0')}`;
});

const daysInMonth = computed(() => {
  const date = currentMonth.value;
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const numDays = lastDay.getDate();
  const startDay = firstDay.getDay();

  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= numDays; i++) {
    days.push(new Date(year, month, i));
  }
  return days;
});

// 1. 날짜 문자열(YYYY-MM-DD, YYYY.MM.DD 등)을 표준 YYYY-MM-DD 형식으로 통일
const normalizeDate = (dateStr: string): string => {
  return dateStr.replace(/\./g, '-').replace(/\//g, '-');
};

// 2. 시작일과 종료일 사이의 모든 날짜(YYYY-MM-DD)를 배열로 반환하는 튼튼한 함수
const getDatesInRange = (startDateStr: string, endDateStr: string): string[] => {
  const dates: string[] = [];
  
  // 문자열을 숫자로 분리하여 순수 로컬 날짜 생성 (타임존 간섭 방지)
  const [sYear, sMonth, sDay] = normalizeDate(startDateStr).split('-').map(Number);
  const [eYear, eMonth, eDay] = normalizeDate(endDateStr).split('-').map(Number);

  // 월은 0부터 시작하므로 -1
  const current = new Date(sYear!, sMonth! - 1, sDay!);
  const end = new Date(eYear!, eMonth! - 1, eDay!);

  // 날짜 유효성 검사
  if (isNaN(current.getTime()) || isNaN(end.getTime())) return [];

  // current가 end보다 작거나 같을 때까지 반복
  while (current <= end) {
    // 현재 날짜를 YYYY-MM-DD 포맷으로 저장
    const y = current.getFullYear();
    const m = (current.getMonth() + 1).toString().padStart(2, '0');
    const d = current.getDate().toString().padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);

    // 하루 더하기
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

// 3. 캘린더 표시용 Date -> String 변환기
const toYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 4. 데이터 감지 및 맵핑 로직
watchEffect(() => {
  const newDateColorMap = new Map<string, string>();
  const newTripsForLegend: LegendTrip[] = [];

  // 날짜순 정렬
  const sortedTrips = [...props.completedTrips].sort((a, b) => {
    const dateA = new Date(a.startDate || 0).getTime();
    const dateB = new Date(b.startDate || 0).getTime();
    return dateA - dateB;
  });

  sortedTrips.forEach((trip, index) => {
    const tripColor = colors[index % colors.length];

    newTripsForLegend.push({
      tripId: trip.id,
      title: trip.title,
      startDate: trip.startDate,
      endDate: trip.endDate,
      color: tripColor,
    });

    // 시작일이 있으면 로직 수행
    if (trip.startDate) {
      // 종료일이 없으면 시작일과 동일하게 처리 (당일치기)
      const endDate = trip.endDate ? trip.endDate : trip.startDate;
      
      // 기간 내의 모든 날짜 문자열 가져오기
      const dateList = getDatesInRange(trip.startDate, endDate);
      
      // 맵에 색상 등록
      dateList.forEach(dateStr => {
        newDateColorMap.set(dateStr, tripColor!);
      });
    }
  });

  dateColorMap.value = newDateColorMap;
  tripsForLegend.value = newTripsForLegend.reverse();
});

function getColorForDate(date: Date | null): string | undefined {
  if (!date) return undefined;
  return dateColorMap.value.get(toYYYYMMDD(date));
}

function prevMonth() {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1, 1);
}

function nextMonth() {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 1);
}

// 여행 상세 정보를 불러오고 모달을 띄우는 함수
async function showTripDetail(tripId: number) {
  if (isLoadingDetail.value) return;

  isLoadingDetail.value = true;
  selectedTrip.value = null; // 이전 데이터 초기화

  try {
    // getTripDetail 함수를 사용하여 상세 정보 호출
    const detail = await getTripDetail(tripId);
    selectedTrip.value = detail;
  } catch (error) {
    console.error('Failed to fetch trip detail:', error);
    // 에러 처리 로직 (예: 사용자에게 알림)
  } finally {
    isLoadingDetail.value = false;
  }
}

// 모달 이벤트 핸들러 (부모 컴포넌트의 로직을 대체)
function handleModalClose() {
    selectedTrip.value = null;
}
// 실제 부모 컴포넌트에서 구현해야 할 다른 이벤트 핸들러는 단순 목업 처리
const handleEditFromModal = (trip: TripDetailResponseDto) => {
  selectedTrip.value = null
  handleNavigate('trip-edit', { id: trip.id })
}

// 3. 로그 작성 이동
const handleWriteLogFromModal = (trip: TripDetailResponseDto) => {
  selectedTrip.value = null
  handleNavigate('log-write', { tripId: trip.id })
}

// 4. 로그 수정 이동
const handleEditLogFromModal = (tripLog: TripLogDetail) => {
  selectedTrip.value = null
  if (tripLog.logId){
    handleNavigate('log-edit', { logId: tripLog.logId })
  }
}
// // 부모에게 새로고침을 요청해야 할 경우를 대비해 emit 추가
// const emits = defineEmits<{
//    (e: 'refresh-trips'): void;
// }>();
// function handleRefreshFromModal() {
//     emits('refresh-trips');
//     selectedTrip.value = null;
// }
</script>

<template>
  <div class="bg-white border-[4px] border-[#2C2C2C] rounded-[30px] p-6 shadow-[0px_4px_0px_0px_rgba(44,44,44,1)]">
    <div class="flex justify-between items-center mb-3 px-2">
      <h2 class="font-black text-xl text-[#2C2C2C]">CALENDAR</h2>
    </div>

    <div class="flex items-center justify-between mb-4 px-2">
      <button @click="prevMonth" class="p-1 rounded-full hover:bg-gray-100 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <span class="text-lg font-bold text-gray-800">{{ formattedMonth }}</span>
      <button @click="nextMonth" class="p-1 rounded-full hover:bg-gray-100 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
      </button>
    </div>

    <div class="grid grid-cols-7 text-center text-xs font-semibold text-gray-500 mb-2">
      <div class="text-red-500">S</div>
      <div>M</div>
      <div>T</div>
      <div>W</div>
      <div>T</div>
      <div>F</div>
      <div class="text-blue-500">S</div>
    </div>

    <div class="grid grid-cols-7 gap-1 text-center">
      <div
        v-for="(day, index) in daysInMonth"
        :key="index"
        class="flex items-center justify-center aspect-square rounded-md text-sm font-medium transition-colors"
        :style="{ backgroundColor: getColorForDate(day) }"
        :class="{
          'text-gray-400': !day,
          'text-white font-bold': getColorForDate(day)
        }"
      >
        {{ day ? day.getDate() : '' }}
      </div>
    </div>

    <div class="mt-4 space-y-2 px-2 max-h-24 overflow-y-auto">
        <div v-if="tripsForLegend.length > 0">
          <div 
            v-for="trip in tripsForLegend" :key="trip.title" 
            class="flex items-center text-sm text-[#2C2C2C] cursor-pointer hover:bg-[#9BCCC4] hover:rounded-lg transition-all"
            @click="showTripDetail(trip.tripId)"
            >
            <div class="w-2 h-2 rounded-full mr-2 flex-shrink-0" :style="{ backgroundColor: trip.color }"></div>
            <span class="truncate" :title="trip.title">{{ trip.title }} ({{ trip.startDate }} ~ {{ trip.endDate }})</span>
          </div>
        </div>
        <div v-else class="text-sm text-center text-gray-500 py-4">
            완료된 여행 기록이 없습니다.
        </div>
    </div>
  </div>

  <TripDetailModal
    v-if="selectedTrip"
    :trip="selectedTrip"
    @close="handleModalClose"
    @edit="handleEditFromModal"
    @write="handleWriteLogFromModal"
    @edit-log="handleEditLogFromModal"
  />
</template>