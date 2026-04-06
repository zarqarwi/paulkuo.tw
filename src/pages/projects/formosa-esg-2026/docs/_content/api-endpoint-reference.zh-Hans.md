# Formosa ESG 2026 Worker API — 端点参考

**版本:** v1.0  
**日期:** 2026-04-04  
**语言:** 简体中文  
**受众:** 开发人员、质量保证测试人员、集成合作伙伴  

---

## 目录

1. [基础 URL 和访问](#基础-url-和访问)
2. [公开端点](#公开端点)
3. [管理员端点](#管理员端点)
4. [定时任务](#定时任务)
5. [全局端点](#全局端点)
6. [身份验证](#身份验证)
7. [速率限制](#速率限制)
8. [响应格式](#响应格式)
9. [常数参考](#常数参考)
10. [等级系统](#等级系统)
11. [碳系数](#碳系数)
12. [三层权限授权](#三层权限授权)

## 基础 URL 和访问

### 生产环境
- **主要:** `https://api.paulkuo.tw`
- **备选:** `https://mazu.today` (反向代理)

所有 API 请求必须使用 HTTPS。对 HTTP 端点的请求将失败。

## 公开端点

这些端点不需要身份验证。

| 方法 | 路径 | 处理程序 | 目的 |
|--------|------|---------|---------|
| POST | `/api/formosa/webhook` | handleFormosaWebhook | LINE 机器人 webhook (关注、取消关注、消息、回调) |
| POST | `/api/formosa/submit` | handleFormosaSubmit | 提交问卷回复 (Q1–Q10) |
| POST | `/api/formosa/checkin` | handleFormosaCheckin | GPS 打卡，带 KV 缓冲区 |
| POST | `/api/formosa/track/sync` | handleFormosaTrackSync | 批量 GPS 轨迹同步 |
| POST | `/api/formosa/user/sync` | handleFormosaUserSync | 同步用户资料数据 |
| GET | `/api/formosa/photos/count` | handleFormosaPhotoCount | 获取每个用户的照片数量 |
| POST | `/api/formosa/user/phone` | handleFormosaPhoneUpdate | 更新用户电话号码 |
| POST | `/api/formosa/og-image` | handleFormosaOgImage | 生成 OG 分享卡片图像 |
| GET | `/api/formosa/og/{userId}.png` | handleFormosaOgServe | 提供缓存的 OG 图像 |
| GET | `/api/formosa/data` | handleFormosaData | 获取仪表板的最新 GPS 点 |
| GET | `/api/formosa/user/{userId}` | handleFormosaUser | 获取用户资料和活动统计 |
| POST | `/api/formosa/privacy` | handleFormosaPrivacyAgree | 记录隐私同意 |
| POST | `/api/formosa/participant-status` | handleFormosaParticipantStatus | 更新参与者状态 (活跃/完成/退出) |
| POST | `/api/formosa/feedback` | handleFormosaFeedback | 提交用户反馈 |
| GET | `/api/formosa/feedback` | handleFormosaFeedbackList | 列出反馈条目 (管理员上下文) |
| POST | `/api/formosa/feedback-upload` | handleFormosaFeedbackUpload | 上传反馈截图 |
| GET | `/api/formosa/feedback/status` | handleFormosaFeedbackPublicStatus | 获取公开反馈状态 |
| PATCH | `/api/formosa/feedback/{id}` | handleFormosaFeedbackUpdate | 更新反馈项目 |
| GET | `/api/formosa/feedback-image/{filename}.png` | handleFormosaFeedbackImageServe | 提供反馈截图图像 |

### 有效负载限制
所有 POST `/api/formosa/*` 请求接受最大内容长度 **102,400 字节 (100 KB)**。超过此限制的请求返回 **HTTP 413 Payload Too Large**。

## 管理员端点

需要带有有效的管理员、经理或所有者令牌的 `X-Admin-Token` 标头。

| 方法 | 路径 | 处理程序 | 目的 |
|--------|------|---------|---------|
| GET | `/api/formosa/auth/role` | handleFormosaAuthRole | 检查调用者的授权角色 |
| GET | `/api/formosa/admin/surveys` | handleFormosaAdminSurveys | 列出所有问卷回复 |
| GET | `/api/formosa/admin/carbon` | handleFormosaAdminCarbon | 获取碳足迹汇总 |
| GET | `/api/formosa/admin/timeline` | handleFormosaAdminTimeline | 获取事件时间线 |
| GET | `/api/formosa/admin/users` | handleFormosaAdminUsers | 获取所有用户及统计信息 |
| GET | `/api/formosa/admin/clusters` | handleFormosaAdminClusters | 服务器端网格聚类数据 |
| GET | `/api/formosa/admin/status` | handleFormosaAdminStatus | 获取活动状态 |
| PUT | `/api/formosa/admin/status` | handleFormosaAdminStatus | 设置活动状态 |
| GET | `/api/formosa/admin/roles` | handleFormosaAdminRoles | 获取所有角色分配 |
| POST | `/api/formosa/admin/roles` | handleFormosaAdminRoles | 分配或更新用户角色 |
| POST | `/api/formosa/admin/richmenu` | handleFormosaRichMenu | 部署 LINE 富菜单 |
| POST | `/api/formosa/push` | handleFormosaPush | 发送 LINE 推送通知 |
| POST | `/api/formosa/admin/end-activity` | handleFormosaAdminEndActivity | 终止活动会话 |
| GET | `/api/formosa/line-usage` | handleFormosaLineUsage | 获取 LINE 消息配额使用情况 |

## 定时任务

内部计划任务 (无 HTTP 端点公开)。

| 计划 | 处理程序 | 目的 | 源 |
|----------|---------|---------|--------|
| 每 5 分钟 (`*/5 * * * *`) | handleFormosaFlushBuffer | 批量刷新 KV 缓冲区 → D1 数据库 | formosa.js:528 |
| 每小时 | handleFormosaScheduledPush | 分配计划的 LINE 通知 | formosa.js |

## 全局端点

### 系统健康检查
```
GET /health
```
返回系统健康状态，包括 Formosa 子系统详情: D1 数据库状态、KV 存储状态、待处理 KV 密钥数、最后一次刷新时间戳。

## 身份验证

### 标头格式
```
X-Admin-Token: <token_value>
```
所有管理员端点都需要此标头。没有有效身份验证的请求返回 **HTTP 401 Unauthorized**。

### 令牌类型
支持三个授权层:

| 层级 | 环境变量 | ROLE_LEVEL | 权限 |
|------|----------------------|-----------|------------|
| Owner | `FORMOSA_ADMIN_TOKEN` | 3 | 所有管理员操作 + 设置管理 |
| Manager | `FORMOSA_MANAGER_TOKEN` | 2 | 管理员读取 + 反馈/推送操作 |
| Volunteer | `FORMOSA_VOLUNTEER_TOKEN` | 1 | 有限的只读访问 |

## 速率限制

| 端点 | 限制 | 时间窗口 | 状态代码 |
|----------|-------|--------|------------|
| `/api/formosa/checkin` | 5 个请求 | 60 秒 | 超过限制时返回 429 |
| `/api/formosa/submit` | 2 个请求 | 600 秒 | 超过限制时返回 429 |
| `/api/formosa/track/sync` | 10 个请求 | 60 秒 | 超过限制时返回 429 |
| 管理员端点 | 30 个请求 | 60 秒 | 超过限制时返回 429 |

## 响应格式

### 成功响应
```json
{ "ok": true, "data": { } }
```

### 错误响应
```json
{ "error": "可读的错误消息" }
```

HTTP 状态代码: 200、202、204、400、401、413、429

### 异步操作
打卡请求返回 HTTP 202 Accepted，具有 8 秒超时，用于通过 ctx.waitUntil() 进行异步 KV 写入。

## 常数参考

### KV 存储 TTL

| 常数 | 值 | 持续时间 | 行 | 目的 |
|----------|-------|----------|------|---------|
| GPS 缓冲区数据 | 259200 | 3 天 | L402, L416, L497, L584 | 在批量刷新前存储原始 GPS 点 |
| GPS 计数缓存 | 2592000 | 30 天 | L424, L505, L604 | 缓存每个用户的照片数量 |
| 刷新锁 | 90 | 1.5 分钟 | L528 | 防止并发缓冲区刷新操作 |
| 最后刷新时间戳 | 86400 | 1 天 | L611 | 跟踪对 D1 的最后一次成功刷新 |
| 统计缓存 | 60 | 1 分钟 | L838 | 缓存用户统计信息 |
| 去重密钥 | 60 | 1 分钟 | L427 | 防止重复的 GPS 提交 |

### 基于速度的运输模式推理

| 条件 | 分类 | GWP 系数 | 目的 |
|-----------|---------------|-----------|---------|
| ≤ 15 km/h | 零排放 | 0 kg CO₂e/km | 步行、骑自行车、静止 |
| > 15 km/h | 机动 | 0.47515 kg CO₂e/km | 公交车系数 (默认) |

## 等级系统

| 等级 | 名称 | 最小公里 | 最少打卡次数 | 图标 |
|-------|------|--------|--------------|------|
| 1 | 炼气香客 | 0 | 1 | 🔥 |
| 2 | 筑基香客 | 15 | 5 | 🧱 |
| 3 | 金丹香客 | 45 | 10 | 💛 |
| 4 | 元婴香客 | 90 | 15 | 👶 |
| 5 | 化神香客 | 135 | 20 | ✨ |
| 6 | 炼虚香客 | 180 | 25 | 🌀 |
| 7 | 合体香客 | 225 | 30 | 🤝 |
| 8 | 大乘香客 | 270 | 35 | 🏆 |
| 9 | 飞升香客 | 300 | 40 | 🚀 |

### 成就卡解锁条件
必须同时满足所有三个条件：
1. 打卡次数 ≥ 3
2. 问卷完成 = 1
3. 电话号码 不为 NULL

## 碳系数

| 模式 | 系数 | 单位 | 备注 |
|------|------------|------|-------|
| walk | 0 | kg CO₂e/km | 基线，零排放 |
| car | 0.30479 | kg CO₂e/km | Ecoinvent 3.10 生命周期评估数据库 |
| scooter | 0.13734 | kg CO₂e/km | 电动滑板车/个人移动设备 |
| bike | 0.01220 | kg CO₂e/km | 脚踏或电动自行车 |
| bus | 0.47515 | kg CO₂e/km | 公共交通 (主要默认) |
| mrt | 0.07575 | kg CO₂e/km | 城市轨道交通 |
| train | 0.07575 | kg CO₂e/km | 常规铁路 |
| hsr | 0.07487 | kg CO₂e/km | 高速铁路 |
| water | 0.10974 | kg CO₂e/bottle | 每 500ml 水瓶 |
| recycle | -0.00265 | kg CO₂e/bottle | 回收信用 |
| hotel | 8.85 | kg CO₂e/night | 每晚住宿 |

## 三层权限授权

| 角色 | 级别 | 令牌环境变量 | 可读管理员数据 | 可修改数据 | 可推送通知 | 可结束活动 |
|------|-------|---------------|-------------------|-----------------|----------------------|------------------|
| Owner | 3 | FORMOSA_ADMIN_TOKEN | ✓ | ✓ | ✓ | ✓ |
| Manager | 2 | FORMOSA_MANAGER_TOKEN | ✓ | ✓ (反馈) | ✓ | ✓ |
| Volunteer | 1 | FORMOSA_VOLUNTEER_TOKEN | ✓ (有限) | — | — | — |

---

**最后更新:** 2026-04-04，由 Formosa 工程团队
