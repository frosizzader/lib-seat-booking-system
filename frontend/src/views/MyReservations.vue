<template>
  <div class="my-res-container">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="我的预约" name="reservations">
        <el-card shadow="never">
          <el-table :data="reservations" stripe>
            <el-table-column prop="seat_no" label="座位号" width="100" />
            <el-table-column prop="area_name" label="区域" />
            <el-table-column prop="date" label="日期" width="120" />
            <el-table-column label="时段" width="150">
              <template #default="{ row }">
                {{ row.start_time.substring(0, 5) }} - {{ row.end_time.substring(0, 5) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作">
              <template #default="{ row }">
                <el-button v-if="row.status === 'reserved'" type="primary" size="small" @click="handleCheckin(row.id)">签到</el-button>
                <el-button v-if="row.status === 'reserved'" type="danger" size="small" @click="handleCancel(row.id)">取消</el-button>
                <el-button v-if="row.status === 'checked_in'" type="success" size="small" @click="handleRelease(row.id)">释放</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="违规记录" name="violations">
        <el-card shadow="never">
          <el-alert
            v-if="userInfo.violation_count > 0"
            :title="`您当前共有 ${userInfo.violation_count} 条未处理违规。请注意，违规次数达到阈值后将被限制预约。`"
            type="warning"
            show-icon
            style="margin-bottom: 20px"
          />
          <el-table :data="violations" stripe>
            <el-table-column prop="createdAt" label="违规时间" width="180">
              <template #default="{ row }">
                {{ new Date(row.createdAt).toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="type" label="违规类型" width="120">
              <template #default="{ row }">
                <el-tag type="danger">{{ getViolationTypeText(row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="详细说明" />
            <el-table-column label="关联预约" width="200">
              <template #default="{ row }">
                <span v-if="row.Reservation">
                  {{ row.Reservation.date }} ({{ row.Reservation.start_time.substring(0, 5) }})
                </span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyReservations, checkin, release, cancelRes, getMyViolations } from '../api'
import { useUserStore } from '../stores/user'

const activeTab = ref('reservations')
const reservations = ref([])
const violations = ref([])
const userStore = useUserStore()

const userInfo = computed(() => userStore.userInfo || {})

const getStatusType = (status) => {
  const types = { reserved: '', checked_in: 'success', completed: 'info', cancelled: 'danger', violated: 'danger' }
  return types[status] || ''
}

const getStatusText = (status) => {
  const texts = { reserved: '已预约', checked_in: '使用中', completed: '已完成', cancelled: '已取消', violated: '已违约' }
  return texts[status] || status
}

const getViolationTypeText = (type) => {
  const texts = { no_checkin: '未按时签到', early_leave: '早退未释放', no_release: '超时未释放' }
  return texts[type] || type
}

const loadReservations = async () => {
  try {
    const res = await getMyReservations()
    reservations.value = res.data?.list || res.data || []
  } catch (e) {
    ElMessage.error('加载预约失败')
  }
}

const loadViolations = async () => {
  try {
    const res = await getMyViolations()
    violations.value = res.data || []
  } catch (e) {
    ElMessage.error('加载违规记录失败')
  }
}

const handleCheckin = async (id) => {
  try {
    await checkin(id)
    ElMessage.success('签到成功')
    loadReservations()
  } catch (err) {
    ElMessage.error(err.message || '签到失败')
  }
}

const handleCancel = async (id) => {
  try {
    await ElMessageBox.confirm('确定要取消该预约吗？', '提示', { type: 'warning' })
    await cancelRes(id)
    ElMessage.success('取消成功')
    loadReservations()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error(err.message || '取消失败')
  }
}

const handleRelease = async (id) => {
  try {
    await release(id)
    ElMessage.success('释放成功')
    loadReservations()
  } catch (err) {
    ElMessage.error(err.message || '释放失败')
  }
}

onMounted(() => {
  loadReservations()
  loadViolations()
})
</script>

<style scoped>
.my-res-container {
  padding: 10px;
}
</style>