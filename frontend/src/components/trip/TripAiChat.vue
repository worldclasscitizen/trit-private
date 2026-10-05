<template>
  <div 
    ref="containerRef"
    class="fixed z-50 font-sans transition-opacity duration-200"
    :class="{ 'pointer-events-none': !isOpen && !isDragging, 'cursor-move': isDragging }"
    :style="containerStyle"
  >
    <!-- Floating Button (Anchor) -->
    <button
      @mousedown="startDrag"
      @click="toggleChat"
      class="group relative w-14 h-14 pointer-events-auto cursor-grab active:cursor-grabbing"
      :class="{ 'scale-95': isDragging }"
    > 
      <div class="absolute inset-0 bg-[#2C2C2C] rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.2)] group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition-all duration-300"></div>
      
      <div class="absolute inset-0 flex items-center justify-center text-white">
        <Bot 
          v-if="!isOpen" 
          class="w-7 h-7 group-hover:scale-110 transition-transform duration-300" 
          stroke-width="2"
        />
        <X 
          v-else 
          class="w-7 h-7" 
          stroke-width="2"
        />
      </div>
    </button>

    <!-- Chat Window (Absolute Positioned Upwards) -->
    <transition
      enter-active-class="transition-all duration-300 ease-out origin-bottom-right"
      enter-from-class="opacity-0 scale-90 translate-y-4"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in origin-bottom-right"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-90 translate-y-4"
    >
      <div
        v-if="isOpen"
        class="absolute bottom-20 right-0 w-[420px] h-[650px] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden pointer-events-auto border border-gray-100"
      >
        <!-- Header -->
        <div 
          @mousedown="startDrag"
          class="bg-[#2C2C2C] p-4 flex justify-between items-center text-white cursor-grab active:cursor-grabbing"
        >
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Bot class="w-5 h-5 text-white" />
            </div>
            <div class="flex flex-col">
              <span class="font-bold text-sm tracking-wide">Trip AI Assistant</span>
              <span class="text-[10px] text-gray-300">Always here to help</span>
            </div>
          </div>
          <button 
            @click.stop="isOpen = false" 
            class="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Chat Area -->
        <div class="flex-1 overflow-y-auto p-4 bg-white space-y-4 custom-scrollbar">
          <template v-for="(msg, index) in messages" :key="index">
            <div v-if="!(msg as any).isHidden" :class="[
              'flex',
              msg.isUser ? 'justify-end' : 'justify-start'
            ]">
            <div 
              :class="[
                'max-w-[85%] p-3.5 text-sm leading-relaxed shadow-sm',
                msg.isUser 
                  ? 'bg-[#9BCCC4] text-white rounded-2xl rounded-tr-sm' 
                  : 'bg-[#F5F5F5] text-[#2C2C2C] rounded-2xl rounded-tl-sm'
              ]"
            >
              <template v-for="(part, pIndex) in parseMessage(msg.text)" :key="pIndex">
                <span 
                  v-if="part.type === 'link'" 
                  class="font-bold text-[#0D9488] cursor-pointer hover:underline hover:text-[#0F766E] transition-colors"
                  @click="handleSpotClick(part.text)"
                >
                  {{ part.text }}
                </span>
                <span v-else v-html="formatMessage(part.text)"></span>
              </template>
            </div>

          </div>
          </template>

          <!-- Loading (Typing) Indicator -->
          <div v-if="isLoading" class="flex justify-start">
            <div class="bg-[#F5F5F5] text-[#2C2C2C] rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-1 w-16 h-[46px]">
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
            </div>
          </div>
        </div>

        <!-- Quick Actions (Menu) -->
        <div class="px-4 py-2 bg-white flex justify-center gap-2 border-t border-gray-100">
           <button 
            @click="handleRecommend"
            class="px-4 py-2 rounded-full bg-white border border-[#9BCCC4] text-[#9BCCC4] text-xs font-semibold hover:bg-[#9BCCC4] hover:text-white transition-colors flex items-center gap-1.5 shadow-sm"
            :disabled="isLoading"
          >
            <Sparkles class="w-3.5 h-3.5" />
            장소 추천
          </button>
          <button 
            @click="handleCheckCourse"
            class="px-4 py-2 rounded-full bg-white border border-[#9BCCC4] text-[#9BCCC4] text-xs font-semibold hover:bg-[#9BCCC4] hover:text-white transition-colors flex items-center gap-1.5 shadow-sm"
            :disabled="isLoading"
          >
            <MapPinned class="w-3.5 h-3.5" />
            코스 점검
          </button>
        </div>

        <!-- Input Area -->
        <div class="p-4 bg-white border-t border-gray-100">
          <div class="relative flex items-center gap-2">
            <input
              v-model="inputMessage"
              @keyup.enter="sendMessage"
              type="text"
              placeholder="Ask anything about your trip..."
              class="w-full pl-5 pr-12 py-3.5 bg-[#F8F9FA] border border-transparent rounded-full text-sm placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#9BCCC4] focus:ring-2 focus:ring-[#9BCCC4]/20 transition-all shadow-inner"
            />
            <button 
              @click="sendMessage"
              class="absolute right-2 p-2 bg-[#2C2C2C] text-white rounded-full hover:bg-black hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              :disabled="!inputMessage.trim()"
            >
              <Send class="w-4 h-4 ml-0.5" stroke-width="2.5" />
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { MessageCircle, X, Send, Bot, Sparkles, MapPinned } from 'lucide-vue-next'
import { sendAiChat } from '@/apis/ai'
import type { ChatMessageDto, RecommendSpotDto } from '@/apis/ai/types'


const props = defineProps<{
  fetchCandidates?: () => Promise<RecommendSpotDto[]>
  highlightCandidate?: (candidate: any) => void
  searchResults?: any[]
  tripTitle?: string
  formattedDate?: string
  allSelectedPlaces?: any[]
}>()

const emit = defineEmits<{
  (e: 'search-spot', keyword: string): void
}>()

const isOpen = ref(false)
const inputMessage = ref('')
const isLoading = ref(false)
const messages = ref<({ 
  text: string; 
  isUser: boolean; 
  relatedSpot?: any;
  isHidden?: boolean;
} | { isTyping: boolean; isUser: false })[]>([
  { text: '안녕! 여행 계획 도와줄까?', isUser: false }
])

// Trip Context (From Props)
const allSelectedPlaces = computed(() => props.allSelectedPlaces || [])
const tripTitle = computed(() => props.tripTitle || '')
const formattedDate = computed(() => props.formattedDate || '')

// Dragging Logic
const containerRef = ref<HTMLElement | null>(null)
const position = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
let isDragGesture = false 

onMounted(() => {
  if (typeof window !== 'undefined') {
    position.value = {
      x: window.innerWidth - 80, 
      y: window.innerHeight - 80
    }
  }
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
})

const handleResize = () => {
  // Keep position safe? 
}

const containerStyle = computed(() => {
  return {
     left: `${position.value.x}px`,
     top: `${position.value.y}px`
  }
})

const startDrag = (e: MouseEvent) => {
  isDragging.value = true
  isDragGesture = false
  dragOffset.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y
  }
  
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
}

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return
  isDragGesture = true
  
  let newX = e.clientX - dragOffset.value.x
  let newY = e.clientY - dragOffset.value.y
  
  const maxX = window.innerWidth - 60
  const maxY = window.innerHeight - 60
  
  newX = Math.max(10, Math.min(newX, maxX))
  newY = Math.max(10, Math.min(newY, maxY))
  
  position.value = { x: newX, y: newY }
}

const stopDrag = () => {
  isDragging.value = false
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
}

const toggleChat = () => {
  if (isDragGesture) return
  isOpen.value = !isOpen.value
  isDragGesture = false
}

// *** API Integration ***
// --- Prompt Builders ---

// 1. System Prompt (기본 성격 + 응답 규칙)
const getSystemPrompt = (): ChatMessageDto => ({
  role: 'system',
  content: `
당신은 여행 전문가 AI 'TRIT'입니다. 사용자에게 친절하고 유익한 여행 정보를 제공합니다.
한국어로 대답하세요. 반말을 사용해 친근하게 대화하세요.

[강제 규칙]
1. 답변에 나오는 모든 **장소(명소, 식당, 카페, 지역명 등)**는 반드시 **대괄호 두 개**로 감싸야 합니다.
   - 예: [[성심당]], [[해운대]], [[건대맛의거리]]
2. 장소 이름에는 **절대로** 볼드(**)를 사용하지 마세요. 오직 [[ ]]만 사용하세요.
3. 목록을 나열할 때도 장소 이름만 깔끔하게 감싸주세요.
   - 예: 1. [[성수동 카페거리]] - 분위기 좋은 카페가 많아.
4. **장소 추천 시 주의사항**: 
   - 당신에게는 항상 **[현재 지도 주변 장소 목록]**이 함께 제공됩니다.
   - 사용자가 장소 추천을 원하면, **반드시 제공된 후보 장소 목록 중에서만** 골라서 추천하세요.
   - 후보 목록에 없는 장소를 지어내거나, 엉뚱한 지역을 추천하면 안 됩니다.
   - **중요**: 목록에 없거나, 혹은 당신이 알고 있는 더 좋은 유명한 장소가 있다면 자연스럽게 **[[검색 키워드]]** 형태로 제안하세요.
     - 굳이 "목록에 없다"고 사과할 필요 없습니다. 바로 "그렇다면 [[종로바지락칼국수]]는 어때?" 처럼 제안하세요.
     - 이렇게 [[ ]]로 감싸주면 앱이 자동으로 검색을 수행합니다. 절대 없는 장소를 있는 것처럼 꾸며내지 마세요.
`
})

// 2. Trip Context (현재 여행 정보)
const getTripContext = (): ChatMessageDto => {
  const tripInfo = `
여행 제목: ${tripTitle.value || '제목 없음'}
여행 날짜: ${formattedDate.value}
현재 일정:
${(allSelectedPlaces.value || []).map((p, i) => `${i + 1}. ${p.name} (${p.category}) - ${p.address}`).join('\n')}
`
  return {
    role: 'user', // 문맥을 유저 메시지로 주입 (또는 system에 포함 가능)
    content: `현재 나의 여행 계획이야:\n${tripInfo}`
  }
}

// --- Handlers ---

// 3. Map Context (주변 장소 정보)
const getMapContext = (candidates: any[]): ChatMessageDto => {
  const candidatesList = candidates.length > 0 
    ? candidates.map((c, i) => `${i + 1}. ${c.name} (${c.category})`).join(', ')
    : '없음 (주변에 검색된 장소가 없습니다)'

  return {
    role: 'system',
    content: `[현재 지도 주변 장소 목록 (실시간)]\n${candidatesList}\n\n위 목록에 있는 장소들 중에서만 추천하세요. 이미 추천했던 장소나 내 여행 일정에 이미 포함된 장소는 가급적 제외하고 새로운 곳을 추천해주세요.`
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return

  const userText = inputMessage.value
  messages.value.push({ text: userText, isUser: true })
  inputMessage.value = ''
  isLoading.value = true
  scrollToBottom()

  try {
    // Build Chat History
    // (Actual implementation should manage history size/tokens, simplifed here)
    const history: ChatMessageDto[] = messages.value
      .filter(m => m.text && !('isTyping' in m)) // Filter out UI typing
      .map(m => ({
        role: m.isUser ? 'user' : 'assistant',
        content: m.text
      }))

    // 1. Fetch Candidates (Pre-fetch context)
    // 1. Fetch Candidates (Pre-fetch context)
    let candidateContextMsg: ChatMessageDto = { role: 'system', content: '' }
    
    // Combine fetched candidates + current search results
    let allCandidates: any[] = []

    if (props.fetchCandidates) {
        try {
            const fetched = await props.fetchCandidates()
            allCandidates = [...fetched]
        } catch (e) {
            console.error('Failed to fetch candidates', e)
        }
    }

    // Add explicit search results if available
    if (props.searchResults && props.searchResults.length > 0) {
        // Map search results to match candidate format if needed, or assume they are compatible (Place type)
        // Usually searchResults already have id, name, category, etc.
        const searchItems = props.searchResults.map((p: any) => ({
             id: p.id || p.kakaoPlaceId,
             name: p.name,
             category: p.category || '검색 결과',
             address: p.address,
             lat: p.lat,
             lng: p.lng
        }))
        allCandidates = [...searchItems, ...allCandidates]
    }

    // Deduplicate
    const uniqueCandidates = Array.from(new Map(allCandidates.map(c => [c.id, c])).values())

    if (uniqueCandidates.length > 0) {
       candidateContextMsg = getMapContext(uniqueCandidates)
    }

    // Construct Payload
    const payload = {
      messages: [
        getSystemPrompt(),
        getTripContext(),
        candidateContextMsg, // Inject Candidates
        ...history.slice(-10),
      ]
    }

    const response = await sendAiChat(payload)
    messages.value.push({ text: response.text, isUser: false })

  } catch (error) {
    console.error('Chat Error:', error)
    messages.value.push({ text: '오류가 발생했어. 잠시 후 다시 시도해줄래?', isUser: false })
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

const formatMessage = (text: string) => {
  if (!text) return ''
  let formatted = text.replace(/\n/g, '<br>')
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
  return formatted
}

const parseMessage = (text: string) => {
  if (!text) return []
  // Split by [[...]]
  const parts = text.split(/(\[\[.*?\]\])/g)
  return parts.map(part => {
    if (part.startsWith('[[') && part.endsWith(']]')) {
      return {
        type: 'link',
        text: part.slice(2, -2) // Remove [[ and ]]
      }
    }
    return {
      type: 'text',
      text: part
    }
  })
}

const handleSpotClick = (keyword: string) => {
   emit('search-spot', keyword)
}

const handleRecommend = async () => {
  if (isLoading.value) return
  if (!props.fetchCandidates) {
    messages.value.push({ text: '지도 정보를 불러올 수 없어 ㅠㅠ', isUser: false })
    return
  }

  messages.value.push({ text: '어떤 장소를 추가하면 좋을까?', isUser: true })
  isLoading.value = true
  scrollToBottom()

  try {
    const candidates = await props.fetchCandidates()
    
    if (candidates.length === 0) {
       messages.value.push({ text: '주변에 추천할 만한 곳이 없네. 지도를 조금 이동해볼래?', isUser: false })
       isLoading.value = false
       return
    }

    // Recommendation Prompt
    const prompt = `
나의 현재 여행 일정과 스타일을 고려해서, 아래 후보 장소 목록 중 **가장 잘 어울리는 장소 1곳**을 추천해줘.
이유는 3줄 이내로, 사용자가 꼭 가보고 싶게 매력적으로(반말, 친근하게) 작성해줘.
응답은 반드시 아래 **JSON 형식**으로만 해줘. 다른 설명은 붙이지 마.

후보 장소 목록:
${JSON.stringify(candidates.map(c => ({ id: c.id, name: c.name, category: c.category })))}

[JSON 응답 형식]
{
  "recommendation": {
    "spotId": "후보 장소의 id (그대로 반환)",
    "name": "장소명",
    "reason": "추천 이유 (매력적인 설명)"
  }
}
`
    // Inject Map Context
    let candidateContextMsg: ChatMessageDto = { role: 'system', content: '' }
    if (candidates.length > 0) {
        candidateContextMsg = getMapContext(candidates)
    }

    const payload = {
      messages: [
        getSystemPrompt(),
        getTripContext(),
        candidateContextMsg,
        { role: 'user', content: prompt }
      ]
    }

    const response = await sendAiChat(payload as any)
    
    // Parse JSON
    let content = response.text
    // Remove markdown code blocks if present
    content = content.replace(/```json/g, '').replace(/```/g, '').trim()
    
    try {
        const parsed = JSON.parse(content)
        const rec = parsed.recommendation
        

        
        // Use [[Name]] format to trigger link rendering
        const aiText = `✨ [[${rec.name}]] 어때?\n\n${rec.reason}`
        
        // Find candidate object for map linking (Optional: if we want to prioritize this over search)
        // But for now, we rely on the [[ ]] link triggering a search, which is consistent.
        
        messages.value.push({
            text: aiText,
            isUser: false
            // relatedSpot removed to use standard link behavior
        })

    } catch (e) {
        console.error('JSON Parse Error', e)
        // Fallback: show raw text if parsing fails
        messages.value.push({ text: response.text, isUser: false })
    }

  } catch (error) {
    console.error('Recommend Error:', error)
    messages.value.push({ text: '추천을 받아오는 중 오류가 발생했어.', isUser: false })
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

const handleCheckCourse = async () => {
  if (isLoading.value) return
  
  if (!allSelectedPlaces.value || allSelectedPlaces.value.length === 0) {
     messages.value.push({ text: '먼저 여행 장소를 담아줘!', isUser: false })
     return
  }

  messages.value.push({ text: '현재 코스 좀 점검해줄래?', isUser: true })
  isLoading.value = true
  scrollToBottom()
  
  try {
    const prompt = `
현재 나의 여행 코스를 전문가 시각에서 진단해줘. 아래 항목들을 포함해서 친근하게(반말) 조언해줘.

1. **🚩 동선 효율성**: 이동 경로가 합리적인지 봐줘.
2. **⚖️ 밸런스**: 식사, 관광, 휴식(카페) 배분이 적절한지 분석해줘.
3. **💡 개선 팁**: 너무 빡빡하진 않은지, 더 추가하면 좋을 테마가 있는지 제안해줘.
`
    // Fetch Candidates for check course as well (optional but good for context)
    let candidateContextMsg: ChatMessageDto = { role: 'system', content: '' }
    if (props.fetchCandidates) {
        try {
            const candidates = await props.fetchCandidates()
            candidateContextMsg = getMapContext(candidates)
        } catch (e) {}
    }

    const payload = {
       messages: [
         getSystemPrompt(),
         getTripContext(),
         candidateContextMsg,
         { role: 'user', content: prompt }
       ]
    }

    const response = await sendAiChat(payload as any)
    messages.value.push({ text: response.text, isUser: false })

  } catch (error) {
    console.error('Check Course Error:', error)
     messages.value.push({ text: '코스 점검 중 오류가 발생했어.', isUser: false })
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    const chatArea = containerRef.value?.querySelector('.custom-scrollbar')
    if (chatArea) {
      chatArea.scrollTop = chatArea.scrollHeight
    }
  })
}
</script>

<style scoped>
.font-sans {
  font-family: 'Outfit', sans-serif;
}

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #E5E7EB;
  border-radius: 99px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #D1D5DB;
}
</style>
