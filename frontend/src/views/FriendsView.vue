<template>
  <div class="min-h-screen bg-[#F5F5F5] font-sans selection:bg-[#F9CA6B] selection:text-black">
    <TravelNavbar current-page="friends" @navigate="handleNavigate" />
    
    <div class="pt-28 px-8 max-w-[1600px] mx-auto pb-12">
      <div class="flex items-center gap-4 mb-8">
        <h1 class="text-4xl font-black text-[#2C2C2C]" style="font-family: 'Bebas Neue', sans-serif">
          FRIENDS
        </h1>
        <span class="text-gray-500 font-bold text-lg">친구 관리</span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Left Column: Search & Friend List -->
        <div class="lg:col-span-8 space-y-8">
          
          <!-- User Search Section -->
          <div
            class="bg-white rounded-2xl p-6 border-[2px] border-[#2C2C2C] shadow-[4px_4px_0px_0px_rgba(44,44,44,1)] transition-all duration-300"
          >
            <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
              <Search class="w-5 h-5" />
              사용자 검색
            </h2>
            <div class="flex gap-2 mb-4">
              <input
                v-model="searchQuery"
                @keyup.enter="handleSearch"
                type="text"
                placeholder="닉네임으로 사용자 전체 검색"
                class="flex-1 px-4 py-2 border-[2px] border-[#2C2C2C] rounded-xl focus:outline-none focus:shadow-[2px_2px_0px_0px_rgba(44,44,44,0.8)] transition-shadow"
              />
              <button
                @click="handleSearch"
                class="px-4 py-2 bg-[#2C2C2C] text-white rounded-xl font-bold hover:bg-[#404040] transition-colors"
              >
                검색
              </button>
            </div>

            <!-- Search Results (Scrollable, max 8 rows approx) -->
            <div v-if="hasSearched" class="mt-4">
              <div v-if="searchResults.length === 0" class="text-center text-gray-500 py-4 bg-gray-50 rounded-lg">
                검색 결과가 없습니다.
              </div>
              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                <div
                  v-for="user in searchResults"
                  :key="user.id"
                  class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-300 transition-colors h-[72px]"
                >
                  <div 
                    class="flex items-center gap-3 overflow-hidden cursor-pointer"
                    @click="goToLog(user.id)"
                  >
                    <div class="w-10 h-10 rounded-full border border-gray-200 overflow-hidden shrink-0">
                      <img
                        :src="user.profileImageUrl || '/default-profile.svg'"
                        alt="Profile"
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <div class="overflow-hidden min-w-0">
                      <p class="font-bold text-sm truncate">{{ user.nickname }}</p>
                    </div>
                  </div>
                  
                  <!-- Action Buttons based on Status -->
                  <div v-if="user.id !== currentUserId" class="shrink-0 ml-2">
                    <span
                        v-if="user.status === 'FRIEND'"
                        class="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded"
                    >
                        친구
                    </span>
                    <span
                        v-else-if="user.status === 'SENT'"
                        class="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded flex items-center gap-1 cursor-not-allowed"
                    >
                      <Clock class="w-3 h-3" /> 요청됨
                    </span>
                    <button
                        v-else-if="user.status === 'RECEIVED'"
                        class="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded hover:bg-blue-200"
                        @click="activeTab = 'received'"
                    >
                        요청 받음
                    </button>
                    <button
                        v-else
                        @click="sendFriendRequest(user)"
                        class="text-xs font-bold text-white bg-[#2C2C2C] px-3 py-1.5 rounded hover:bg-gray-700 transition-colors flex items-center gap-1"
                    >
                      <UserPlus class="w-3 h-3" /> 추가
                    </button>
                  </div>
                  <span v-else class="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded shrink-0 ml-2">나</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Friend List Section (Pagination) -->
          <div
            class="bg-white rounded-2xl p-6 border-[2px] border-[#2C2C2C] shadow-[4px_4px_0px_0px_rgba(44,44,44,1)] min-h-[400px]"
          >
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-bold flex items-center gap-2">
                <Users class="w-6 h-6" />
                친구 목록
                <span class="text-sm font-normal text-gray-500">({{ friends.length }}명)</span>
              </h2>
              <button @click="loadData" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
              </button>
            </div>

            <div v-if="friends.length === 0" class="flex flex-col items-center justify-center h-64 text-gray-400">
              <UserX class="w-12 h-12 mb-2" />
              <p>아직 친구가 없습니다. 친구를 찾아보세요!</p>
            </div>

            <div v-else>
               <!-- Grid of Friends -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  v-for="friend in paginatedFriends"
                  :key="friend.userId"
                  class="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-[#2C2C2C] hover:shadow-md transition-all group"
                >
                  <div class="flex items-center gap-3 cursor-pointer overflow-hidden" @click="goToLog(friend.userId)">
                    <div class="w-12 h-12 rounded-full border border-gray-300 overflow-hidden shrink-0">
                      <img
                        :src="friend.profileImageUrl || '/default-profile.svg'"
                        alt="Profile"
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <div class="overflow-hidden min-w-0">
                      <p class="font-bold text-lg truncate">{{ friend.nickname }}</p>
                      <p class="text-xs text-gray-500 truncate">@user_{{ friend.userId }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                    <button
                      @click="goToLog(friend.userId)"
                      class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="로그 보기"
                    >
                      <BookOpen class="w-5 h-5" />
                    </button>
                    <button
                      @click="handleDeleteFriend(friend)"
                      class="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="친구 삭제"
                    >
                      <UserMinus class="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Pagination Controls -->
               <div v-if="totalPages > 1" class="flex justify-center items-center gap-2 mt-8">
                <button 
                  @click="goToPage(currentPage - 1)" 
                  :disabled="currentPage === 1"
                  class="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft class="w-4 h-4" />
                </button>
                
                <span class="text-sm font-bold mx-2">
                  {{ currentPage }} / {{ totalPages }}
                </span>

                <button 
                  @click="goToPage(currentPage + 1)" 
                  :disabled="currentPage === totalPages"
                  class="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Requests -->
        <div class="lg:col-span-4 h-full">
          <div
            class="bg-white rounded-2xl p-6 border-[2px] border-[#2C2C2C] shadow-[4px_4px_0px_0px_rgba(44,44,44,1)] h-full min-h-[600px] flex flex-col"
          >
            <div class="flex items-center justify-between mb-6 shrink-0">
              <h2 class="text-xl font-bold flex items-center gap-2">
                <Bell class="w-5 h-5" />
                친구 요청
              </h2>
            </div>
            
            <div class="flex bg-gray-100 rounded-lg p-1 mb-4 shrink-0">
                <button 
                  @click="activeTab = 'received'"
                  :class="['flex-1 py-2 text-sm font-bold rounded-md transition-all', activeTab === 'received' ? 'bg-white shadow-sm text-[#2C2C2C]' : 'text-gray-500 hover:text-gray-700']"
                >
                  받은 요청 ({{ receivedRequests.length }})
                </button>
                <button 
                  @click="activeTab = 'sent'"
                  :class="['flex-1 py-2 text-sm font-bold rounded-md transition-all', activeTab === 'sent' ? 'bg-white shadow-sm text-[#2C2C2C]' : 'text-gray-500 hover:text-gray-700']"
                >
                  보낸 요청 ({{ sentRequests.length }})
                </button>
            </div>

            <div class="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
              <!-- Received Requests -->
              <div v-if="activeTab === 'received'" class="h-full">
                <div v-if="receivedRequests.length === 0" class="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                    <Bell class="w-8 h-8 mb-2 opacity-20" />
                    받은 친구 요청이 없습니다.
                </div>
                <div v-else class="space-y-3">
                    <div v-for="req in receivedRequests" :key="req.requestId" class="p-4 bg-[#FFF8ED] rounded-xl border border-orange-100 hover:border-orange-200 transition-colors">
                        <div 
                            class="flex items-center gap-3 mb-4 cursor-pointer"
                            @click="goToLog(req.user.userId)"
                        >
                            <div class="w-12 h-12 rounded-full border border-gray-200 overflow-hidden shrink-0">
                                <img :src="req.user.profileImageUrl || '/default-profile.svg'" alt="Profile" class="w-full h-full object-cover"/>
                            </div>
                            <div>
                                <p class="font-bold text-base">{{ req.user.nickname }}</p>
                                <p class="text-xs text-gray-500">{{ formatDate(req.createdAt) }}</p>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button @click="acceptRequest(req.requestId)" class="flex-1 py-2 bg-[#2C2C2C] text-white text-sm font-bold rounded-lg hover:bg-gray-700 transition-colors">
                                수락
                            </button>
                            <button @click="declineRequest(req.requestId)" class="flex-1 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 transition-colors">
                                거절
                            </button>
                        </div>
                    </div>
                </div>
              </div>

              <!-- Sent Requests -->
              <div v-else class="h-full">
                  <div v-if="sentRequests.length === 0" class="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                    <Bell class="w-8 h-8 mb-2 opacity-20" />
                    보낸 친구 요청이 없습니다.
                  </div>
                  <div v-else class="space-y-3">
                      <div v-for="req in sentRequests" :key="req.requestId" class="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-300 transition-colors">
                          <div 
                            class="flex items-center gap-3 cursor-pointer"
                            @click="goToLog(req.user.userId)"
                          >
                              <div class="w-10 h-10 rounded-full border border-gray-200 overflow-hidden shrink-0">
                                <img :src="req.user.profileImageUrl || '/default-profile.svg'" alt="Profile" class="w-full h-full object-cover"/>
                              </div>
                              <div>
                                  <p class="font-bold text-sm">{{ req.user.nickname }}</p>
                                  <p class="text-xs text-gray-500">{{ formatDate(req.createdAt) }}</p>
                              </div>
                          </div>
                          <button @click="cancelRequest(req.requestId)" class="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg" title="요청 취소">
                              <XCircle class="w-5 h-5" />
                          </button>
                      </div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { 
    Users, Search, UserPlus, Bell, XCircle, RefreshCw, UserX, UserMinus, Clock, BookOpen,
    ChevronLeft, ChevronRight
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useNavigate } from '@/composables/common/useNavagation'
import TravelNavbar from '@/components/common/TravelNavbar.vue'
import { 
    requestSendFriendRequest, 
    fetchReceivedRequests, 
    fetchSentRequests, 
    requestAcceptFriendRequest, 
    requestDeclineFriendRequest, 
    requestCancelSentRequest, 
    fetchMyFriendList, 
    requestDeleteFriend
} from '@/apis/friend'
import { requestSearchUsers } from '@/apis/user'
import type { SimpleUserInfoDto, FriendRequestResponseDto } from '@/apis/friend/types'
import type { UserSearchResponseDto } from '@/apis/user/types'

const router = useRouter()
const { handleNavigate } = useNavigate()
const authStore = useAuthStore()
const currentUserId = computed(() => authStore.user?.id)

// Data State
const friends = ref<SimpleUserInfoDto[]>([])
const receivedRequests = ref<FriendRequestResponseDto[]>([])
const sentRequests = ref<FriendRequestResponseDto[]>([])
const loading = ref(false)

// Pagination State
const currentPage = ref(1)
const itemsPerPage = 50

const totalPages = computed(() => Math.ceil(friends.value.length / itemsPerPage))

const paginatedFriends = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return friends.value.slice(start, end)
})

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// Search State
const searchQuery = ref('')
const searchResults = ref<(UserSearchResponseDto & { status: 'FRIEND' | 'SENT' | 'RECEIVED' | 'NONE' })[]>([])
const hasSearched = ref(false)

// UI State
const activeTab = ref<'received' | 'sent'>('received')

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
}

const loadData = async () => {
    if (!authStore.isLoggedIn) return
    loading.value = true
    try {
        const [friendsData, receivedData, sentData] = await Promise.all([
            fetchMyFriendList(),
            fetchReceivedRequests(),
            fetchSentRequests()
        ])
        friends.value = friendsData
        receivedRequests.value = receivedData
        sentRequests.value = sentData
        
        // Refresh search results status if needed
        if (hasSearched.value) {
            handleSearch()
        }
    } catch (e) {
        console.error("Failed to load friend data", e)
    } finally {
        loading.value = false
    }
}

const handleSearch = async () => {
    if (!searchQuery.value.trim()) {
        searchResults.value = []
        hasSearched.value = false
        return
    }
    
    try {
        const results = await requestSearchUsers(searchQuery.value)
        hasSearched.value = true
        
        // Map status to results
        searchResults.value = results.map(user => {
            let status: 'FRIEND' | 'SENT' | 'RECEIVED' | 'NONE' = 'NONE'
            
            if (friends.value.some(f => f.userId === user.id)) {
                status = 'FRIEND'
            } else if (sentRequests.value.some(r => r.user.userId === user.id)) {
                status = 'SENT'
            } else if (receivedRequests.value.some(r => r.user.userId === user.id)) {
                status = 'RECEIVED'
            }
            
            return { ...user, status }
        })
    } catch (e) {
        console.error("Search failed", e)
    }
}

const sendFriendRequest = async (user: UserSearchResponseDto) => {
    try {
        await requestSendFriendRequest(user.id)
        // Optimistic update
        const searchItem = searchResults.value.find(u => u.id === user.id)
        if (searchItem) searchItem.status = 'SENT'
        
        await loadData() // Reload to be sure and update sent list
    } catch (e) {
        console.error("Failed to send request", e)
        alert("친구 요청을 보내는데 실패했습니다.")
    }
}

const acceptRequest = async (requestId: number) => {
    try {
        await requestAcceptFriendRequest(requestId)
        await loadData()
    } catch (e) {
        console.error("Failed to accept request", e)
    }
}

const declineRequest = async (requestId: number) => {
    if (!confirm('친구 요청을 거절하시겠습니까?')) return
    try {
        await requestDeclineFriendRequest(requestId)
        await loadData()
    } catch (e) {
        console.error("Failed to decline request", e)
    }
}

const cancelRequest = async (requestId: number) => {
    if (!confirm('보낸 친구 요청을 취소하시겠습니까?')) return
    try {
        await requestCancelSentRequest(requestId)
        await loadData()
    } catch (e) {
        console.error("Failed to cancel request", e)
    }
}

const handleDeleteFriend = async (friend: SimpleUserInfoDto) => {
    if (!confirm(`${friend.nickname}님을 친구 목록에서 삭제하시겠습니까?`)) return
    try {
        await requestDeleteFriend(friend.userId)
        await loadData()
    } catch (e) {
        console.error("Failed to delete friend", e)
    }
}

const goToLog = (userId: number) => {
    router.push(`/log/${userId}`)
}

onMounted(() => {
    loadData()
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #E5E7EB;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #D1D5DB;
}
</style>
