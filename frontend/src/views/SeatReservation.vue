<template>
  <div class="seat-page">
    <el-card>
      <template #header>
        <div class="header">
          <h3>座位预约</h3>
          <el-date-picker v-model="date" type="date" placeholder="选择日期" :disabled-date="disableDate" />
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card shadow="hover" class="area-card">
            <template #header>选择区域</template>
            <el-radio-group v-model="areaId">
              <el-radio v-for="area in areas" :key="area.id" :value="area.id">{{ area.name }}</el-radio>
            </el-radio-group>
          </el-card>
        </el-col>
        <el-col :span="18">
          <div class="seats-grid">
            <div v-for="seat in seats" :key="seat.id" 
              class="seat-item" 
              :class="[seat.status, { selected: selectedSeat === seat.id, disabled: seat.status === 'maintenance' }]"
              @click="seat.status !== 'maintenance' ? selectedSeat = seat.id : null">
              <span>{{ seat.seat_no }}</span>
              <div class="seat-icons">
                <el-icon v-if="seat.has_power"><Lightning /></el-icon>
                <el-icon v-if="seat.has_window"><Sunny /></el-icon>
              </div>
              <div v-if="seat.status === 'maintenance'" class="maintenance-mask">
                <span>维护中</span>
              </div>
            </div>
            <el-empty v-if="seats.length === 0" description="请选择日期和区域" />
          </div>
        </el-col>
      </el-row>
      <el-divider />
      <div class="time-selector">
        <h4>选择时段</h4>
        <el-time-select v-model="startTime" placeholder="开始时间" start="08:00" step="00:30" end="22:00" style="width: 120px" />
        <span>至</span>
        <el-time-select v-model="endTime" placeholder="结束时间" start="08:00" step="00:30" end="22:00" style="width: 120px" />
        <el-button type="primary" :disabled="!canReserve" @click="handleReserve">立即预约</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request, { getSeats, createReservation } from '../api'

const date = ref(new Date())
const areaId = ref(null)
const selectedSeat = ref(null)
const startTime = ref('09:00')
const endTime = ref('12:00')
const areas = ref([])
const seats = ref([])
const loading = ref(false)

const disableDate = (date) => date < new Date().setHours(0,0,0,0)

const canReserve = computed(() => {
  if (!(date.value && areaId.value && selectedSeat.value && startTime.value && endTime.value)) return false
  
  // 检查结束时间是否晚于开始时间
  const [sH, sM] = startTime.value.split(':').map(Number)
  const [eH, eM] = endTime.value.split(':').map(Number)
  const startVal = sH * 60 + sM
  const endVal = eH * 60 + eM
  if (endVal <= startVal) return false

  // 检查是否为过去的时间
  const now = new Date()
  const dateStr = new Date(date.value).toISOString().split('T')[0]
  const bookingStart = new Date(`${dateStr}T${startTime.value}`)
  return bookingStart > now
})

const loadAreas = async () => {
  try {
    const res = await request.get('/seats/areas')
    areas.value = res.data || []
    if (areas.value.length > 0 && !areaId.value) {
      areaId.value = areas.value[0].id
    }
  } catch (e) {
    ElMessage.error('获取区域列表失败')
  }
}

const loadSeats = async () => {
  if (!areaId.value) return
  loading.value = true
  try {
    const res = await getSeats({ area_id: areaId.value })
    seats.value = res.data?.list || res.data || []
  } catch (e) {
    ElMessage.error('获取座位列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadAreas()
})

watch([date, areaId], () => {
  selectedSeat.value = null
  loadSeats()
})

const handleReserve = async () => {
  if (!selectedSeat.value) {
    ElMessage.warning('请先选择座位')
    return
  }
  if (!date.value || !startTime.value || !endTime.value) {
    ElMessage.warning('请选择日期和时间')
    return
  }
  const dateStr = new Date(date.value).toISOString().split('T')[0]
  console.log('预约参数:', { seat_id: selectedSeat.value, date: dateStr, start_time: startTime.value, end_time: endTime.value })
  try {
    await createReservation({
      seat_id: selectedSeat.value,
      date: dateStr,
      start_time: startTime.value,
      end_time: endTime.value
    })
    ElMessage.success('预约成功')
    loadSeats()
  } catch (err) {
    console.error('预约失败:', err)
    ElMessage.error(err.message || '预约失败')
  }
}
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.area-card {
  margin-bottom: 20px;
}
.seats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}
.seat-item {
  padding: 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}
.seat-item.available:hover {
  border-color: #409eff;
}
.seat-item.reserved {
  background: #f5f5f5;
  cursor: not-allowed;
}
.seat-item.in_use {
  background: #fef0f0;
  cursor: not-allowed;
}
.seat-item.maintenance {
  background: #f4f4f5;
  color: #909399;
  cursor: not-allowed;
  position: relative;
  overflow: hidden;
}
.maintenance-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(144, 147, 153, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
}
.seat-item.selected {
  border-color: #67c23a;
  background: #f0f9ff;
}
.seat-icons {
  display: flex;
  justify-content: center;
  gap: 5px;
  margin-top: 5px;
  font-size: 12px;
  color: #666;
}
.time-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>