# 图书馆座位预约系统 API 接口契约文档

## 1 概述

本文档定义图书馆座位预约系统的后端接口规范，采用 RESTful 风格设计，基于 JWT Bearer Token 进行身份认证。

**基础路径**: `http://api.library.com/api/v1`

**统一响应格式**:
```json
{
  "code": 200,
  "message": "success",
  "data": {}
```

---

## 2 认证接口

| 方法 | 路径 | 功能 | 认证 |
|-----|------|------|------|
| POST | /auth/login | 用户登录 | 否 |
| POST | /auth/register | 用户注册 | 否 |
| GET | /auth/me | 获取当前用户信息 | 是 |

### 2.1 用户登录

**请求**:
```json
{
  "username": "2023001",
  "password": "******"
}
```

**响应**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "username": "2023001",
      "realName": "张三",
      "role": "student"
    }
  }
```

### 2.2 用户注册

**请求**:
```json
{
  "username": "2023002",
  "password": "******",
  "realName": "李四",
  "phone": "13800138000"
}
```

**响应**:
```json
{
  "code": 201,
  "message": "注册成功",
  "data": { "id": 2, "username": "2023002" }
```

### 2.3 获取当前用户信息

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "2023001",
    "realName": "张三",
    "phone": "13800138000",
    "email": "zhangsan@edu.cn",
    "role": "student",
    "violationCount": 0,
    "status": "active"
  }
```

---

## 3 座位管理接口

| 方法 | 路径 | 功能 | 认证 |
|-----|------|------|------|
| GET | /seats | 查询座位列表 | 是 |
| GET | /seats/:id | 获取座位详情 | 是 |
| GET | /areas | 查询区域列表 | 是 |
| POST | /seats | 添加座位 | 管理员 |
| PUT | /seats/:id | 更新座位 | 管理员 |

### 3.1 查询座位列表

**查询参数**: `areaId`, `floor`, `status`, `page`, `pageSize`

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "seatNo": "A-101",
        "areaId": 1,
        "areaName": "一楼自习区",
        "floor": 1,
        "status": "available",
        "hasPower": true,
        "hasWindow": false
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
```

### 3.2 获取座位详情

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "seatNo": "A-101",
    "areaId": 1,
    "areaName": "一楼自习区",
    "floor": 1,
    "status": "available",
    "hasPower": true,
    "hasWindow": false,
    "description": "靠墙位置，视野开阔"
  }
```

### 3.3 查询区域列表

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    { "id": 1, "name": "一楼自习区", "floor": 1, "totalSeats": 50 },
    { "id": 2, "name": "二楼阅览区", "floor": 2, "totalSeats": 40 }
  ]
}
```

---

## 4 预约模块接口

| 方法 | 路径 | 功能 | 认证 |
|-----|------|------|------|
| POST | /reservations | 创建预约 | 是 |
| GET | /reservations | 我的预约列表 | 是 |
| GET | /reservations/:id | 预约详情 | 是 |
| POST | /reservations/:id/checkin | 签到确认 | 是 |
| DELETE | /reservations/:id | 取消预约 | 是 |
| PUT | /reservations/:id/release | 释放座位 | 是 |

### 4.1 创建预约

**请求**:
```json
{
  "seatId": 1,
  "date": "2024-01-15",
  "startTime": "09:00",
  "endTime": "12:00"
}
```

**响应**:
```json
{
  "code": 201,
  "message": "预约成功",
  "data": {
    "id": 1,
    "seatNo": "A-101",
    "date": "2024-01-15",
    "startTime": "09:00",
    "endTime": "12:00",
    "status": "reserved",
    "checkinDeadline": "09:30"
  }
```

### 4.2 我的预约列表

**查询参数**: `status`, `date`, `page`, `pageSize`

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "seatNo": "A-101",
        "areaName": "一楼自习区",
        "date": "2024-01-15",
        "startTime": "09:00",
        "endTime": "12:00",
        "status": "reserved",
        "checkinDeadline": "09:30"
      }
    ],
    "total": 5,
    "page": 1,
    "pageSize": 10
  }
```

### 4.3 签到确认

**响应**:
```json
{
  "code": 200,
  "message": "签到成功",
  "data": {
    "id": 1,
    "status": "checked_in",
    "checkinTime": "08:55"
  }
```

### 4.4 取消预约

**响应**:
```json
{
  "code": 200,
  "message": "取消成功",
  "data": { "id": 1, "status": "cancelled" }
```

### 4.5 释放座位

**响应**:
```json
{
  "code": 200,
  "message": "座位已释放",
  "data": { "id": 1, "status": "completed" }
```

---

## 5 违约管理接口

| 方法 | 路径 | 功能 | 认证 |
|-----|------|------|------|
| GET | /violations | 我的违约记录 | 是 |
| GET | /violations/user/:userId | 用户违约记录 | 管理员 |

### 5.1 我的违约记录

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "reservationId": 10,
        "seatNo": "A-102",
        "date": "2024-01-10",
        "type": "no_checkin",
        "status": "pending",
        "createdAt": "2024-01-10 10:00:00"
      }
    ],
    "total": 1,
    "currentCount": 1,
    "maxAllowed": 3
  }
```

---

## 6 规则配置接口（管理员）

| 方法 | 路径 | 功能 | 认证 |
|-----|------|------|------|
| GET | /rules | 获取规则配置 | 管理员 |
| PUT | /rules | 更新规则配置 | 管理员 |
| GET | /rules/timeslots | 获取预约时段 | 是 |
| POST | /rules/timeslots | 添加预约时段 | 管理员 |

### 6.1 获取规则配置

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "maxDailyReservations": 2,
    "maxWeeklyReservations": 10,
    "checkinDeadlineMinutes": 30,
    "violationThreshold": 3,
    "violationPenaltyDays": 7,
    "advanceBookingDays": 7,
    "minBookingDuration": 30,
    "maxBookingDuration": 480
  }
```

### 6.2 更新规则配置

**请求**:
```json
{
  "checkinDeadlineMinutes": 30,
  "violationThreshold": 3,
  "violationPenaltyDays": 7
}
```

**响应**:
```json
{
  "code": 200,
  "message": "配置更新成功",
  "data": { "updated": true }
```

### 6.3 获取预约时段

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    { "id": 1, "startTime": "08:00", "endTime": "12:00", "enabled": true },
    { "id": 2, "startTime": "14:00", "endTime": "18:00", "enabled": true },
    { "id": 3, "startTime": "19:00", "endTime": "22:00", "enabled": true }
  ]
}
```

---

## 7 统计分析接口

| 方法 | 路径 | 功能 | 认证 |
|-----|------|------|------|
| GET | /stats/overview | 数据概览 | 是 |
| GET | /stats/usage | 使用率统计 | 是 |
| GET | /stats/trend | 预约趋势 | 是 |
| GET | /stats/violations | 违约统计 | 管理员 |
| GET | /stats/real-time | 实时状态 | 是 |

### 7.1 数据概览

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "todayReservations": 45,
    "todayCheckins": 40,
    "todayViolations": 5,
    "totalSeats": 200,
    "availableSeats": 30,
    "occupancyRate": 85.0
  }
```

### 7.2 使用率统计

**查询参数**: `startDate`, `endDate`, `areaId`

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "areas": [
      { "areaName": "一楼自习区", "occupancyRate": 85.5, "totalBookings": 120 },
      { "areaName": "二楼阅览区", "occupancyRate": 72.3, "totalBookings": 95 }
    ],
    "timeSlots": [
      { "timeRange": "08:00-12:00", "avgRate": 90.0 },
      { "timeRange": "14:00-18:00", "avgRate": 75.0 }
    ]
  }
```

### 7.3 预约趋势

**查询参数**: `type` (daily/weekly/monthly), `days`

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "labels": ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
    "data": [42, 38, 45, 50, 48, 35, 30]
  }
```

### 7.4 违约统计（管理员）

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalViolations": 25,
    "violationRate": 3.2,
    "topUsers": [
      { "username": "2023005", "realName": "王五", "count": 3 },
      { "username": "2023008", "realName": "赵六", "count": 2 }
    ],
    "byType": [
      { "type": "no_checkin", "count": 15 },
      { "type": "early_release", "count": 10 }
    ]
  }
```

### 7.5 实时状态

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "areas": [
      {
        "id": 1,
        "name": "一楼自习区",
        "total": 50,
        "available": 10,
        "occupied": 35,
        "reserved": 5
      }
    ],
    "updatedAt": "2024-01-15 10:30:00"
  }
```

---

## 8 用户管理接口（管理员）

| 方法 | 路径 | 功能 | 认证 |
|-----|------|------|------|
| GET | /admin/users | 用户列表 | 管理员 |
| PUT | /admin/users/:id/status | 更新用户状态 | 管理员 |
| GET | /admin/logs | 操作日志 | 管理员 |

### 8.1 用户列表

**查询参数**: `role`, `status`, `keyword`, `page`, `pageSize`

**响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "username": "2023001",
        "realName": "张三",
        "role": "student",
        "status": "active",
        "violationCount": 0,
        "createdAt": "2024-01-01"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 20
  }
```

### 8.2 更新用户状态

**请求**:
```json
{
  "status": "banned",
  "reason": "多次违约"
}
```

**响应**:
```json
{
  "code": 200,
  "message": "状态更新成功",
  "data": { "id": 1, "status": "banned" }
```

---

## 9 错误码设计

| 错误码 | 说明 |
|-------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权/Token无效 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如座位已被预约） |
| 422 | 业务规则不允许 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |