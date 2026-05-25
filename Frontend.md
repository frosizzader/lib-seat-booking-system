# 图书馆座位预约系统前端技术文档

## 1 项目概述

本文档描述图书馆座位预约系统的前端架构设计方案，基于 Vue 3 + Element Plus 技术栈实现。

## 2 技术架构

| 层级 | 技术选型 | 说明 |
|-----|---------|------|
| 框架 | Vue 3 (Composition API) | 核心框架 |
| UI组件库 | Element Plus | 组件库 |
| 状态管理 | Pinia | 状态管理 |
| 路由 | Vue Router 4 | 路由管理 |
| 构建工具 | Vite | 开发构建 |
| HTTP客户端 | Axios | API请求 |
| 图表 | ECharts | 统计图表 |
| CSS预处理器 | SCSS | 样式预处理 |

## 3 项目目录结构

```
src/
├── api/                    # API接口层
│   ├── user.js            # 用户相关接口
│   ├── seat.js            # 座位相关接口
│   ├── reservation.js     # 预约相关接口
│   ├── stats.js           # 统计接口
│   └── admin.js           # 管理接口
├── assets/
│   ├── images/            # 图片资源
│   └── styles/            # 全局样式
├── components/            # 公共组件
│   ├── common/            # 通用组件
│   │   ├── AppHeader.vue
│   │   ├── AppSidebar.vue
│   │   ├── AppBreadcrumb.vue
│   │   └── StatusBadge.vue
│   ├── seat/              # 座位相关组件
│   │   ├── SeatMap.vue
│   │   ├── SeatCard.vue
│   │   ├── SeatGrid.vue
│   │   └── SeatFilter.vue
│   ├── reservation/       # 预约组件
│   │   ├── ReservationForm.vue
│   │   ├── ReservationCard.vue
│   │   └── TimeSlotPicker.vue
│   ├── stats/             # 统计组件
│   │   ├── UsageChart.vue
│   │   ├── TrendChart.vue
│   │   ├── ViolationChart.vue
│   │   └── HeatmapChart.vue
│   └── form/              # 表单组件
│       ├── LoginForm.vue
│       └── RegisterForm.vue
├── composables/           # 组合式函数
│   ├── useAuth.js
│   ├── useReservation.js
│   ├── useSeat.js
│   └── usePagination.js
├── layouts/
│   ├── DefaultLayout.vue
│   ├── BlankLayout.vue
│   └── AdminLayout.vue
├── router/
│   ├── index.js
│   └── routes/
│       ├── user.js
│       ├── seat.js
│       ├── reservation.js
│       ├── admin.js
│       └── stats.js
├── stores/                # Pinia状态库
│   ├── user.js
│   ├── seat.js
│   ├── reservation.js
│   └── app.js
├── utils/                 # 工具函数
│   ├── request.js
│   ├── storage.js
│   ├── date.js
│   └── validate.js
├── views/                 # 页面视图
│   ├── auth/
│   │   ├── Login.vue
│   │   └── Register.vue
│   ├── user/
│   │   ├── Profile.vue
│   │   ├── MyReservations.vue
│   │   └── ViolationRecord.vue
│   ├── seat/
│   │   ├── SeatList.vue
│   │   └── SeatMapView.vue
│   ├── reservation/
│   │   ├── Reserve.vue
│   │   └── ReserveConfirm.vue
│   ├── stats/
│   │   ├── Dashboard.vue
│   │   ├── UsageStats.vue
│   │   └── ViolationStats.vue
│   └── admin/
│       ├── SeatManage.vue
│       ├── RuleConfig.vue
│       ├── UserManage.vue
│       └── AreaManage.vue
├── App.vue
└── main.js
```

## 4 组件结构设计

### 4.1 组件树结构

```
App
├── DefaultLayout
│   ├── AppHeader
│   │   ├── StatusBadge (当前用户状态)
│   │   └── NotificationBell (通知)
│   ├── AppSidebar
│   │   ├── MenuItem (动态菜单)
│   │   └── CollapseTrigger
│   └── AppBreadcrumb
└── RouterView
    ├── Login / Register (无布局)
    ├── UserViews
    │   ├── SeatList → SeatGrid + SeatFilter
    │   ├── Reserve → SeatMap + TimeSlotPicker + ReservationForm
    │   ├── MyReservations → ReservationCard (列表)
    │   └── Profile
    ├── AdminViews
    │   ├── Dashboard → UsageChart + TrendChart + ViolationChart
    │   ├── SeatManage → SeatGrid (可编辑)
    │   ├── RuleConfig → 表单配置
    │   └── UserManage → Table + Dialog
    └── StatsViews
        ├── UsageStats → UsageChart + HeatmapChart
        └── ViolationStats → ViolationChart + Table
```

### 4.2 组件职责划分

| 组件名 | 文件路径 | 职责 |
|-------|---------|------|
| AppHeader | components/common/AppHeader.vue | 顶部导航、用户信息、退出 |
| AppSidebar | components/common/AppSidebar.vue | 侧边菜单、权限过滤 |
| SeatMap | components/seat/SeatMap.vue | 可视化座位图、交互 |
| SeatGrid | components/seat/SeatGrid.vue | 座位网格展示 |
| SeatCard | components/seat/SeatCard.vue | 单个座位卡片 |
| SeatFilter | components/seat/SeatFilter.vue | 座位筛选表单 |
| ReservationForm | components/reservation/ReservationForm.vue | 预约表单 |
| TimeSlotPicker | components/reservation/TimeSlotPicker.vue | 时段选择器 |
| UsageChart | components/stats/UsageChart.vue | 使用率图表 |
| TrendChart | components/stats/TrendChart.vue | 趋势图表 |
| ViolationChart | components/stats/ViolationChart.vue | 违约图表 |
| HeatmapChart | components/stats/HeatmapChart.vue | 热力图 |

### 4.3 组件命名规范

- 页面组件：PascalCase，如 `SeatList.vue`
- 业务组件：PascalCase，如 `SeatCard.vue`
- 通用组件：`App` 前缀，如 `AppHeader.vue`
- 组合式函数：`use` 前缀，如 `useAuth.js`

### 4.4 组件复用策略

| 复用类型 | 实现方式 | 示例 |
|---------|---------|------|
| 基础组件 | Element Plus | Button、Input、Table |
| 业务组件 | components/ 目录 | SeatCard、ReservationCard |
| 组合式函数 | composables/ 目录 | useAuth、usePagination |
| 布局组件 | layouts/ 目录 | DefaultLayout |

## 5 状态管理方案

### 5.1 状态结构设计

```javascript
// stores/user.js
{
  userInfo: {
    id: String,
    username: String,
    role: 'student' | 'admin' | 'super_admin',
    violations: Number,
    inBlacklist: Boolean
  },
  token: String,
  isLoggedIn: Boolean
}

// stores/seat.js
{
  seats: [{
    id: String,
    code: String,
    areaId: String,
    areaName: String,
    floor: Number,
    status: 'available' | 'reserved' | 'in_use' | 'maintenance' | 'disabled',
    facilities: String[]
  }],
  areas: [{ id, name, floor, totalSeats, openTime, closeTime }],
  filters: { areaId, floor, status, facilities }
}

// stores/reservation.js
{
  currentReservation: {
    id: String,
    seatId: String,
    userId: String,
    date: String,
    startTime: String,
    endTime: String,
    status: 'pending' | 'checked_in' | 'completed' | 'cancelled' | 'violated'
  },
  myReservations: [],
  checkInDeadline: Date
}
```

### 5.2 状态管理工具选型

采用 **Pinia** 作为状态管理工具，原因：
- Vue 3 官方推荐
- TypeScript 支持良好
- API 简洁直观
- 支持持久化插件

### 5.3 状态更新流程

```
用户操作 → 组件调用 → Store Action → API请求 → 更新State → 响应式UI更新

示例：预约座位
1. 用户选择座位和时间 → Reserve.vue
2. 调用 useReservation().createReservation(data)
3. Store action 调用 api.reservation.create()
4. 成功后更新 reservation.currentReservation
5. 页面跳转到确认页
```

### 5.4 状态持久化方案

| 数据 | 持久化策略 | 存储位置 |
|-----|-----------|---------|
| token | 自动续期 | localStorage |
| userInfo | 登录时加载 | 内存 |
| 筛选条件 | 页面切换保留 | sessionStorage |
| 草稿表单 | 防丢失 | sessionStorage |

## 6 路由设计

### 6.1 路由结构规划

```javascript
const routes = [
  // 公开路由
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  
  // 用户路由
  {
    path: '/',
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/seats' },
      { path: 'seats', name: 'SeatList', component: SeatList },
      { path: 'seats/map', name: 'SeatMapView', component: SeatMapView },
      { path: 'reserve/:seatId', name: 'Reserve', component: Reserve },
      { path: 'my-reservations', name: 'MyReservations', component: MyReservations },
      { path: 'profile', name: 'Profile', component: Profile },
      { path: 'violations', name: 'ViolationRecord', component: ViolationRecord }
    ]
  },
  
  // 管理员路由
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', name: 'Dashboard', component: Dashboard },
      { path: 'seats', name: 'SeatManage', component: SeatManage },
      { path: 'areas', name: 'AreaManage', component: AreaManage },
      { path: 'rules', name: 'RuleConfig', component: RuleConfig },
      { path: 'users', name: 'UserManage', component: UserManage },
      { path: 'stats', name: 'StatsView', component: StatsView }
    ]
  }
]
```

### 6.2 路由守卫设计

```javascript
// 全局前置守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }
  
  if (to.meta.requiresAdmin && !['admin', 'super_admin'].includes(userStore.role)) {
    next({ name: 'SeatList' })
    return
  }
  
  next()
})
```

### 6.3 路由参数设计

| 路由 | 参数 | 说明 |
|-----|------|------|
| /seats | areaId, floor, status | 座位列表筛选 |
| /reserve/:seatId | seatId (路径), date, timeSlot (查询) | 预约座位 |
| /admin/users | page, keyword, role | 用户管理分页 |

## 7 样式方案

### 7.1 样式框架选择

| 类型 | 选型 | 用途 |
|-----|------|------|
| CSS框架 | Element Plus | 基础组件样式 |
| 预处理器 | SCSS | 变量、混合器、嵌套 |
| 工具类 | Tailwind CSS (可选) | 快速布局 |

### 7.2 样式组织方式

```
assets/styles/
├── _variables.scss      # 全局变量
├── _mixins.scss         # 混合器
├── _reset.scss          # 重置样式
├── _common.scss         # 公共样式
└── main.scss            # 入口文件
```

### 7.3 响应式设计方案

| 断点 | 屏幕宽度 | 布局策略 |
|-----|---------|---------|
| xs | < 576px | 单列堆叠 |
| sm | 576-768px | 紧凑布局 |
| md | 768-992px | 标准布局 |
| lg | 992-120px | 宽屏布局 |
| xl | > 120px | 最大化利用 |

## 8 用户体验优化

### 8.1 加载状态处理

| 场景 | 处理方式 |
|-----|---------|
| 页面初始加载 | Skeleton骨架屏 |
| 数据列表加载 | Table loading状态 |
| 按钮操作 | Button loading + 禁用 |
| 图表加载 | 图表内置loading |

### 8.2 错误提示设计

| 错误类型 | 提示方式 |
|---------|---------|
| 表单验证失败 | 行内红色提示 + 表单顶部汇总 |
| API请求失败 | ElMessage.error 顶部弹出 |
| 网络错误 | 全局错误拦截 + 友好提示 |
| 权限不足 | 弹窗提示 + 跳转 |

### 8.3 操作反馈机制

| 操作 | 反馈 |
|-----|------|
| 预约成功 | 成功提示 + 跳转确认页 |
| 签到成功 | 成功提示 + 座位信息卡片 |
| 取消预约 | 二次确认弹窗 |
| 删除操作 | 确认弹窗 + 成功提示 |

## 9 表单验证与错误处理

### 9.1 表单验证规则

```javascript
// 登录表单
const loginRules = {
  username: [
    { required: true, message: '请输入账号' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符' }
  ],
  password: [
    { required: true, message: '请输入密码' },
    { min: 6, message: '密码至少6位' }
  ]
}

// 预约表单
const reservationRules = {
  date: [{ required: true, message: '请选择日期' }],
  timeSlot: [{ required: true, message: '请选择时段' }]
}

// 注册表单
const registerRules = {
  studentId: [
    { required: true, message: '请输入学号' },
    { pattern: /^\d{10}$/, message: '学号为10位数字' }
  ],
  phone: [
    { required: true, message: '请输入手机号' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
  ],
  password: [
    { required: true, message: '请输入密码' },
    { min: 6, max: 20, message: '密码6-20位' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}
```

### 9.2 错误消息设计

- 位置：表单控件右侧或下方
- 样式：红色文字，图标提示
- 动画：淡入效果

### 9.3 表单提交流程

```
用户填写 → 实时验证 → 提交按钮 → loading状态 → 
  ├─ 成功 → 提示 + 跳转/重置
  └─ 失败 → 错误提示 + 定位到错误字段
```

## 10 响应式设计

### 10.1 断点设置

```scss
$breakpoints: (
  'xs': 576px,
  'sm': 768px,
  'md': 992px,
  'lg': 120px,
  'xl': 1920px
);
```

### 10.2 组件响应式策略

| 组件 | 响应式策略 |
|-----|-----------|
| 座位图 | 缩放 + 拖拽 |
| 侧边菜单 | 折叠/展开 |
| 表格 | 列隐藏 + 横向滚动 |
| 统计图表 | 自适应容器宽度 |
| 表单 | 单列/双列切换 |

### 10.3 移动端适配方案

- 使用 Element Plus 响应式工具
- 座位图支持触摸缩放
- 简化移动端导航为底部Tab栏
- 关键操作按钮固定底部