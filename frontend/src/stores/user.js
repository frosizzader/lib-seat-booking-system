import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as api from '../api'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(null)

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => userInfo.value?.role === 'admin' || userInfo.value?.role === 'super_admin')
  const isSuperAdmin = computed(() => userInfo.value?.role === 'super_admin')

  const login = async (credentials) => {
    const res = await api.login(credentials)
    token.value = res.data.token
    userInfo.value = res.data.user
    localStorage.setItem('token', res.data.token)
  }

  const fetchUserInfo = async () => {
    if (!token.value) return
    try {
      const res = await api.getUserInfo()
      userInfo.value = res.data
    } catch {
      logout()
    }
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
  }

  return { token, userInfo, isLoggedIn, isAdmin, isSuperAdmin, login, fetchUserInfo, logout }
})