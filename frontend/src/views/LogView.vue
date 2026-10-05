<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useNavigate } from '@/composables/common/useNavagation'
import { useAuthStore } from '@/stores/auth'
import { fetchUserProfile, requestFetchUser } from '@/apis/user/index'
import { getTripLogsByUser } from '@/apis/trip-log/index'
import TravelNavbar from '@/components/common/TravelNavbar.vue'
import ScrollToTop from '@/components/common/ScrollToTop.vue'
import FriendsListModal from '@/components/log/FriendsListModal.vue'
import MyPageProfile from '@/components/log/MyPageProfile.vue'
import LogMapWidget from '@/components/log/LogMapWidget.vue'
import LogCalendarWidget from '@/components/log/LogCalendarWidget.vue'
import LogAiAnalysis from '@/components/log/LogAiAnalysis.vue'
import LogContentTabs from '@/components/log/LogContentTabs.vue'
import { toLogViewProfile } from '@/mappers/userProfile.mapper'
import type { LogViewProfile } from '@/types/user/user.model'


const { handleNavigate } = useNavigate()
const authStore = useAuthStore()
const route = useRoute()

const loggedInUser = computed(() => authStore.user)
const profileData = ref<LogViewProfile | null>(null)
const isLoading = ref(true)
const currentPage = ref(1)
const totalPages = ref(1)

const isMyProfile = computed<boolean>(() => {
  const routeUserId = route.params.userId
  return !!(!routeUserId || (loggedInUser.value && Number(routeUserId) === loggedInUser.value.id))
})

const showFriendsModal = ref(false)

const fetchAndSetProfileData = async (userId: number, showLoading = true) => {
  if (showLoading) isLoading.value = true
  try {
    const response = await fetchUserProfile(userId);
    if (response){
      profileData.value = toLogViewProfile(response, false)
      await fetchLogs(userId, 1)
    }
  } catch (error) {
    console.error(`Failed to fetch profile for user ${userId}:`, error);
    if (showLoading) profileData.value = null
  } finally {
    if (showLoading) isLoading.value = false
  }
}

const fetchLogs = async (userId: number, page: number) => {
    try {
        const logsRes = await getTripLogsByUser(userId, { page, limit: 9 })
        if (logsRes && logsRes.content) {
            if (profileData.value) {
                profileData.value.diaries = logsRes.content.map((log: any) => ({
                    ...log,
                    id: log.logId,
                    likes: log.likeCount,
                    comments: log.commentCount,
                    thumbnailUrl: log.images && log.images.length > 0 ? log.images[0].imageUrl : null,
                    tripId: profileData.value?.diaries.find(d => d.id === log.logId)?.tripId || 0
                }))
            }
            currentPage.value = page
            totalPages.value = logsRes.totalPages
        }
    } catch (e) {
        console.error("Failed to fetch logs", e)
    }
}

const setMyProfileData = async (showLoading = true) => {
    if (showLoading) isLoading.value = true
    if (!loggedInUser.value) {
        profileData.value = null;
        if (showLoading) isLoading.value = false;
        return;
    };

    try {
        const response = await requestFetchUser()
        if (response){
          profileData.value = toLogViewProfile(response, true)
          await fetchLogs(loggedInUser.value.id, 1)
        }
    } catch (error) {
        console.error('내 프로필 정보를 가져오는 데 실패했습니다.', error);
        if (showLoading) profileData.value = null;
    } finally {
        if (showLoading) isLoading.value = false;
    }
}

const handlePageChange = async (page: number) => {
    if (profileData.value) {
        await fetchLogs(profileData.value.id, page)
         // Scroll to top of tabs? Optional.
        window.scrollTo({ top: 300, behavior: 'smooth' })
    }
}

watch(() => route.params.userId, (newUserId, oldUserId) => {
    // This watcher ensures data re-fetches when navigating between different user profiles
    if (newUserId !== oldUserId) {
        const userIdAsNumber = newUserId ? Number(newUserId) : null;

        if (userIdAsNumber && userIdAsNumber !== loggedInUser.value?.id) {
            fetchAndSetProfileData(userIdAsNumber);
        } else {
            // Handles navigating to /log or /log/:myId
            setMyProfileData();
        }
    }
}, { immediate: true }); // `immediate: true` runs the watcher on component mount

onMounted(() => {
    // Initial load logic if the watcher didn't cover it
    if (!route.params.userId) {
        setMyProfileData();
    }
})

const handleTabDataRefresh = async () => {
    if (isMyProfile.value) {
        await setMyProfileData(false)
    } else if (route.params.userId) {
        await fetchAndSetProfileData(Number(route.params.userId), false)
    }
}
</script>

<template>
  <div class="bg-[#F5F5F5] min-h-screen font-sans">
    <TravelNavbar :current-page="'log'" @navigate="handleNavigate" />

    <main v-if="!isLoading && profileData" class="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-20">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Sidebar -->
        <aside class="lg:col-span-1 flex flex-col gap-8">
          <MyPageProfile
            :profile-data="profileData"
            :is-my-profile="isMyProfile"
            :diary-count="profileData.diaries?.length || 0"
            @open-friends-modal="showFriendsModal = true"
            @profile-updated="setMyProfileData"
          />
          <LogMapWidget :completed-trips="profileData.completedTrips || []" />
          <LogCalendarWidget :completed-trips="profileData.completedTrips || []" />
        </aside>

        <!-- Right Content Area -->
        <section class="lg:col-span-2 flex flex-col gap-8">
          <LogAiAnalysis
            v-if="profileData"
            :initial-summary="profileData?.travelStyleSummary"
            :is-my-profile="isMyProfile"
            @analysis-completed="setMyProfileData(false)"
          />
          <LogContentTabs
            :is-my-profile="isMyProfile"
            :user-diaries="profileData.diaries || []"
            :user-plans="profileData.userPlans || []"
            :current-page="currentPage"
            :total-pages="totalPages"
            @page-change="handlePageChange"
            @refresh-data="handleTabDataRefresh"
          />
        </section>
      </div>
    </main>

    <div v-else class="pt-40 text-center">
      <p class="text-lg font-bold text-gray-600">
        {{ isLoading ? '사용자 정보를 불러오는 중...' : '사용자 정보를 찾을 수 없습니다.' }}
      </p>
    </div>

    <ScrollToTop />
    <FriendsListModal
        v-if="profileData"
        :show="showFriendsModal"
        :user-id="profileData.id"
        @close="showFriendsModal = false"
    />
  </div>
</template>

<style scoped>
/* Scoped styles can be added here if needed */
</style>
