<template>
  <el-container class="main-container">
    <el-aside width="200px">
      <el-menu :default-active="$route.path" router>
        <el-menu-item index="/">
          <el-icon><Calendar /></el-icon>
          <span>座位预约</span>
        </el-menu-item>
        <el-menu-item index="/reservations">
          <el-icon><List /></el-icon>
          <span>我的预约</span>
        </el-menu-item>
        <el-menu-item index="/admin" v-if="userStore.isAdmin">
          <el-icon><Setting /></el-icon>
          <span>管理后台</span>
        </el-menu-item>
        <el-menu-item index="/stats" v-if="userStore.isAdmin">
          <el-icon><DataLine /></el-icon>
          <span>数据统计</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header>
        <span>图书馆座位预约系统</span>
        <el-dropdown @command="handleCommand">
          <span class="user-info">
            {{ userStore.userInfo?.real_name || userStore.userInfo?.username }}
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

onMounted(() => {
  userStore.fetchUserInfo()
})

const handleCommand = (command) => {
  if (command === 'logout') {
    userStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.main-container {
  height: 100vh;
}
.el-aside {
  background: #304156;
}
:deep(.el-menu) {
  border-right: none;
}
:deep(.el-menu-item) {
  color: #bfcbd9;
}
:deep(.el-menu-item.is-active) {
  background: #263445 !important;
  color: #409eff !important;
}
:deep(.el-menu-item:hover) {
  background: #263445 !important;
}
.el-header {
  background: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}
.user-info {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  color: white;
}
.el-main {
  background: #f0f2f5;
  padding: 20px;
}
</style>