# 图书馆座位预约系统 AI编码规则文档

## 最高优先规则

1. 在开始任何编码、拆任务、写实现或调用外部 AI 工具之前，必须先审核全部 7 份项目文档：PRD.md、Frontend.md、Backend.md、API.md、task.md、context_state.md、AGENTS.md。
2. 只要任意文档中存在“审核修订记录”或“审核修订”内容，必须先依据这些修订记录重新编排、整合并规划相关文档内容，确保文档结构、术语、接口、任务顺序和执行约束已经吸收修订结果。
3. 完成上述整理前，不得直接进入编码阶段，也不得忽略修订记录继续实现。
4. 当用户在 AI 编程工具中输入“了解项目规则，查看 AGENTS.md 文档”时，必须立即先执行本规则，再开始后续编码引导。

## CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

Tradeoff: These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.
- Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

Touch only what you must. Clean up only your own mess.

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

- "Add validation" -> "Write tests for invalid inputs, then make them pass"
- "Fix the bug" -> "Write a test that reproduces it, then make it pass"
- "Refactor X" -> "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

1. [Step] -> verify: [check]
2. [Step] -> verify: [check]
3. [Step] -> verify: [check]

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

These guidelines are working if: fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## 1 最高优先规则


我需要建立严格的编码规范和优先级体系。首先检查所有文档中的审核修订记录，确保没有遗漏任何重要的更新。文档内容需要按照标准格式组织，包括项目概述、技术栈选择、项目结构设计、API接口定义、任务执行顺序以及开发规范。特别要确保ContextState更新机制清晰明了，便于后续的状态管理和追踪。

## 2 项目概述
从PRD文档中提取项目的核心背景、目标定位和价值主张。

## 3 技术栈
整合前端和后端的技术选型清单。

## 4 项目结构
描述项目的目录组织架构。

## 5 API契约摘要
总结API文档中的关键接口定义。

## 6 任务执行指南
从task文档中提取任务执行顺序和依赖关系。

## 7 开发规则
包括代码规范、安全要求和测试要求。

## 8 ContextState更新规则
明确状态更新的具体流程和规则。

## 9 文档引用
列出所有相关的参考文档。

现在开始编写完整的AGENTS.md文档。

## 变更记录

- [2024-01-15 14:30] 完成 T-01: 项目初始化与环境配置
  - 已完成前后端项目初始化和依赖安装
  - 目录结构符合技术文档规范
  - 开发服务器可正常启动
  - 下一步执行 T-02: 数据库设计与实现

- [2024-01-15 16:45] 完成 T-02: 数据库设计与实现
  - 已创建6张核心数据表
  - Sequelize模型关联配置完成
  - 测试数据初始化脚本可执行
  - 下一步执行 T-03: 后端基础框架搭建

- [2024-01-16 10:20] 遇到问题 T-03
  - 问题描述：JWT中间件token解析失败
  - 原因分析：请求头格式不正确
  - 解决方案：统一使用Bearer Token格式
```

### 8.4 状态定义

**PENDING**：任务尚未开始执行，处于待启动状态。

**IN_PROGRESS**：任务正在执行中，尚未完成。

**COMPLETED**：任务已完成并通过验收标准。

**BLOCKED**：任务因前置依赖未完成或遇到阻塞问题而无法继续。

---

## 10 执行流程

### 10.1 启动阶段

首先执行“最高优先规则”，审核全部7份文档中的审核修订记录并先完成文档重整。然后阅读PRD.md了解项目需求和业务背景，阅读Frontend.md和Backend.md了解技术方案和架构设计，阅读API.md了解接口契约和响应格式，阅读task.md了解任务清单和验收标准，阅读context_state.md了解当前进度和下一步行动。

### 10.2 开发阶段

按照任务清单顺序执行开发任务。第一阶段基础设施任务按T-01至T-04顺序执行，第二阶段核心功能任务按T-05至T-08顺序执行，第三阶段高级功能任务按T-09至T-10顺序执行。每个任务完成后立即更新context_state.md文件，记录完成状态和下一步行动。

### 10.3 收尾阶段

所有任务完成后进行整体验收，确认界面清晰、数据完整、流程闭环、统计图表正常输出。更新context_state.md标记项目完成，整理项目文档和代码注释，准备项目交付物。

---

## 11 附录

### 11.1 环境变量配置

**后端环境变量**（.env文件）：

```env
NODE_ENV=development
PORT=300
DB_HOST=localhost
DB_PORT=3306
DB_NAME=library_seat
DB_USER=root
DB_PASSWORD=your_password
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_jwt_secret_key_at_least_256_bits
JWT_EXPIRES_IN=7d
```

**前端环境变量**（.env文件）：

```env
VITE_API_BASE_URL=https://rn6qg920-3001.jpe1.devtunnels.ms/api/v1
VITE_APP_TITLE=图书馆座位预约系统
```

### 11.2 数据库表结构速查

| 表名 | 说明 | 主要字段 |
|-----|------|---------|
| users | 用户表 | id, username, password, real_name, phone, email, role, status, violation_count |
| areas | 区域表 | id, name, floor, open_time, close_time, status |
| seats | 座位表 | id, seat_no, area_id, floor, status, has_power, has_window, description |
| reservations | 预约表 | id, user_id, seat_id, date, start_time, end_time, status, checkin_time, code |
| violations | 违约记录表 | id, user_id, reservation_id, type, description, created_at |
| rules | 规则配置表 | id, rule_key, rule_value, description, updated_at |
| system_logs | 系统日志表 | id, user_id, action, detail, ip, created_at |

### 11.3 预约状态流转

```
空闲(available) ─预约──> 已预约(reserved) ─签到──> 使用中(in_use) ─释放──> 空闲(available)
                              │
                              └──超时未签到──> 已违约(violated) ─处理──> 空闲(available)
                                  
空闲(available) ─预约──> 已预约(reserved) ─取消──> 已取消(cancelled) ─清理──> 空闲(available)
```

### 11.4 角色权限矩阵

| 功能 | 学生(student) | 管理员(admin) | 超级管理员(super_admin) |
|-----|--------------|--------------|--------------------|
| 用户注册/登录 | ✓ | ✓ | ✓ |
| 座位查询/预约 | ✓ | ✓ | ✓ |
| 签到/释放座位 | ✓ | ✓ | ✓ |
| 查看个人预约 | ✓ | ✓ | ✓ |
| 查看违约记录 | ✓ | ✓ | ✓ |
| 座位管理(增删改) | ✗ | ✓ | ✓ |
| 区域管理 | ✗ | ✓ | ✓ |
| 规则配置 | ✗ | ✓ | ✓ |
| 查看统计数据 | ✗ | ✓ | ✓ |
| 用户管理 | ✗ | ✗ | ✓ |
| 系统配置 | ✗ | ✗ | ✓ |

---

**文档版本**：v1.0

**最后更新**：2024年1月

**维护责任**：项目技术团队