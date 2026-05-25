import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Main from '../views/Main.vue'
import SeatReservation from '../views/SeatReservation.vue'

const routes = [
  { path: '/', component: Main, children: [
    { path: '', component: SeatReservation },
    { path: 'reservations', component: () => import('../views/MyReservations.vue') },
    { path: 'admin', component: () => import('../views/Admin.vue') },
    { path: 'stats', component: () => import('../views/Stats.vue') }
  ]},
  { path: '/login', component: Login },
  { path: '/register', component: Register }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && to.path !== '/register' && !token) {
    next('/login')
  } else if ((to.path === '/login' || to.path === '/register') && token) {
    next('/')
  } else {
    next()
  }
})

export default router