import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/login',
      redirect: { path: '/' } // 루트 경로로 리디렉션
    },
    {
      path: '/home',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { requiresAuth: true } // 인증 필요 표시
    },
    {
      path: '/trips',
      name: 'trips',
      component: () => import('@/views/TripView.vue'),
    },
    {
      path: '/create-trip',
      name: 'create-trip',
      component: () => import('@/views/TripPlanView.vue'),
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('@/views/SearchView.vue'),
    },
    {
      path: '/trips/:id',
      name: 'trip-detail',
      component: () => import('@/views/TripPlanView.vue'),
    },
    {
      path: '/log',
      name: 'log',
      component: () => import('@/views/LogView.vue'),
    },
    {
      path: '/log/:userId',
      name: 'user-log',
      component: () => import('@/views/LogView.vue'),
      props: true
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('@/views/SignUpView.vue'),
    },
    {
      path: '/find-account',
      name: 'find-account',
      component: () => import('@/views/FindAccountInfoView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
    },
    {
      path: '/log-write/:tripId',
      name: 'log-write',
      component: () => import('@/views/CreateTripLogView.vue'),
      props: true
    },
    {
      path: '/friends',
      name: 'friends',
      component: () => import('@/views/FriendsView.vue'),
    },
    {
      path: '/log-edit/:logId',
      name: 'log-edit',
      component: () => import('@/views/EditTripLogView.vue'),
      props: true
    },
    {
      path: '/diary/:logId',
      name: 'trip-log-detail',
      component: () => import('@/views/TripLogDetailView.vue'),
      props: true
    }
  ],
})

export default router
