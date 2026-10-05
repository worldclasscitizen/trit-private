<template>
  <RouterView />
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

onMounted(async () => {
  await authStore.initializeAuth()
})

watch(
  () => authStore.isLoggedIn,
  (isLoggedIn) => {
    if (isLoggedIn) {
      notificationStore.fetchAll()
      notificationStore.connectSSE()
    } else {
      notificationStore.disconnectSSE()
    }
  },
  { immediate: true }
)
</script>
