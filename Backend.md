# 图书馆座位预约系统后端技术文档

## 1 项目概述

### 1.1 技术架构

| 层级 | 技术选型 | 说明 |
|-----|---------|------|
| 运行时 | Node.js 18+ | JavaScript运行环境 |
| 框架 | Express 4.x | Web应用框架 |
| 数据库 | MySQL 8.0 | 关系型数据库 |
| ORM | Sequelize 6.x | 数据库ORM映射 |
| 认证 | JWT | 无状态身份令牌 |
| 缓存 | Redis | 会话缓存与数据缓存 |
| 日志 | Winston | 日志记录 |
| 部署 | Nginx | 反向代理与静态资源服务 |
| 进程管理 | PM2 | 进程守护 |

### 1.2 项目目录结构

```
backend/
├── src/
│   ├── config/            # 配置文件
│   │   ├── database.js    # 数据库配置
│   │   ├── redis.js       # Redis配置
│   │   ├── jwt.js         # JWT配置
│   │   └── app.js         # 应用配置
│   ├── controllers/       # 控制器层
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── seatController.js
│   │   ├── reservationController.js
│   │   ├── ruleController.js
│   │   └── statsController.js
│   ├── services/          # 业务逻辑层
│   │   ├── authService.js
│   │   ├── userService.js
│   │   ├── seatService.js
│   │   ├── reservationService.js
│   │   ├── ruleService.js
│   │   ├── violationService.js
│   │   └── statsService.js
│   ├── models/            # 数据模型层
│   │   ├── index.js       # 模型初始化
│   │   ├── User.js
│   │   ├── Seat.js
│   │   ├── Area.js
│   │   ├── Reservation.js
│   │   ├── Violation.js
│   │   ├── Rule.js
│   │   └── SystemLog.js
│   ├── routes/            # 路由定义
│   │   ├── index.js
│   │   ├── auth.js
│   │   ├── user.js
│   │   ├── seat.js
│   │   ├── reservation.js
│   │   ├── rule.js
│   │   └── stats.js
│   ├── middlewares/       # 中间件
│   │   ├── auth.js        # 认证中间件
│   │   ├── rbac.js        # 权限中间件
│   │   ├── validator.js   # 参数校验
│   │   ├── errorHandler.js
│   │   └── logger.js
│   ├── utils/             # 工具函数
│   │   ├── response.js    # 响应封装
│   │   ├── date.js        # 日期工具
│   │   ├── password.js    # 密码工具
│   │   └── codeGenerator.js
│   ├── jobs/              # 定时任务
│   │   ├── autoCancel.js  # 自动取消超时预约
│   │   ├── autoViolation.js # 自动违约处理
│   │   └── statsReport.js # 统计报表生成
│   └── app.js             # 应用入口
├── scripts/               # 脚本文件
│   ├── initDb.js          # 数据库初始化
│   └── seedData.js        # 测试数据
├── nginx/
│   └──.conf               # Nginx配置
├── package.json
└── .env.example
```

## 2 数据库设计

### 2.1 数据库选型

- **数据库**: MySQL 8.0
- **字符集**: utf8mb4
- **排序规则**: utf8mb4_unicode_ci
- **存储引擎**: InnoDB

### 2.2 ER关系图

```
用户(User) 1 ───────── N 预约(Reservation)
用户(User) 1 ───────── N 违约记录(Violation)
区域(Area) 1 ───────── N 座位(Seat)
座位(Seat) 1 ───────── N 预约(Reservation)
规则配置(Rule) 1 ───── N 用户(User) [应用规则]
管理员(Admin) ───────── 系统日志(SystemLog)
```

### 2.3 表结构设计

#### 2.3.1 用户表 (users)

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 用户ID |
| username | VARCHAR(50) | UNIQUE, NOT NULL | 用户名/学号 |
| password | VARCHAR(255) | NOT NULL | 密码(加密存储) |
| real_name | VARCHAR(100) | NOT NULL | 真实姓名 |
| phone | VARCHAR(20) | NULL | 手机号 |
| email | VARCHAR(100) | NULL | 邮箱 |
| role | ENUM('student','admin','super_admin') | DEFAULT 'student' | 角色 |
| status | ENUM('active','banned','inactive') | DEFAULT 'active' | 账户状态 |
| violation_count | INT | DEFAULT 0 | 违约次数 |
| violation_level | TINYINT | DEFAULT 0 | 违约等级(0-5) |
| ban_until | DATETIME | NULL | 封禁截止时间 |
| last_login_at | DATETIME | NULL | 最后登录时间 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**索引设计**:
- PRIMARY KEY (id)
- UNIQUE INDEX idx_username (username)
- INDEX idx_role (role)
- INDEX idx_status (status)
- INDEX idx_phone (phone)

#### 2.3.2 区域表 (areas)

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 区域ID |
| name | VARCHAR(100) | NOT NULL | 区域名称 |
| floor | TINYINT | NOT NULL | 楼层 |
| building | VARCHAR(100) | DEFAULT '主楼' | 建筑名称 |
| description | TEXT | NULL | 区域描述 |
| open_time | TIME | DEFAULT '08:00:00' | 开放开始时间 |
| close_time | TIME | DEFAULT '22:00:00' | 开放结束时间 |
| total_seats | INT | DEFAULT 0 | 座位总数(冗余) |
| status | ENUM('open','closed','maintenance') | DEFAULT 'open' | 区域状态 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**索引设计**:
- PRIMARY KEY (id)
- INDEX idx_floor (floor)
- INDEX idx_status (status)

#### 2.3.3 座位表 (seats)

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 座位ID |
| seat_code | VARCHAR(20) | UNIQUE, NOT NULL | 座位编号 |
| area_id | INT | FK, NOT NULL | 所属区域ID |
| row_num | TINYINT | NOT NULL | 排号 |
| col_num | TINYINT | NOT NULL | 列号 |
| has_power | BOOLEAN | DEFAULT FALSE | 是否有电源 |
| has_window | BOOLEAN | DEFAULT FALSE | 是否靠窗 |
| is_quiet | BOOLEAN | DEFAULT TRUE | 是否静音区 |
| status | ENUM('available','reserved','in_use','maintenance','disabled') | DEFAULT 'available' | 座位状态 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**索引设计**:
- PRIMARY KEY (id)
- UNIQUE INDEX idx_seat_code (seat_code)
- INDEX idx_area_id (area_id)
- INDEX idx_status (status)
- INDEX idx_area_status (area_id, status)

#### 2.3.4 预约表 (reservations)

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 预约ID |
| reservation_code | VARCHAR(20) | UNIQUE, NOT NULL | 预约码 |
| user_id | INT | FK, NOT NULL | 用户ID |
| seat_id | INT | FK, NOT NULL | 座位ID |
| area_id | INT | FK, NOT NULL | 区域ID |
| reserve_date | DATE | NOT NULL | 预约日期 |
| start_time | TIME | NOT NULL | 开始时间 |
| end_time | TIME | NOT NULL | 结束时间 |
| status | ENUM('pending','checked_in','completed','cancelled','violated','expired') | DEFAULT 'pending' | 预约状态 |
| check_in_time | DATETIME | NULL | 签到时间 |
| check_out_time | DATETIME | NULL | 离开时间 |
| cancel_reason | VARCHAR(255) | NULL | 取消原因 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**索引设计**:
- PRIMARY KEY (id)
- UNIQUE INDEX idx_reservation_code (reservation_code)
- INDEX idx_user_id (user_id)
- INDEX idx_seat_id (seat_id)
- INDEX idx_reserve_date (reserve_date)
- INDEX idx_status (status)
- INDEX idx_user_date (user_id, reserve_date)
- INDEX idx_seat_date (seat_id, reserve_date)

#### 2.3.5 违约记录表 (violations)

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 记录ID |
| user_id | INT | FK, NOT NULL | 用户ID |
| reservation_id | INT | FK, NOT NULL | 关联预约ID |
| type | ENUM('no_checkin','early_leave','late_checkin','rule_violation') | NOT NULL | 违约类型 |
| description | TEXT | NULL | 违约描述 |
| penalty | VARCHAR(255) | NULL | 处罚措施 |
| penalty_days | INT | DEFAULT 0 | 处罚天数 |
| is_appealed | BOOLEAN | DEFAULT FALSE | 是否申诉 |
| appeal_status | ENUM('none','pending','approved','rejected') | DEFAULT 'none' | 申诉状态 |
| appeal_reason | TEXT | NULL | 申诉原因 |
| appeal_result | TEXT | NULL | 申诉结果 |
| handled_by | INT | FK, NULL | 处理人ID |
| handled_at | DATETIME | NULL | 处理时间 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**索引设计**:
- PRIMARY KEY (id)
- INDEX idx_user_id (user_id)
- INDEX idx_reservation_id (reservation_id)
- INDEX idx_type (type)
- INDEX idx_created_at (created_at)

#### 2.3.6 规则配置表 (rules)

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 规则ID |
| rule_key | VARCHAR(50) | UNIQUE, NOT NULL | 规则键名 |
| rule_name | VARCHAR(100) | NOT NULL | 规则名称 |
| rule_value | VARCHAR(255) | NOT NULL | 规则值 |
| rule_type | ENUM('time','limit','penalty','system') | NOT NULL | 规则类型 |
| description | TEXT | NULL | 规则描述 |
| is_active | BOOLEAN | DEFAULT TRUE | 是否启用 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**默认规则值**:

| rule_key | rule_value | 说明 |
|---------|-----------|------|
| max_reservations_per_day | 2 | 每人每日最大预约数 |
| max_reservations_per_week | 10 | 每人每周最大预约数 |
| checkin_deadline_minutes | 30 | 签到时限(分钟) |
| violation_threshold | 3 | 违约阈值 |
| ban_days_per_violation | 1 | 每次违约封禁天数 |
| reservation_ahead_hours | 24 | 最多提前预约小时数 |
| min_reservation_duration | 60 | 最小预约时长(分钟) |
| max_reservation_duration | 480 | 最大预约时长(分钟) |
| advance_cancel_hours | 1 | 提前取消时限(小时) |
| quiet_hours_start | 22:00 | 静音开始时间 |
| quiet_hours_end | 08:00 | 静音结束时间 |

#### 2.3.7 系统日志表 (system_logs)

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 日志ID |
| user_id | INT | FK, NULL | 操作者ID |
| action | VARCHAR(50) | NOT NULL | 操作类型 |
| module | VARCHAR(50) | NOT NULL | 操作模块 |
| target_type | VARCHAR(50) | NULL | 目标类型 |
| target_id | INT | NULL | 目标ID |
| ip_address | VARCHAR(45) | NULL | IP地址 |
| user_agent | VARCHAR(255) | NULL | 用户代理 |
| request_data | JSON | NULL | 请求数据 |
| response_data | JSON | NULL | 响应数据 |
| status_code | INT | NULL | 状态码 |
| error_message | TEXT | NULL | 错误信息 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**索引设计**:
- PRIMARY KEY (id)
- INDEX idx_user_id (user_id)
- INDEX idx_action (action)
- INDEX idx_module (module)
- INDEX idx_created_at (created_at)

### 2.4 数据关系设计

```sql
-- 用户与预约关系
ALTER TABLE reservations ADD CONSTRAINT fk_reservation_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 座位与预约关系
ALTER TABLE reservations ADD CONSTRAINT fk_reservation_seat 
FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE CASCADE;

-- 区域与座位关系
ALTER TABLE seats ADD CONSTRAINT fk_seat_area 
FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE;

-- 违约与预约关系
ALTER TABLE violations ADD CONSTRAINT fk_violation_reservation 
FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE;
```

## 3 API接口设计

### 3.1 RESTful API设计规范

**URL命名规范**:
- 资源使用名词复数形式
- 使用kebab-case命名
- 版本号置于URL前缀

**HTTP方法规范**:

| 方法 | 用途 | 示例 |
|-----|------|------|
| GET | 查询资源 | GET /api/v1/seats |
| POST | 创建资源 | POST /api/v1/reservations |
| PUT | 更新资源(完整) | PUT /api/v1/users/1 |
| PATCH | 更新资源(部分) | PATCH /api/v1/reservations/1/status |
| DELETE | 删除资源 | DELETE /api/v1/reservations/1 |

**统一响应格式**:
```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": "2024-01-01T12:00:00Z",
  "requestId": "uuid"
}
```

**分页响应格式**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
```

### 3.2 认证模块API

#### 3.2.1 用户注册

```
POST /api/v1/auth/register
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| username | string | 是 | 用户名/学号(6-20位) |
| password | string | 是 | 密码(8-20位,含大小写字母和数字) |
| realName | string | 是 | 真实姓名 |
| phone | string | 否 | 手机号 |
| email | string | 否 | 邮箱 |

**响应示例**:
```json
{
  "code": 201,
  "message": "注册成功",
  "data": {
    "userId": 1,
    "username": "2024001001"
  }
```

#### 3.2.2 用户登录

```
POST /api/v1/auth/login
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |
| captcha | string | 否 | 验证码 |

**响应示例**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 720,
    "user": {
      "id": 1,
      "username": "2024001001",
      "realName": "张三",
      "role": "student",
      "status": "active"
    }
  }
```

#### 3.2.3 刷新令牌

```
POST /api/v1/auth/refresh
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| refreshToken | string | 是 | 刷新令牌 |

#### 3.2.4 退出登录

```
POST /api/v1/auth/logout
```

**请求头**: `Authorization: Bearer <token>`

### 3.3 用户模块API

#### 3.3.1 获取当前用户信息

```
GET /api/v1/users/me
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "username": "2024001001",
    "realName": "张三",
    "phone": "13800138000",
    "email": "zhangsan@example.com",
    "role": "student",
    "status": "active",
    "violationCount": 1,
    "violationLevel": 1,
    "banUntil": null
  }
```

#### 3.3.2 更新个人信息

```
PUT /api/v1/users/me
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| phone | string | 否 | 手机号 |
| email | string | 否 | 邮箱 |

#### 3.3.3 修改密码

```
PUT /api/v1/users/me/password
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| oldPassword | string | 是 | 原密码 |
| newPassword | string | 是 | 新密码 |

#### 3.3.4 获取用户列表 (管理员)

```
GET /api/v1/users
```

**查询参数**:
| 参数 | 类型 | 说明 |
|-----|------|------|
| page | int | 页码(默认1) |
| pageSize | int | 每页数量(默认20) |
| role | string | 角色筛选 |
| status | string | 状态筛选 |
| keyword | string | 关键词搜索 |

#### 3.3.5 更新用户状态 (管理员)

```
PATCH /api/v1/users/:id/status
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| status | string | 是 | active/banned/inactive |
| banDays | int | 否 | 封禁天数(仅当status为banned时) |

#### 3.3.6 重置用户密码 (管理员)

```
POST /api/v1/users/:id/reset-password
```

### 3.4 区域管理API

#### 3.4.1 获取区域列表

```
GET /api/v1/areas
```

**查询参数**:
| 参数 | 类型 | 说明 |
|-----|------|------|
| floor | int | 楼层筛选 |
| status | string | 状态筛选 |
| includeSeats | boolean | 是否包含座位统计 |

**响应示例**:
```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "name": "一楼自习区",
      "floor": 1,
      "building": "主楼",
      "openTime": "08:00:00",
      "closeTime": "22:00:00",
      "totalSeats": 100,
      "availableSeats": 45,
      "reservedSeats": 30,
      "inUseSeats": 25,
      "status": "open"
    }
  ]
}
```

#### 3.4.2 获取区域详情

```
GET /api/v1/areas/:id
```

#### 3.4.3 创建区域 (管理员)

```
POST /api/v1/areas
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| name | string | 是 | 区域名称 |
| floor | int | 是 | 楼层 |
| building | string | 否 | 建筑名称 |
| description | string | 否 | 区域描述 |
| openTime | string | 否 | 开放开始时间 |
| closeTime | string | 否 | 开放结束时间 |

#### 3.4.4 更新区域 (管理员)

```
PUT /api/v1/areas/:id
```

#### 3.4.5 删除区域 (管理员)

```
DELETE /api/v1/areas/:id
```

### 3.5 座位管理API

#### 3.5.1 获取座位列表

```
GET /api/v1/seats
```

**查询参数**:
| 参数 | 类型 | 说明 |
|-----|------|------|
| areaId | int | 区域ID |
| floor | int | 楼层 |
| status | string | 座位状态 |
| hasPower | boolean | 是否有电源 |
| hasWindow | boolean | 是否靠窗 |
| isQuiet | boolean | 是否静音区 |
| date | string | 查询日期(yyyy-mm-dd) |
| startTime | string | 开始时间(H:MM) |
| endTime | string | 结束时间(H:MM) |
| page | int | 页码 |
| pageSize | int | 每页数量 |

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1,
        "seatCode": "A-01-05",
        "areaId": 1,
        "areaName": "一楼自习区",
        "rowNum": 1,
        "colNum": 5,
        "hasPower": true,
        "hasWindow": false,
        "isQuiet": true,
        "status": "available"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
```

#### 3.5.2 获取座位地图视图

```
GET /api/v1/seats/map/:areaId
```

**查询参数**:
| 参数 | 类型 | 说明 |
|-----|------|------|------|
| date | string | 查询日期 |
| startTime | string | 开始时间 |
| endTime | string | 结束时间 |

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "areaId": 1,
    "areaName": "一楼自习区",
    "rows": 10,
    "cols": 15,
    "seats": [
      {
        "seatCode": "A-01-05",
        "row": 1,
        "col": 5,
        "status": "available",
        "hasPower": true,
        "hasWindow": false
      }
    ]
  }
```

#### 3.5.3 获取座位详情

```
GET /api/v1/seats/:id
```

#### 3.5.4 创建座位 (管理员)

```
POST /api/v1/seats
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| seatCode | string | 是 | 座位编号 |
| areaId | int | 是 | 区域ID |
| rowNum | int | 是 | 排号 |
| colNum | int | 是 | 列号 |
| hasPower | boolean | 否 | 是否有电源 |
| hasWindow | boolean | 否 | 是否靠窗 |
| isQuiet | boolean | 否 | 是否静音区 |

#### 3.5.5 批量创建座位 (管理员)

```
POST /api/v1/seats/batch
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| areaId | int | 是 | 区域ID |
| prefix | string | 是 | 座位编号前缀 |
| rows | int | 是 | 行数 |
| cols | int | 是 | 列数 |
| hasPower | boolean | 否 | 是否有电源 |
| isQuiet | boolean | 否 | 是否静音区 |

#### 3.5.6 更新座位 (管理员)

```
PUT /api/v1/seats/:id
```

#### 3.5.7 批量更新座位状态 (管理员)

```
PATCH /api/v1/seats/batch/status
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| seatIds | array | 是 | 座位ID数组 |
| status | string | 是 | 目标状态 |

### 3.6 预约模块API

#### 3.6.1 预约座位

```
POST /api/v1/reservations
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| seatId | int | 是 | 座位ID |
| reserveDate | string | 是 | 预约日期(yyyy-mm-dd) |
| startTime | string | 是 | 开始时间(H:MM) |
| endTime | string | 是 | 结束时间(H:MM) |

**响应示例**:
```json
{
  "code": 201,
  "message": "预约成功",
  "data": {
    "reservationId": 1,
    "reservationCode": "RES20240101001",
    "seatCode": "A-01-05",
    "areaName": "一楼自习区",
    "reserveDate": "2024-01-01",
    "startTime": "09:00",
    "endTime": "12:00",
    "status": "pending",
    "checkinDeadline": "09:30",
    "createdAt": "2023-12-31T15:00:00Z"
  }
```

**业务规则校验**:
- 检查用户是否被封禁
- 检查预约时间是否在开放时间内
- 检查预约时长是否在允许范围内
- 检查是否超过每日/每周预约上限
- 检查座位在选定时间段是否可用
- 检查是否在可提前预约的时间范围内

#### 3.6.2 获取我的预约列表

```
GET /api/v1/reservations/me
```

**查询参数**:
| 参数 | 类型 | 说明 |
|-----|------|------|
| status | string | 预约状态 |
| date | string | 预约日期 |
| startDate | string | 开始日期 |
| endDate | string | 结束日期 |
| page | int | 页码 |
| pageSize | int | 每页数量 |

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1,
        "reservationCode": "RES20240101001",
        "seatCode": "A-01-05",
        "areaName": "一楼自习区",
        "reserveDate": "2024-01-01",
        "startTime": "09:00",
        "endTime": "12:00",
        "status": "pending",
        "checkInTime": null,
        "checkOutTime": null,
        "createdAt": "2023-12-31T15:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 5,
      "totalPages": 1
    }
  }
```

#### 3.6.3 获取预约详情

```
GET /api/v1/reservations/:id
```

#### 3.6.4 签到

```
POST /api/v1/reservations/:id/checkin
```

**响应示例**:
```json
{
  "code": 200,
  "message": "签到成功",
  "data": {
    "reservationId": 1,
    "status": "checked_in",
    "checkInTime": "2024-01-01T09:05:00Z",
    "remainingTime": 175
  }
```

**业务规则**:
- 只能在预约时间段开始前后30分钟内签到
- 签到后座位状态变为使用中

#### 3.6.5 签退/释放座位

```
POST /api/v1/reservations/:id/checkout
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| remark | string | 否 | 备注 |

#### 3.6.6 取消预约

```
POST /api/v1/reservations/:id/cancel
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| reason | string | 否 | 取消原因 |

**业务规则**:
- 仅pending状态的预约可取消
- 预约开始前1小时内不允许取消(需联系管理员)

#### 3.6.7 获取预约统计概览

```
GET /api/v1/reservations/stats/overview
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "todayTotal": 50,
    "todayCheckedIn": 35,
    "todayCompleted": 20,
    "todayCancelled": 5,
    "todayViolated": 2,
    "currentInUse": 30,
    "availableSeats": 70
  }
```

#### 3.6.8 获取所有预约列表 (管理员)

```
GET /api/v1/reservations
```

**查询参数**:
| 参数 | 类型 | 说明 |
|-----|------|------|
| userId | int | 用户ID |
| seatId | int | 座位ID |
| areaId | int | 区域ID |
| status | string | 预约状态 |
| date | string | 预约日期 |
| startDate | string | 开始日期 |
| endDate | string | 结束日期 |
| page | int | 页码 |
| pageSize | int | 每页数量 |

### 3.7 违约管理API

#### 3.7.1 获取我的违约记录

```
GET /api/v1/violations/me
```

**查询参数**:
| 参数 | 类型 | 说明 |
|-----|------|------|
| page | int | 页码 |
| pageSize | int | 每页数量 |

#### 3.7.2 获取违约记录列表 (管理员)

```
GET /api/v1/violations
```

**查询参数**:
| 参数 | 类型 | 说明 |
|-----|------|------|
| userId | int | 用户ID |
| type | string | 违约类型 |
| appealStatus | string | 申诉状态 |
| startDate | string | 开始日期 |
| endDate | string | 结束日期 |
| page | int | 页码 |
| pageSize | int | 每页数量 |

#### 3.7.3 提交申诉

```
POST /api/v1/violations/:id/appeal
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| reason | string | 是 | 申诉原因 |

#### 3.7.4 处理申诉 (管理员)

```
PATCH /api/v1/violations/:id/appeal
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| status | string | 是 | approved/rejected |
| result | string | 是 | 处理结果 |

### 3.8 规则配置API

#### 3.8.1 获取规则列表

```
GET /api/v1/rules
```

**响应示例**:
```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "ruleKey": "max_reservations_per_day",
      "ruleName": "每日最大预约数",
      "ruleValue": "2",
      "ruleType": "limit",
      "description": "限制用户每天最多预约次数",
      "isActive": true
    }
  ]
}
```

#### 3.8.2 更新规则 (管理员)

```
PUT /api/v1/rules/:id
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| ruleValue | string | 是 | 规则值 |
| description | string | 否 | 规则描述 |

#### 3.8.3 批量更新规则 (管理员)

```
PUT /api/v1/rules/batch
```

**请求参数**:
```json
{
  "rules": [
    {"ruleKey": "max_reservations_per_day", "ruleValue": "3"},
    {"ruleKey": "checkin_deadline_minutes", "ruleValue": "45"}
  ]
}
```

### 3.9 统计分析API

#### 3.9.1 获取仪表盘数据

```
GET /api/v1/stats/dashboard
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "todayOverview": {
      "totalReservations": 120,
      "checkedIn": 85,
      "completed": 60,
      "cancelled": 8,
      "violated": 5
    },
    "realtimeStatus": {
      "totalSeats": 500,
      "available": 180,
      "reserved": 120,
      "inUse": 200
    },
    "trendData": [
      {"date": "2024-01-01", "count": 120},
      {"date": "2024-01-02", "count": 135}
    ],
    "topAreas": [
      {"areaId": 1, "areaName": "一楼自习区", "usageRate": 0.85},
      {"areaId": 2, "areaName": "二楼阅览区", "usageRate": 0.72}
    ],
    "violationTrend": [
      {"date": "2024-01-01", "count": 5},
      {"date": "2024-01-02", "count": 3}
    ]
  }
```

#### 3.9.2 获取使用率统计

```
GET /api/v1/stats/usage
```

**查询参数**:
| 参数 | 类型 | 说明 |
|-----|------|------|
| type | string | daily/weekly/monthly |
| startDate | string | 开始日期 |
| endDate | string | 结束日期 |
| areaId | int | 区域ID |

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "summary": {
      "totalHours": 240,
      "avgUsageRate": 0.75,
      "peakHour": 14,
      "peakUsageRate": 0.92
    },
    "byArea": [
      {"areaId": 1, "areaName": "一楼自习区", "usageRate": 0.85, "totalHours": 800}
    ],
    "byHour": [
      {"hour": 8, "usageRate": 0.45},
      {"hour": 9, "usageRate": 0.68}
    ],
    "byDate": [
      {"date": "2024-01-01", "usageRate": 0.72},
      {"date": "2024-01-02", "usageRate": 0.78}
    ]
  }
```

#### 3.9.3 获取违约分析

```
GET /api/v1/stats/violations
```

**查询参数**:
| 参数 | 类型 | 说明 |
|-----|------|------|
| type | string | daily/weekly/monthly |
| startDate | string | 开始日期 |
| endDate | string | 结束日期 |

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "summary": {
      "totalViolations": 50,
      "violationRate": 0.05,
      "topType": "no_checkin"
    },
    "byType": [
      {"type": "no_checkin", "count": 30, "percentage": 0.6},
      {"type": "early_leave", "count": 15, "percentage": 0.3}
    ],
    "topUsers": [
      {"userId": 10, "username": "user10", "violationCount": 5}
    ],
    "trend": [
      {"date": "2024-01-01", "count": 5},
      {"date": "2024-01-02", "count": 3}
    ]
  }
```

#### 3.9.4 获取座位热力图数据

```
GET /api/v1/stats/heatmap
```

**查询参数**:
| 参数 | 类型 | 说明 |
|-----|------|------|------|
| areaId | int | 区域ID |
| date | string | 日期 |
| startTime | string | 开始时间 |
| endTime | string | 结束时间 |

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "areaId": 1,
    "areaName": "一楼自习区",
    "grid": {
      "rows": 10,
      "cols": 15,
      "cells": [
        {"row": 1, "col": 1, "usageCount": 25, "usageRate": 0.85}
      ]
    }
  }
```

#### 3.9.5 获取热门座位排行

```
GET /api/v1/stats/top-seats
```

**查询参数**:
| 参数 | 类型 | 说明 |
|-----|------|------|------|
| type | string | daily/weekly/monthly |
| limit | int | 返回数量(默认10) |

#### 3.9.6 导出统计数据 (管理员)

```
GET /api/v1/stats/export
```

**查询参数**:
| 参数 | 类型 | 说明 |
|-----|------|------|------|
| type | string | reservations/violations/usage |
| startDate | string | 开始日期 |
| endDate | string | 结束日期 |
| format | string | excel/csv |

### 3.10 错误码设计

| 错误码 | HTTP状态码 | 说明 |
|-------|-----------|------|
| 200 | 200 | 成功 |
| 201 | 201 | 创建成功 |
| 400 | 400 | 请求参数错误 |
| 401 | 401 | 未认证/认证失败 |
| 403 | 403 | 无权限访问 |
| 404 | 404 | 资源不存在 |
| 409 | 409 | 资源冲突 |
| 422 | 422 | 业务规则校验失败 |
| 429 | 429 | 请求过于频繁 |
| 500 | 500 | 服务器内部错误 |

**业务错误码**:
| 错误码 | 说明 |
|-------|------|
| AUTH001 | 用户名或密码错误 |
| AUTH002 | 账户已被封禁 |
| AUTH003 | 账户已被禁用 |
| AUTH004 | 令牌已过期 |
| AUTH005 | 令牌无效 |
| SEAT001 | 座位不存在 |
| SEAT002 | 座位不可用 |
| SEAT003 | 座位已被预约 |
| RES001 | 预约不存在 |
| RES002 | 预约状态不允许此操作 |
| RES003 | 超过预约时间限制 |
| RES004 | 超过每日预约上限 |
| RES005 | 超过每周预约上限 |
| RES006 | 预约时间不在开放时间内 |
| RES007 | 预约时长超出限制 |
| RES008 | 签到已超时 |
| RES009 | 不在签到时间范围内 |
| RES010 | 已存在时间冲突的预约 |
| VIO001 | 违约记录不存在 |
| VIO002 | 该记录不支持申诉 |
| VIO003 | 申诉已处理 |
| RULE001 | 规则不存在 |
| RULE002 | 规则不可修改 |

## 4 中间件配置

### 4.1 认证中间件

```javascript
// src/middlewares/auth.js
const jwt = require('jsonwebtoken');
const { jwtConfig } = require('../config');
const { User } = require('../models');
const { ApiError } = require('../utils/response');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, '请先登录', 'AUTH005');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtConfig.secret);

    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      throw new ApiError(401, '用户不存在', 'AUTH005');
    }

    if (user.status === 'banned') {
      const now = new Date();
      if (user.banUntil && user.banUntil > now) {
        throw new ApiError(403, `账户已被封禁至 ${user.banUntil}`, 'AUTH002');
      }
    }

    if (user.status === 'inactive') {
      throw new ApiError(403, '账户已被禁用', 'AUTH003');
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      next(new ApiError(401, '登录已过期，请重新登录', 'AUTH004'));
    } else if (error.name === 'JsonWebTokenError') {
      next(new ApiError(401, '无效的登录凭证', 'AUTH005'));
    } else {
      next(error);
    }
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, jwtConfig.secret);
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password'] }
      });
      if (user) {
        req.user = user;
        req.userId = user.id;
      }
    }
    next();
  } catch {
    next();
  }
};

module.exports = { authenticate, optionalAuth };
```

### 4.2 权限控制中间件

```javascript
// src/middlewares/rbac.js
const { ApiError } = require('../utils/response');

// 角色权限等级
const roleLevels = {
  student: 1,
  admin: 2,
  super_admin: 3
};

// 权限要求
const permissionRequirements = {
  // 用户管理
  'user:list': ['admin', 'super_admin'],
  'user:update': ['admin', 'super_admin'],
  'user:ban': ['admin', 'super_admin'],
  'user:reset-password': ['admin', 'super_admin'],
  
  // 区域管理
  'area:create': ['admin', 'super_admin'],
  'area:update': ['admin', 'super_admin'],
  'area:delete': ['super_admin'],
  
  // 座位管理
  'seat:create': ['admin', 'super_admin'],
  'seat:update': ['admin', 'super_admin'],
  'seat:batch-update': ['admin', 'super_admin'],
  
  // 预约管理
  'reservation:list-all': ['admin', 'super_admin'],
  'reservation:cancel-any': ['admin', 'super_admin'],
  
  // 规则管理
  'rule:update': ['admin', 'super_admin'],
  
  // 违约管理
  'violation:handle': ['admin', 'super_admin'],
  'violation:list-all': ['admin', 'super_admin'],
  
  // 统计管理
  'stats:export': ['admin', 'super_admin']
};

const authorize = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, '请先登录'));
    }

    const userRole = req.user.role;
    const allowedRoles = permissionRequirements[permission];

    if (!allowedRoles) {
      return next();
    }

    if (!allowedRoles.includes(userRole)) {
      return next(new ApiError(403, '您没有权限执行此操作'));
    }

    next();
  };
};

const authorizeByLevel = (minLevel) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, '请先登录'));
    }

    const userLevel = roleLevels[req.user.role] || 0;
    if (userLevel < minLevel) {
      return next(new ApiError(403, '权限不足'));
    }

    next();
  };
};

module.exports = { authorize, authorizeByLevel, roleLevels };
```

### 4.3 参数校验中间件

```javascript
// src/middlewares/validator.js
const { body, param, query, validationResult } = require('express-validator');
const { ApiError } = require('../utils/response');

// 校验结果处理
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const errorMessages = errors.array().map(err => err.msg);
    next(new ApiError(400, errorMessages[0], 'VALIDATION_ERROR'));
  };
};

// 通用校验规则
const validators = {
  // 用户相关
  register: [
    body('username')
      .trim()
      .isLength({ min: 6, max: 20 })
      .withMessage('用户名长度为6-20位')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('用户名只能包含字母、数字和下划线'),
    body('password')
      .isLength({ min: 8, max: 20 })
      .withMessage('密码长度为8-20位')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('密码需包含大小写字母和数字'),
    body('realName')
      .trim()
      .notEmpty()
      .withMessage('真实姓名不能为空')
      .isLength({ max: 100 })
      .withMessage('真实姓名长度不能超过100位'),
    body('phone')
      .optional()
      .matches(/^1[3-9]\d{9}$/)
      .withMessage('手机号格式不正确'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('邮箱格式不正确')
  ],

  login: [
    body('username').trim().notEmpty().withMessage('用户名不能为空'),
    body('password').notEmpty().withMessage('密码不能为空')
  ],

  // 预约相关
  createReservation: [
    body('seatId')
      .isInt({ min: 1 })
      .withMessage('座位ID无效'),
    body('reserveDate')
      .isDate()
      .withMessage('预约日期格式不正确'),
    body('startTime')
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage('开始时间格式不正确'),
    body('endTime')
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage('结束时间格式不正确')
  ],

  // 座位查询
  seatQuery: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须为正整数'),
    query('pageSize')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须在1-100之间'),
    query('date')
      .optional()
      .isDate()
      .withMessage('日期格式不正确')
  ],

  // ID参数
  idParam: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID必须为正整数')
  ]
};

module.exports = { validate, validators };
```

### 4.4 日志中间件

```javascript
// src/middlewares/logger.js
const winston = require('winston');
const path = require('path');

// 日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}] ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

// 创建日志实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // 错误日志
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 30
    }),
    // 组合日志
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 30
    })
  ]
});

// 开发环境输出到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      logFormat
    )
  }));
}

// 请求日志中间件
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const requestId = require('uuid').v4();
  req.requestId = requestId;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.userId || 'anonymous',
      statusCode: res.statusCode,
      duration: `${duration}ms`
    };

    if (res.statusCode >= 400) {
      logger.error('Request failed', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
};

module.exports = { logger, requestLogger };
```

### 4.5 错误处理中间件

```javascript
// src/middlewares/errorHandler.js
const { ApiError } = require('../utils/response');
const { logger } = require('./logger');
const { validationResult } = require('express-validator');

// 全局错误处理中间件
const errorHandler = (err, req, res, next) => {
  // 记录错误日志
  logger.error('Error occurred', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    error: err.message,
    stack: err.stack,
    userId: req.userId
  });

  // 处理ApiError
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      errorCode: err.errorCode,
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    });
  }

  // 处理参数校验错误
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      code: 400,
      message: errors.array()[0].msg,
      errorCode: 'VALIDATION_ERROR',
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    });
  }

  // 处理Sequelize错误
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      code: 400,
      message: err.errors[0].message,
      errorCode: 'DATABASE_VALIDATION_ERROR',
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      code: 409,
      message: '数据已存在',
      errorCode: 'DUPLICATE_ENTRY',
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    });
  }

  // 处理JWT错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      code: 401,
      message: '无效的登录凭证',
      errorCode: 'AUTH005',
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      code: 401,
      message: '登录已过期',
      errorCode: 'AUTH004',
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    });
  }

  // 默认服务器错误
  res.status(500).json({
    code: 500,
    message: process.env.NODE_ENV === 'production' 
      ? '服务器内部错误' 
      : err.message,
    errorCode: 'INTERNAL_ERROR',
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  });
};

// 404处理
const notFoundHandler = (req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    errorCode: 'NOT_FOUND',
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  });
};

module.exports = { errorHandler, notFoundHandler };
```

## 5 核心业务服务

### 5.1 预约服务

```javascript
// src/services/reservationService.js
const { Reservation, Seat, User, Area, Violation, Rule } = require('../models');
const { Op } = require('sequelize');
const { ApiError } = require('../utils/response');
const { generateCode } = require('../utils/codeGenerator');

class ReservationService {
  // 获取规则值
  async getRuleValue(key) {
    const rule = await Rule.findOne({ where: { ruleKey: key, isActive: true } });
    return rule ? rule.ruleValue : null;
  }

  // 检查用户是否被封禁
  async checkUserBanStatus(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ApiError(404, '用户不存在');
    }
    if (user.status === 'banned' && user.banUntil && user.banUntil > new Date()) {
      throw new ApiError(403, `账户已被封禁至 ${user.banUntil}`, 'AUTH002');
    }
    return user;
  }

  // 检查座位可用性
  async checkSeatAvailability(seatId, reserveDate, startTime, endTime, excludeId = null) {
    const seat = await Seat.findByPk(seatId, {
      include: [{ model: Area, as: 'area' }]
    });
    
    if (!seat) {
      throw new ApiError(404, '座位不存在', 'SEAT001');
    }

    if (seat.status !== 'available' && seat.status !== 'reserved') {
      throw new ApiError(422, '座位当前不可用', 'SEAT002');
    }

    // 检查区域开放时间
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const [openHour, openMin] = seat.area.openTime.split(':').map(Number);
    const [closeHour, closeMin] = seat.area.closeTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    if (startMinutes < openMinutes || endMinutes > closeMinutes) {
      throw new ApiError(422, '预约时间不在开放时间内', 'RES006');
    }

    // 检查时间冲突
    const whereClause = {
      seatId,
      reserveDate,
      status: {
        [Op.in]: ['pending', 'checked_in']
      },
      [Op.or]: [
        {
          startTime: { [Op.lt]: endTime },
          endTime: { [Op.gt]: startTime }
        }
      ]
    };

    if (excludeId) {
      whereClause.id = { [Op.ne]: excludeId };
    }

    const conflict = await Reservation.findOne({ where: whereClause });
    if (conflict) {
      throw new ApiError(422, '该时间段内座位已被预约', 'SEAT003');
    }

    return seat;
  }

  // 检查预约限制
  async checkReservationLimits(userId, reserveDate) {
    const maxPerDay = parseInt(await this.getRuleValue('max_reservations_per_day')) || 2;
    const maxPerWeek = parseInt(await this.getRuleValue('max_reservations_per_week')) || 10;

    // 每日限制
    const todayCount = await Reservation.count({
      where: {
        userId,
        reserveDate,
        status: { [Op.in]: ['pending', 'checked_in', 'completed'] }
      }
    });

    if (todayCount >= maxPerDay) {
      throw new ApiError(422, `您今日预约次数已达上限(${maxPerDay}次)`, 'RES004');
    }

    // 每周限制
    const weekStart = new Date(reserveDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekCount = await Reservation.count({
      where: {
        userId,
        reserveDate: { [Op.between]: [weekStart, weekEnd] },
        status: { [Op.in]: ['pending', 'checked_in', 'completed'] }
      }
    });

    if (weekCount >= maxPerWeek) {
      throw new ApiError(422, `您本周预约次数已达上限(${maxPerWeek}次)`, 'RES005');
    }
  }

  // 创建预约
  async createReservation(userId, data) {
    const { seatId, reserveDate, startTime, endTime } = data;

    // 校验用户状态
    await this.checkUserBanStatus(userId);

    // 校验座位可用性
    await this.checkSeatAvailability(seatId, reserveDate, startTime, endTime);

    // 校验预约限制
    await this.checkReservationLimits(userId, reserveDate);

    // 校验预约时长
    const minDuration = parseInt(await this.getRuleValue('min_reservation_duration')) || 60;
    const maxDuration = parseInt(await this.getRuleValue('max_reservation_duration')) || 480;

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const duration = (endH * 60 + endM) - (startH * 60 + startM);

    if (duration < minDuration) {
      throw new ApiError(422, `预约时长不能少于${minDuration}分钟`, 'RES007');
    }
    if (duration > maxDuration) {
      throw new ApiError(422, `预约时长不能超过${maxDuration}分钟`, 'RES007');
    }

    // 生成预约码
    const reservationCode = await generateCode('RES');

    // 创建预约
    const reservation = await Reservation.create({
      reservationCode,
      userId,
      seatId,
      areaId: (await Seat.findByPk(seatId)).areaId,
      reserveDate,
      startTime,
      endTime,
      status: 'pending'
    });

    // 更新座位状态
    await Seat.update({ status: 'reserved' }, { where: { id: seatId } });

    // 关联座位信息
    await reservation.reload({
      include: [
        { model: Seat, as: 'seat', attributes: ['seatCode'] },
        { model: Area, as: 'area', attributes: ['name'] }
      ]
    });

    return reservation;
  }

  // 签到
  async checkIn(reservationId, userId) {
    const reservation = await Reservation.findOne({
      where: { id: reservationId, userId },
      include: [{ model: Seat, as: 'seat' }]
    });

    if (!reservation) {
      throw new ApiError(404, '预约不存在', 'RES001');
    }

    if (reservation.status !== 'pending') {
      throw new ApiError(422, '当前状态不允许签到', 'RES002');
    }

    // 检查签到时限
    const deadlineMinutes = parseInt(await this.getRuleValue('checkin_deadline_minutes')) || 30;
    const reserveDateTime = new Date(`${reservation.reserveDate} ${reservation.startTime}`);
    const deadline = new Date(reserveDateTime.getTime() + deadlineMinutes * 60 * 100);
    const now = new Date();

    if (now > deadline) {
      throw new ApiError(422, '签到已超时', 'RES008');
    }

    // 提前签到检查(预约开始前30分钟内)
    const earlyLimit = 30;
    const earlyDeadline = new Date(reserveDateTime.getTime() - earlyLimit * 60 * 100);
    if (now < earlyDeadline) {
      throw new ApiError(422, `请在预约开始前${earlyLimit}分钟内签到`, 'RES009');
    }

    // 更新预约状态
    await reservation.update({
      status: 'checked_in',
      checkInTime: now
    });

    // 更新座位状态
    await Seat.update({ status: 'in_use' }, { where: { id: reservation.seatId } });

    // 计算剩余时间
    const remainingTime = Math.floor((reserveDateTime.getTime() - now.getTime()) / 600);

    return { reservation, remainingTime };
  }

  // 签退
  async checkOut(reservationId, userId, remark) {
    const reservation = await Reservation.findOne({
      where: { id: reservationId, userId }
    });

    if (!reservation) {
      throw new ApiError(404, '预约不存在', 'RES001');
    }

    if (reservation.status !== 'checked_in') {
      throw new ApiError(422, '当前状态不允许签退', 'RES002');
    }

    const now = new Date();

    await reservation.update({
      status: 'completed',
      checkOutTime: now
    });

    // 更新座位状态
    await Seat.update({ status: 'available' }, { where: { id: reservation.seatId } });

    return reservation;
  }

  // 取消预约
  async cancelReservation(reservationId, userId, reason) {
    const reservation = await Reservation.findOne({
      where: { id: reservationId, userId }
    });

    if (!reservation) {
      throw new ApiError(404, '预约不存在', 'RES001');
    }

    if (reservation.status !== 'pending') {
      throw new ApiError(422, '当前状态不允许取消', 'RES002');
    }

    // 检查取消时限
    const advanceHours = parseInt(await this.getRuleValue('advance_cancel_hours')) || 1;
    const reserveDateTime = new Date(`${reservation.reserveDate} ${reservation.startTime}`);
    const cancelDeadline = new Date(reserveDateTime.getTime() - advanceHours * 60 * 60 * 100);

    if (new Date() > cancelDeadline) {
      throw new ApiError(422, `预约开始前${advanceHours}小时内不允许取消`, 'RES011');
    }

    await reservation.update({
      status: 'cancelled',
      cancelReason: reason
    });

    // 更新座位状态
    await Seat.update({ status: 'available' }, { where: { id: reservation.seatId } });

    return reservation;
  }
}

module.exports = new ReservationService();
```

### 5.2 违约处理服务

```javascript
// src/services/violationService.js
const { Violation, Reservation, User, Seat } = require('../models');
const { Op } = require('sequelize');
const { ApiError } = require('../utils/response');

class ViolationService {
  // 创建违约记录
  async createViolation(reservationId, type, description = '') {
    const reservation = await Reservation.findByPk(reservationId, {
      include: [{ model: User, as: 'user' }]
    });

    if (!reservation) {
      throw new ApiError(404, '预约不存在');
    }

    // 创建违约记录
    const violation = await Violation.create({
      userId: reservation.userId,
      reservationId,
      type,
      description
    });

    // 更新用户违约次数
    await User.increment('violationCount', { where: { id: reservation.userId } });
    
    const user = await User.findByPk(reservation.userId);
    const newCount = user.violationCount + 1;

    // 更新违约等级
    let level = 0;
    if (newCount >= 5) level = 5;
    else if (newCount >= 3) level = 4;
    else if (newCount >= 2) level = 3;
    else if (newCount >= 1) level = 2;

    await User.update({ violationLevel: level }, { where: { id: reservation.userId } });

    // 检查是否需要封禁
    const violationThreshold = 3;
    if (newCount >= violationThreshold) {
      const banDays = newCount * 1; // 每次违约增加1天封禁
      const banUntil = new Date();
      banUntil.setDate(banUntil.getDate() + banDays);

      await User.update(
        { status: 'banned', banUntil },
        { where: { id: reservation.userId } }
      );
    }

    return violation;
  }

  // 处理申诉
  async handleAppeal(violationId, adminId, status, result) {
    const violation = await Violation.findByPk(violationId);

    if (!violation) {
      throw new ApiError(404, '违约记录不存在', 'VIO001');
    }

    if (violation.appealStatus !== 'pending') {
      throw new ApiError(422, '申诉已处理', 'VIO003');
    }

    await violation.update({
      appealStatus: status,
      appealResult: result,
      handledBy: adminId,
      handledAt: new Date()
    });

    // 如果申诉通过，撤销处罚
    if (status === 'approved') {
      // 减少用户违约次数
      await User.decrement('violationCount', { where: { id: violation.userId } });
      
      const user = await User.findByPk(violation.userId);
      if (user.violationCount < 3 && user.status === 'banned') {
        await User.update(
          { status: 'active', banUntil: null },
          { where: { id: violation.userId } }
        );
      }
    }

    return violation;
  }

  // 自动处理超时未签到
  async processExpiredCheckins() {
    const deadlineMinutes = 30;
    const now = new Date();
    const expiredTime = new Date(now.getTime() - deadlineMinutes * 60 * 100);

    const expiredReservations = await Reservation.findAll({
      where: {
        status: 'pending',
        reserveDate: now.toISOString().split('T')[0],
        startTime: { [Op.lt]: expiredTime.toTimeString().slice(0, 8) }
      }
    });

    for (const reservation of expiredReservations) {
      await reservation.update({ status: 'expired' });
      await this.createViolation(
        reservation.id,
        'no_checkin',
        '预约后未在规定时间内签到'
      );
      await Seat.update(
        { status: 'available' },
        { where: { id: reservation.seatId } }
      );
    }

    return expiredReservations.length;
  }
}

module.exports = new ViolationService();
```

### 5.3 统计服务

```javascript
// src/services/statsService.js
const { Reservation, Seat, Area, User, Violation } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const { ApiError } = require('../utils/response');

class StatsService {
  // 仪表盘概览
  async getDashboard() {
    const today = new Date().toISOString().split('T')[0];

    // 今日预约统计
    const todayStats = await Reservation.findAll({
      where: { reserveDate: today },
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status']
    });

    const todayOverview = {
      totalReservations: 0,
      checkedIn: 0,
      completed: 0,
      cancelled: 0,
      violated: 0
    };

    todayStats.forEach(stat => {
      const count = parseInt(stat.get('count'));
      todayOverview.totalReservations += count;
      if (stat.status === 'checked_in') todayOverview.checkedIn = count;
      if (stat.status === 'completed') todayOverview.completed = count;
      if (stat.status === 'cancelled') todayOverview.cancelled = count;
      if (stat.status === 'violated' || stat.status === 'expired') todayOverview.violated += count;
    });

    // 实时座位状态
    const seatStats = await Seat.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['status']
    });

    const realtimeStatus = { totalSeats: 0, available: 0, reserved: 0, inUse: 0 };
    seatStats.forEach(stat => {
      const count = parseInt(stat.get('count'));
      realtimeStatus.totalSeats += count;
      if (stat.status === 'available') realtimeStatus.available = count;
      if (stat.status === 'reserved') realtimeStatus.reserved = count;
      if (stat.status === 'in_use') realtimeStatus.inUse = count;
    });

    // 预约趋势(最近7天)
    const trendData = await Reservation.findAll({
      where: {
        reserveDate: {
          [Op.between]: [
            new Date(Date.now() - 7 * 24 * 60 * 60 * 100).toISOString().split('T')[0],
            today
          ]
        }
      },
      attributes: [
        'reserveDate',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['reserveDate'],
      order: [['reserveDate', 'ASC']]
    });

    // 区域使用率
    const areaUsage = await Seat.findAll({
      attributes: [
        'areaId',
        [fn('COUNT', col('id')), 'total'],
        [fn('SUM', literal("CASE WHEN status = 'in_use' THEN 1 ELSE 0 END")), 'inUse']
      ],
      group: ['areaId']
    });

    const topAreas = await Promise.all(areaUsage.map(async usage => {
      const area = await Area.findByPk(usage.areaId);
      const total = parseInt(usage.get('total'));
      const inUse = parseInt(usage.get('inUse') || 0);
      return {
        areaId: area.id,
        areaName: area.name,
        usageRate: total > 0 ? (inUse / total).toFixed(2) : 0
      };
    }));

    // 违约趋势
    const violationTrend = await Violation.findAll({
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 100)
        }
      },
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', col('id')), 'count']
      ],
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']]
    });

    return {
      todayOverview,
      realtimeStatus,
      trendData: trendData.map(t => ({
        date: t.reserveDate,
        count: parseInt(t.get('count'))
      })),
      topAreas: topAreas.sort((a, b) => b.usageRate - a.usageRate),
      violationTrend: violationTrend.map(v => ({
        date: v.get('date'),
        count: parseInt(v.get('count'))
      }))
    };
  }

  // 使用率统计
  async getUsageStats(type, startDate, endDate, areaId) {
    const dateRange = this.getDateRange(type, startDate, endDate);

    // 按区域统计
    const byArea = await Reservation.findAll({
      where: {
        reserveDate: { [Op.between]: [dateRange.start, dateRange.end] },
        status: { [Op.in]: ['completed', 'checked_in'] }
      },
      attributes: [
        'areaId',
        [fn('SUM', literal("TIMESTAMPDIFF(MINUTE, start_time, end_time)")), 'totalMinutes']
      ],
      group: ['areaId']
    });

    // 按小时统计
    const byHour = await Reservation.findAll({
      where: {
        reserveDate: { [Op.between]: [dateRange.start, dateRange.end] },
        status: { [Op.in]: ['completed', 'checked_in'] }
      },
      attributes: [
        [fn('HOUR', col('start_time')), 'hour'],
        [fn('COUNT', col('id')), 'count']
      ],
      group: [[fn('HOUR', col('start_time'))]]
    });

    // 按日期统计
    const byDate = await Reservation.findAll({
      where: {
        reserveDate: { [Op.between]: [dateRange.start, dateRange.end] }
      },
      attributes: [
        'reserveDate',
        [fn('COUNT', col('id')), 'total'],
        [fn('SUM', literal("CASE WHEN status IN ('completed', 'checked_in') THEN 1 ELSE 0 END")), 'used']
      ],
      group: ['reserveDate'],
      order: [['reserveDate', 'ASC']]
    });

    return {
      summary: {
        dateRange,
        totalReservations: byDate.reduce((sum, d) => sum + parseInt(d.get('total')), 0),
        totalUsage: byDate.reduce((sum, d) => sum + parseInt(d.get('used') || 0), 0)
      },
      byArea: byArea.map(a => ({
        areaId: a.areaId,
        totalMinutes: parseInt(a.get('totalMinutes') || 0)
      })),
      byHour: byHour.map(h => ({
        hour: parseInt(h.get('hour')),
        count: parseInt(h.get('count'))
      })),
      byDate: byDate.map(d => ({
        date: d.reserveDate,
        total: parseInt(d.get('total')),
        used: parseInt(d.get('used') || 0),
        usageRate: parseInt(d.get('total')) > 0 
          ? (parseInt(d.get('used') || 0) / parseInt(d.get('total'))).toFixed(2)
          : 0
      }))
    };
  }

  // 违约分析
  async getViolationStats(type, startDate, endDate) {
    const dateRange = this.getDateRange(type, startDate, endDate);

    const byType = await Violation.findAll({
      where: {
        createdAt: { [Op.between]: [dateRange.start, dateRange.end] }
      },
      attributes: [
        'type',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['type']
    });

    const totalViolations = byType.reduce((sum, v) => sum + parseInt(v.get('count')), 0);

    const topUsers = await Violation.findAll({
      where: {
        createdAt: { [Op.between]: [dateRange.start, dateRange.end] }
      },
      attributes: [
        'userId',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['userId'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      limit: 10,
      include: [{ model: User, as: 'user', attributes: ['username', 'realName'] }]
    });

    return {
      summary: {
        totalViolations,
        violationRate: totalViolations > 0 ? (totalViolations / 100).toFixed(3) : 0,
        topType: byType.length > 0 ? byType[0].type : null
      },
      byType: byType.map(v => ({
        type: v.type,
        count: parseInt(v.get('count')),
        percentage: totalViolations > 0 ? (parseInt(v.get('count')) / totalViolations).toFixed(2) : 0
      })),
      topUsers: topUsers.map(u => ({
        userId: u.userId,
        username: u.user?.username,
        realName: u.user?.realName,
        violationCount: parseInt(u.get('count'))
      }))
    };
  }

  getDateRange(type, startDate, endDate) {
    const end = endDate ? new Date(endDate) : new Date();
    let start;

    switch (type) {
      case 'daily':
        start = new Date(end);
        break;
      case 'weekly':
        start = new Date(end);
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
        start = new Date(end);
        start.setMonth(start.getMonth() - 1);
        break;
      default:
        start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 100);
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }
}

module.exports = new StatsService();
```

## 6 定时任务

### 6.1 自动违约处理

```javascript
// src/jobs/autoViolation.js
const { Reservation, Seat, Violation, User } = require('../models');
const { Op } = require('sequelize');
const { logger } = require('../middlewares/logger');

class AutoViolationJob {
  async run() {
    logger.info('开始执行自动违约处理任务');

    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 8);

      // 查找超时未签到的预约(预约开始30分钟后)
      const deadlineMinutes = 30;
      const deadlineTime = new Date(now.getTime() - deadlineMinutes * 60 * 100)
        .toTimeString().slice(0, 8);

      const expiredReservations = await Reservation.findAll({
        where: {
          status: 'pending',
          reserveDate: today,
          startTime: { [Op.lt]: deadlineTime }
        }
      });

      logger.info(`发现${expiredReservations.length}条超时未签到的预约`);

      for (const reservation of expiredReservations) {
        // 更新预约状态
        await reservation.update({ status: 'expired' });

        // 创建违约记录
        await Violation.create({
          userId: reservation.userId,
          reservationId: reservation.id,
          type: 'no_checkin',
          description: '预约后未在规定时间内签到'
        });

        // 更新用户违约次数
        const user = await User.findByPk(reservation.userId);
        await user.increment('violationCount');

        // 更新违约等级
        const newCount = user.violationCount + 1;
        let level = 0;
        if (newCount >= 5) level = 5;
        else if (newCount >= 3) level = 4;
        else if (newCount >= 2) level = 3;
        else if (newCount >= 1) level = 2;

        await user.update({ violationLevel: level });

        // 检查是否需要封禁
        if (newCount >= 3) {
          const banDays = newCount;
          const banUntil = new Date();
          banUntil.setDate(banUntil.getDate() + banDays);

          await user.update({
            status: 'banned',
            banUntil
          });

          logger.info(`用户${user.username}因多次违约被封禁至${banUntil}`);
        }

        // 释放座位
        await Seat.update(
          { status: 'available' },
          { where: { id: reservation.seatId } }
        );
      }

      logger.info('自动违约处理任务完成');
      return expiredReservations.length;
    } catch (error) {
      logger.error('自动违约处理任务失败', { error: error.message });
      throw error;
    }
  }
}

module.exports = new AutoViolationJob();
```

### 6.2 定时任务配置

```javascript
// src/jobs/scheduler.js
const cron = require('node-cron');
const autoViolationJob = require('./autoViolation');
const { logger } = require('../middlewares/logger');

class JobScheduler {
  start() {
    // 每5分钟检查超时预约
    cron.schedule('*/5 *', async () => {
      try {
        await autoViolationJob.run();
      } catch (error) {
        logger.error('定时任务执行失败', { error: error.message });
      }
    });

    // 每天凌晨清理过期数据
    cron.schedule('0 2 *', async () => {
      logger.info('执行每日数据清理任务');
      // 清理30天前的历史数据
    });

    logger.info('定时任务调度器已启动');
  }
}

module.exports = new JobScheduler();
```

## 7 部署说明

### 7.1 部署环境要求

| 项目 | 要求 |
|-----|------|
| 操作系统 | Ubuntu 20.04+ / CentOS 7+ |
| Node.js | 18.x 或更高版本 |
| MySQL | 8.0 或更高版本 |
| Redis | 6.x 或更高版本 |
| Nginx | 1.18+ |
| 内存 | 最少 2GB |
| 磁盘 | 最少 20GB |

### 7.2 环境变量配置

```bash

NODE_ENV=production
PORT=300

DB_HOST=localhost
DB_PORT=3306
DB_NAME=library_seat
DB_USER=library_user
DB_PASSWORD=your_secure_password

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

JWT_SECRET=your_jwt_secret_key_min_32_chars
JWT_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=7d

LOG_LEVEL=info

UPLOAD_MAX_SIZE=10mb
```

### 7.3 数据库初始化

```javascript
// scripts/initDb.js
const { sequelize } = require('../src/models');
const { logger } = require('../src/middlewares/logger');

async function initDatabase() {
  try {
    // 创建数据库
    await sequelize.query(`CREATE DATABASE IF NOT EXISTS library_seat 
      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    logger.info('数据库创建成功');

    // 同步模型
    await sequelize.sync({ alter: true });
    logger.info('数据表同步完成');

    // 初始化规则配置
    const { Rule } = require('../src/models');
    const defaultRules = [
      { ruleKey: 'max_reservations_per_day', ruleName: '每日最大预约数', ruleValue: '2', ruleType: 'limit', description: '限制用户每天最多预约次数' },
      { ruleKey: 'max_reservations_per_week', ruleName: '每周最大预约数', ruleValue: '10', ruleType: 'limit', description: '限制用户每周最多预约次数' },
      { ruleKey: 'checkin_deadline_minutes', ruleName: '签到时限', ruleValue: '30', ruleType: 'time', description: '预约后签到时限(分钟)' },
      { ruleKey: 'violation_threshold', ruleName: '违约阈值', ruleValue: '3', ruleType: 'penalty', description: '触发封禁的违约次数' },
      { ruleKey: 'ban_days_per_violation', ruleName: '封禁天数', ruleValue: '1', ruleType: 'penalty', description: '每次违约封禁天数' },
      { ruleKey: 'reservation_ahead_hours', ruleName: '提前预约时限', ruleValue: '24', ruleType: 'time', description: '最多提前预约小时数' },
      { ruleKey: 'min_reservation_duration', ruleName: '最小预约时长', ruleValue: '60', ruleType: 'time', description: '最小预约时长(分钟)' },
      { ruleKey: 'max_reservation_duration', ruleName: '最大预约时长', ruleValue: '480', ruleType: 'time', description: '最大预约时长(分钟)' }
    ];

    for (const rule of defaultRules) {
      await Rule.findOrCreate({ where: { ruleKey: rule.ruleKey }, defaults: rule });
    }

    logger.info('默认规则初始化完成');
    logger.info('数据库初始化完成');

    process.exit(0);
  } catch (error) {
    logger.error('数据库初始化失败', { error: error.message });
    process.exit(1);
  }
}

initDatabase();
```

### 7.4 Nginx配置

```nginx

upstream backend {
    server 127.0.0.1:300;
    keepalive 64;
}

server {
    listen 80;
    server_name your-domain.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL证书配置
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 前端静态文件
    root /var/www/library-seat/dist;
    index.html;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

    # API请求代理
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 日志配置
    access_log /var/log/nginx/library-seat-access.log;
    error_log /var/log/nginx/library-seat-error.log;
}
```

### 7.5 PM2进程管理配置

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'library-seat-backend',
    script: 'src/app.js',
    instances: 2,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 300
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

### 7.6 部署步骤

```bash

curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

sudo apt-get install -y mysql-server
sudo mysql_secure_installation

sudo apt-get install -y redis-server

sudo apt-get install -y nginx

sudo mkdir -p /var/www/library-seat
cd /var/www/library-seat

git clone https://github.com/your-repo/library-seat.git .

npm install --production

cp .env.example .env
vim .env  # 编辑配置文件

node scripts/initDb.js

npm install -g pm2

pm2 start ecosystem.config.js
pm2 save
pm2 startup

sudo cp nginx/library-seat.conf /etc/nginx/conf.d/
sudo nginx -t
sudo systemctl restart nginx

sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 7.7 运维命令

```bash

pm2 status
pm2 list

pm2 logs library-seat-backend
pm2 logs library-seat-backend --lines 100

pm2 restart library-seat-backend

pm2 reload library-seat-backend

pm2 stop library-seat-backend

pm2 delete library-seat-backend

pm2 monit

mysql -u library_user -p -e "SHOW PROCESSLIST;"

redis-cli ping
redis-cli info
```

### 7.8 备份策略

```bash
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/var/backups/library-seat
DB_NAME=library_seat
DB_USER=library_user
DB_PASSWORD="your_password"

mkdir -p $BACKUP_DIR

mysqldump -u$DB_USER -p$DB_PASSWORD --single-transaction \
  --routines --triggers --events $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete

## 8 安全建议

### 8.1 认证安全

- JWT密钥长度不少于32字符
- 生产环境启用HTTPS
- 定期轮换JWT密钥
- 敏感操作要求二次验证

### 8.2 数据安全

- 密码使用bcrypt加密存储
- SQL查询使用参数化防止注入
- 敏感数据脱敏处理
- 定期备份数据库

### 8.3 接口安全

- 请求频率限制(防刷)
- 输入参数严格校验
- 防止CSRF攻击
- 防止XSS攻击

### 8.4 日志审计

- 记录所有管理操作
- 记录登录失败事件
- 定期审查日志
- 异常行为告警