<template>
  <el-card>
    <template #header>
      <h3>数据统计</h3>
    </template>
    
    <el-row :gutter="20">
      <el-col :span="6" v-for="item in overview" :key="item.label">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">{{ item.label }}</div>
          <div class="stat-value" :style="{ color: item.color }">{{ item.value }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card header="预约趋势 (近7日)">
          <div ref="trendChart" style="height: 350px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card header="各区域座位利用率">
          <div ref="usageChart" style="height: 350px"></div>
        </el-card>
      </el-col>
    </el-row>
  </el-card>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import request from '../api'
import { ElMessage } from 'element-plus'

const overview = ref([
  { label: '今日预约', value: 0, color: '#409EFF' },
  { label: '当前利用率', value: '0%', color: '#67C23A' },
  { label: '空闲座位', value: 0, color: '#E6A23C' },
  { label: '今日违约', value: 0, color: '#F56C6C' }
])

const trendChart = ref(null)
const usageChart = ref(null)
let trendInstance = null
let usageInstance = null

const loadOverview = async () => {
  try {
    const res = await request.get('/stats/overview')
    if (res.data) {
      overview.value[0].value = res.data.today_reservations
      overview.value[1].value = res.data.occupancy_rate + '%'
      overview.value[2].value = res.data.available_seats
      overview.value[3].value = res.data.today_violations
    }
  } catch (e) {
    ElMessage.error('加载概览失败')
  }
}

const initTrendChart = async () => {
  try {
    const res = await request.get('/stats/trend')
    if (res.data && trendChart.value) {
      trendInstance = echarts.init(trendChart.value)
      trendInstance.setOption({
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: res.data.labels },
        yAxis: { type: 'value' },
        series: [{
          data: res.data.data,
          type: 'line',
          smooth: true,
          areaStyle: { opacity: 0.2 },
          itemStyle: { color: '#409EFF' }
        }]
      })
    }
  } catch (e) {
    ElMessage.error('加载趋势图失败')
  }
}

const initUsageChart = async () => {
  try {
    const res = await request.get('/stats/usage')
    if (res.data && usageChart.value) {
      usageInstance = echarts.init(usageChart.value)
      usageInstance.setOption({
        tooltip: { trigger: 'item' },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          data: res.data.areas.map(a => ({
            name: a.area_name,
            value: a.total_bookings
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      })
    }
  } catch (e) {
    ElMessage.error('加载利用率图失败')
  }
}

const handleResize = () => {
  trendInstance?.resize()
  usageInstance?.resize()
}

onMounted(() => {
  loadOverview()
  initTrendChart()
  initUsageChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendInstance?.dispose()
  usageInstance?.dispose()
})
</script>

<style scoped>
.stat-card {
  text-align: center;
  padding: 10px 0;
}
.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}
.stat-value {
  font-size: 24px;
  font-weight: bold;
}
</style>