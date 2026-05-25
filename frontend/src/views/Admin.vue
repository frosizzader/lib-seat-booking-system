<template>
  <el-card class="admin-container">
    <template #header>
      <div class="header-content">
        <h3>管理控制台</h3>
        <el-button v-if="activeTab === 'seats' || activeTab === 'areas'" type="primary" @click="handleAdd">
          新增{{ activeTab === 'seats' ? '座位' : '区域' }}
        </el-button>
      </div>
    </template>

    <el-tabs v-model="activeTab">
      <!-- 座位管理 -->
      <el-tab-pane label="座位管理" name="seats">
        <el-row :gutter="20" style="margin-bottom: 20px">
          <el-col :span="6">
            <el-select v-model="seatFilter.area_id" placeholder="筛选区域" clearable @change="loadSeats">
              <el-option v-for="a in areas" :key="a.id" :label="a.name" :value="a.id" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select v-model="seatFilter.status" placeholder="筛选状态" clearable @change="loadSeats">
              <el-option label="空闲" value="available" />
              <el-option label="已预约" value="reserved" />
              <el-option label="使用中" value="in_use" />
              <el-option label="维护中" value="maintenance" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-button @click="loadSeats">刷新</el-button>
          </el-col>
        </el-row>
        <el-table :data="seats" stripe>
          <el-table-column prop="seat_no" label="座位号" width="100" />
          <el-table-column prop="area_name" label="所属区域" />
          <el-table-column prop="floor" label="楼层" width="80" />
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getSeatStatusType(row.status)">{{ getSeatStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="设施" width="150">
            <template #default="{ row }">
              <el-icon v-if="row.has_power" title="有电源"><Lightning /></el-icon>
              <el-icon v-if="row.has_window" title="靠窗" style="margin-left: 10px"><TrendCharts /></el-icon>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="250">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="handleEditSeat(row)">编辑</el-button>
              <el-button 
                v-if="row.status !== 'maintenance'" 
                type="warning" 
                size="small" 
                @click="updateSeatStatus(row.id, 'maintenance')"
              >禁用</el-button>
              <el-button 
                v-else 
                type="success" 
                size="small" 
                @click="updateSeatStatus(row.id, 'available')"
              >启用</el-button>
              <el-button type="danger" size="small" @click="handleDeleteSeat(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 区域管理 -->
      <el-tab-pane label="区域管理" name="areas">
        <el-table :data="areas" stripe>
          <el-table-column prop="name" label="区域名称" />
          <el-table-column prop="floor" label="楼层" width="100" />
          <el-table-column label="开放时段" width="250">
            <template #default="{ row }">
              {{ row.open_time }} - {{ row.close_time }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="row.status === 'open' ? 'success' : 'danger'">
                {{ row.status === 'open' ? '开放中' : '已关闭' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="handleEditArea(row)">编辑</el-button>
              <el-button type="danger" size="small" @click="handleDeleteArea(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 预约管理 -->
      <el-tab-pane label="预约管理" name="reservations">
        <el-table :data="reservations" stripe>
          <el-table-column prop="username" label="用户" width="120" />
          <el-table-column prop="seat_no" label="座位" width="100" />
          <el-table-column prop="area_name" label="区域" />
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column label="时段" width="150">
            <template #default="{ row }">
              {{ row.start_time.substring(0, 5) }} - {{ row.end_time.substring(0, 5) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getResStatusType(row.status)">{{ getResStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button v-if="row.status === 'reserved'" type="warning" size="small" @click="handleCancelRes(row.id)">取消</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 违规管理 -->
      <el-tab-pane label="违规记录" name="violations">
        <el-table :data="violations" stripe>
          <el-table-column label="违规用户" width="150">
            <template #default="{ row }">
              {{ row.User?.real_name }} ({{ row.User?.username }})
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="120">
            <template #default="{ row }">
              <el-tag type="danger">{{ getViolationTypeText(row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="详细说明" />
          <el-table-column prop="createdAt" label="记录时间" width="180">
            <template #default="{ row }">
              {{ new Date(row.createdAt).toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button type="danger" size="small" @click="handleDeleteViolation(row.id)">撤销</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 规则配置 -->
      <el-tab-pane label="系统规则" name="rules">
        <el-form :model="rules" label-width="180px" style="max-width: 600px; margin-top: 20px">
          <el-divider content-position="left">预约限制</el-divider>
          <el-form-item label="最长预约时长 (小时)">
            <el-input-number v-model="rules.max_booking_duration" :min="1" :max="12" />
          </el-form-item>
          <el-form-item label="可提前预约天数">
            <el-input-number v-model="rules.advance_booking_days" :min="1" :max="30" />
          </el-form-item>
          
          <el-divider content-position="left">违规规则</el-divider>
          <el-form-item label="签到时限 (分钟)">
            <el-input-number v-model="rules.checkin_time_limit" :min="5" :max="60" />
          </el-form-item>
          <el-form-item label="允许提前签到 (分钟)">
            <el-input-number v-model="rules.early_checkin_limit" :min="0" :max="60" />
          </el-form-item>
          <el-form-item label="违规黑名单阈值 (次)">
            <el-input-number v-model="rules.violation_threshold" :min="1" :max="10" />
          </el-form-item>
          <el-form-item label="违规处罚天数">
            <el-input-number v-model="rules.violation_penalty_days" :min="1" :max="365" />
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="handleSaveRules">保存系统规则</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>

    <!-- 座位对话框 -->
    <el-dialog v-model="seatDialog.visible" :title="seatDialog.isEdit ? '编辑座位' : '新增座位'">
      <el-form :model="seatForm" label-width="100px">
        <el-form-item label="座位编号">
          <el-input v-model="seatForm.seat_no" />
        </el-form-item>
        <el-form-item label="所属区域">
          <el-select v-model="seatForm.area_id">
            <el-option v-for="a in areas" :key="a.id" :label="a.name" :value="a.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="楼层">
          <el-input-number v-model="seatForm.floor" />
        </el-form-item>
        <el-form-item label="设施">
          <el-checkbox v-model="seatForm.has_power" label="有电源" />
          <el-checkbox v-model="seatForm.has_window" label="靠窗" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="seatDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitSeat">确定</el-button>
      </template>
    </el-dialog>

    <!-- 区域对话框 -->
    <el-dialog v-model="areaDialog.visible" :title="areaDialog.isEdit ? '编辑区域' : '新增区域'">
      <el-form :model="areaForm" label-width="100px">
        <el-form-item label="区域名称">
          <el-input v-model="areaForm.name" />
        </el-form-item>
        <el-form-item label="楼层">
          <el-input-number v-model="areaForm.floor" />
        </el-form-item>
        <el-form-item label="开放时间">
          <el-time-picker v-model="areaForm.open_time" value-format="HH:mm:ss" />
        </el-form-item>
        <el-form-item label="关闭时间">
          <el-time-picker v-model="areaForm.close_time" value-format="HH:mm:ss" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="areaDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitArea">确定</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request, { getSeats, getAllReservations, updateRules, updateSeat, deleteSeat, cancelRes, getViolations, deleteViolation } from '../api'

const activeTab = ref('seats')
const seats = ref([])
const reservations = ref([])
const violations = ref([])
const areas = ref([])

const seatFilter = reactive({ area_id: null, status: null })
const rules = reactive({
  max_booking_duration: 4,
  advance_booking_days: 3,
  checkin_time_limit: 15,
  violation_threshold: 3,
  violation_penalty_days: 7
})

// 对话框状态
const seatDialog = reactive({ visible: false, isEdit: false })
const areaDialog = reactive({ visible: false, isEdit: false })
const seatForm = reactive({ id: null, seat_no: '', area_id: null, floor: 1, has_power: false, has_window: false })
const areaForm = reactive({ id: null, name: '', floor: 1, open_time: '08:00:00', close_time: '22:00:00' })

const getSeatStatusType = (s) => ({ available: 'success', reserved: 'warning', in_use: 'info', maintenance: 'danger' }[s] || 'info')
const getSeatStatusText = (s) => ({ available: '空闲', reserved: '已预约', in_use: '使用中', maintenance: '维护中' }[s] || s)
const getResStatusType = (s) => ({ reserved: 'warning', checked_in: 'success', completed: 'info', cancelled: '', violated: 'danger' }[s] || 'info')
const getResStatusText = (s) => ({ reserved: '待签到', checked_in: '使用中', completed: '已结束', cancelled: '已取消', violated: '已违约' }[s] || s)
const getViolationTypeText = (t) => ({ no_checkin: '未按时签到', early_leave: '早退未释放', no_release: '超时未释放' }[t] || t)

const loadAreas = async () => {
  const res = await request.get('/seats/areas')
  areas.value = res.data || []
}

const loadSeats = async () => {
  const res = await getSeats(seatFilter)
  seats.value = res.data?.list || []
}

const loadReservations = async () => {
  const res = await getAllReservations()
  reservations.value = res.data?.list || []
}

const loadViolations = async () => {
  const res = await getViolations()
  violations.value = res.data || []
}

const loadRules = async () => {
  try {
    const res = await request.get('/rules')
    if (res.data) {
      // 后端返回的是 { key: value } 格式的对象
      Object.assign(rules, res.data)
    }
  } catch (e) {
    ElMessage.error('加载规则失败')
  }
}

const handleAdd = () => {
  if (activeTab.value === 'seats') {
    seatDialog.isEdit = false
    Object.assign(seatForm, { id: null, seat_no: '', area_id: areas.value[0]?.id, floor: 1, has_power: false, has_window: false })
    seatDialog.visible = true
  } else {
    areaDialog.isEdit = false
    Object.assign(areaForm, { id: null, name: '', floor: 1, open_time: '08:00:00', close_time: '22:00:00' })
    areaDialog.visible = true
  }
}

const handleEditSeat = (row) => {
  seatDialog.isEdit = true
  Object.assign(seatForm, row)
  seatDialog.visible = true
}

const submitSeat = async () => {
  try {
    if (seatDialog.isEdit) {
      await updateSeat(seatForm.id, seatForm)
    } else {
      await request.post('/seats', seatForm)
    }
    ElMessage.success('操作成功')
    seatDialog.visible = false
    loadSeats()
  } catch (e) { ElMessage.error(e.message) }
}

const handleDeleteSeat = async (id) => {
  await ElMessageBox.confirm('确定删除该座位吗？', '警告', { type: 'error' })
  await deleteSeat(id)
  loadSeats()
}

const handleEditArea = (row) => {
  areaDialog.isEdit = true
  Object.assign(areaForm, row)
  areaDialog.visible = true
}

const submitArea = async () => {
  try {
    if (areaDialog.isEdit) {
      await request.put(`/seats/areas/${areaForm.id}`, areaForm)
    } else {
      await request.post('/seats/areas', areaForm)
    }
    ElMessage.success('操作成功')
    areaDialog.visible = false
    loadAreas()
  } catch (e) { ElMessage.error(e.message) }
}

const handleDeleteArea = async (id) => {
  await ElMessageBox.confirm('确定删除该区域及其所有座位吗？', '警告', { type: 'error' })
  await request.delete(`/seats/areas/${id}`)
  loadAreas()
}

const handleCancelRes = async (id) => {
  await cancelRes(id)
  loadReservations()
}

const handleDeleteViolation = async (id) => {
  await ElMessageBox.confirm('撤销违规将清除该记录并恢复用户信用，确定吗？', '提示')
  await deleteViolation(id)
  loadViolations()
}

const updateSeatStatus = async (id, status) => {
  try {
    await updateSeat(id, { status })
    ElMessage.success('状态已更新')
    loadSeats()
  } catch (e) {
    ElMessage.error('更新失败: ' + e.message)
  }
}

const handleSaveRules = async () => {
  try {
    await updateRules(rules)
    ElMessage.success('规则已更新')
  } catch (e) { ElMessage.error(e.message) }
}

onMounted(() => {
  loadAreas()
  loadSeats()
  loadReservations()
  loadViolations()
  loadRules()
})
</script>

<style scoped>
.admin-container {
  margin: 10px;
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>