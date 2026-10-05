<template>
  <div class="sticky top-28 space-y-4">
    <div
      class="relative bg-gradient-to-br from-[#F9CA6B] to-[#CFF500] border-[2px] border-[#2C2C2C] rounded-2xl p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] overflow-hidden group hover:shadow-[4px_4px_0px_0px_rgba(44,44,44,0.15)] transition-all"
    >
      <div
        class="absolute top-3 right-3 opacity-20 transform group-hover:rotate-12 transition-transform duration-500"
      >
        <!-- <MapPin class="w-12 h-12 text-white fill-white" stroke-width="3" /> -->
      </div>

      <div class="relative z-10 flex flex-col items-center text-center mb-4">
        <div
          class="w-12 h-12 bg-[#2C2C2C] border-[2px] border-[#2C2C2C] rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
        >
          <PenTool class="w-6 h-6 text-white" stroke-width="2.5" />
        </div>
        <h3 class="text-xl font-black mb-1 tracking-tight uppercase font-sans">New Plan</h3>
        <p class="text-xs font-bold text-[#2C2C2C]/80">나만의 여행 계획 만들기</p>
      </div>

      <button
        @click="emit('navigate', 'write')"
        class="relative z-10 w-full py-3 bg-[#2C2C2C] text-white border-[2px] border-[#2C2C2C] rounded-xl font-black hover:bg-white hover:text-[#2C2C2C] hover:shadow-[3px_3px_0px_0px_rgba(44,44,44,0.3)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all flex items-center justify-center gap-2 uppercase"
      >
        <Plus class="w-4 h-4" stroke-width="3" />
        <span>Create</span>
      </button>
    </div>

    <!-- Following -->
    <div
      class="bg-white border-[2px] border-[#2C2C2C] rounded-2xl p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
    >
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-[#2C2C2C] text-base">Following</h3>
        <button class="text-xs font-bold text-gray-400 hover:text-[#2C2C2C] transition-colors">
          All →
        </button>
      </div>

      <div class="space-y-3">
        <div
          v-for="user in followers.slice(0, 5)"
          :key="user.id"
          class="flex items-center justify-between group"
        >
          <div class="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity">
            <div
              class="w-9 h-9 border-[2px] border-[#2C2C2C] rounded-full overflow-hidden flex-shrink-0 bg-gray-100"
            >
              <img
                :src="user.avatar || 'https://via.placeholder.com/150'"
                :alt="user.name"
                class="w-full h-full object-cover"
              />
            </div>
            <span class="text-sm font-bold">{{ user.name }}</span>
          </div>
          <button
            @click="emit('toggleFollow', user.id)"
            :class="[
              'text-xs font-bold px-2.5 py-1 rounded-md transition-all whitespace-nowrap border-[2px]',
              user.isFollowing
                ? 'bg-[#9BCCC4] text-[#2C2C2C] border-[#2C2C2C] hover:shadow-[2px_2px_0px_0px_rgba(44,44,44,0.2)] hover:translate-x-[-1px] hover:translate-y-[-1px]'
                : 'bg-white text-gray-700 border-gray-300 hover:border-[#2C2C2C] hover:text-[#2C2C2C] hover:shadow-[1px_1px_0px_0px_rgba(44,44,44,0.15)] hover:translate-x-[-1px] hover:translate-y-[-1px]',
            ]"
          >
            {{ user.isFollowing ? '팔로잉' : '팔로우' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Follwers -->
    <div
      class="bg-white border-[2px] border-[#2C2C2C] rounded-2xl p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
    >
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-[#2C2C2C] text-base">Followers</h3>
        <button class="text-xs font-bold text-gray-400 hover:text-[#2C2C2C] transition-colors">
          All →
        </button>
      </div>

      <div class="space-y-3">
        <div
          v-for="user in followers.slice(5, 10)"
          :key="user.id"
          class="flex items-center justify-between group"
        >
          <div class="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity">
            <div
              class="w-9 h-9 border-[2px] border-[#2C2C2C] rounded-full overflow-hidden flex-shrink-0 bg-gray-100"
            >
              <img
                :src="user.avatar || 'https://via.placeholder.com/150'"
                :alt="user.name"
                class="w-full h-full object-cover"
              />
            </div>
            <span class="text-sm font-bold">{{ user.name }}</span>
          </div>
          <button
            @click="emit('toggleFollow', user.id)"
            :class="[
              'text-xs font-bold px-2.5 py-1 rounded-md transition-all whitespace-nowrap border-[2px]',
              user.isFollowing
                ? 'bg-[#9BCCC4] text-[#2C2C2C] border-[#2C2C2C] hover:shadow-[2px_2px_0px_0px_rgba(44,44,44,0.2)]'
                : 'bg-white text-gray-700 border-gray-300 hover:border-[#2C2C2C] hover:text-[#2C2C2C] hover:shadow-[1px_1px_0px_0px_rgba(44,44,44,0.15)]',
            ]"
          >
            {{ user.isFollowing ? '팔로잉' : '팔로우' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PenTool, Plus } from 'lucide-vue-next'

interface Follower {
  id: number
  name: string
  avatar: string
  isFollowing: boolean
}

defineProps<{
  followers: Follower[]
}>()

const emit = defineEmits<{
  (e: 'toggleFollow', id: number): void
  (e: 'navigate', page: string): void
}>()
</script>
