# 智护牙境 (Dental Smart Platform)

![DentalSmartPlatform](https://img.shields.io/badge/DentalSmartPlatform-Platform-blue)
![version](https://img.shields.io/badge/version-1.0.0-green)
![node](https://img.shields.io/badge/node->=18.0.0-brightgreen)
![license](https://img.shields.io/badge/license-MIT-blue)
![status](https://img.shields.io/badge/status-Production%20Ready-success)

### 口腔智能感控与设备运维管控中心

[在线演示](#快速体验) · [功能特性](#功能特性) · [演示账号](#演示账号---开箱即用) · [技术栈](#技术栈) · [快速开始](#快速开始) · [项目结构](#项目结构) · [部署说明](#部署说明)

---

## 快速体验

### 已成功部署到 Vercel

访问地址：https://dental-smart-platform.vercel.app

---

## 演示账号 - 开箱即用

无需注册，使用以下账号即可体验全平台完整功能：

| 账号类型 | 用户名 / 账号 | 密码 | 权限与适合演示 |
| :--- | :--- | :--- | :--- |
| 超级管理员 | `admin` | `admin123` | **最高权限**：拥有平台全量管理配置权限、RBAC 角色分配、用户管理、登录与操作日志审计全控制 |
| 系统管理员 | `sysytem_admin` | `sysytem_admin123` | **系统运维**：负责机构资产配置、日常用户管理（不可更改超级管理员）、全量系统日志审计 |
| 维修人员 | `demo_operator` | `demo_operator123` | **一线运维**：设备监控、实时遥测、告警处置、合规报表（系统管理与配置模块菜单及路由强制隔离） |

> 推荐演示路线：维修人员（设备运维 / 告警处置） -> 系统管理员（机构资产配置） -> 超级管理员（全量系统管控与日志审计）

---

## 项目简介

**智护牙境 (Dental Smart Platform)** 是一个面向口腔诊所水路与气路智能化感控的设备运维与数据感知平台，基于 **Vue 3 + TypeScript + Pinia + Element Plus + Node.js/Express** 构建。通过实时遥测与数据流、AI 预测性维保诊断、晶莹毛玻璃双主题感知界面与严格的 RBAC 三级权限隔离，为口腔医疗机构提供生产级别的智能感控与运维解决方案。

---

## 功能特性

- **水源/气源感控双处理系统**：实时掌控牙椅水路与手术室气源设备的运行模式（正常/深度消毒/节能模式）、消毒状态与耗材健康度。
- **实时遥测与数据流**：秒级感知水质 TDS、UV 杀菌辐射强度、气压与露点温度等核心遥测数据。
- **AI 预测性维保与告警管理**：自动计算滤芯与配件衰减趋势，提供故障预警并支持跨账号/跨会话持久化处置与工单联动。
- **三级 RBAC 权限隔离与安全**：
  - **超级管理员**：掌控全量功能与最高管理控制。
  - **系统管理员**：管理机构资产与普通运维账号。
  - **维修人员**：专注于设备与告警运维，系统管理与敏感配置模块进行菜单隐去与路由 Guard 硬隔离。
- **全量日志审计与持久化**：登录日志与操作日志全量实时记录与持久化存储，重构并去除了所有写死假数据，保证跨会话与刷新后数据完全一致。
- **高颜值晶莹毛玻璃双主题**：支持深色科技模式与优雅浅色明亮模式，切换平滑，并针对首屏加载与路由过渡提供了自动匹配系统色调的晶莹毛玻璃加载屏。

---

## 技术栈

### 前端 (Frontend)
- **核心框架**：Vue 3 (Composition API, `<script setup>`)
- **构建工具**：Vite 5
- **开发语言**：TypeScript
- **状态管理**：Pinia
- **路由管理**：Vue Router 4 (含权限拦截 Guard)
- **UI 组件库**：Element Plus + Element Plus Icons
- **图表展示**：ECharts
- **网络请求**：Axios

### 后端 (Backend)
- **核心框架**：Node.js + Express
- **开发语言**：TypeScript
- **工具与服务**：Nodemailer, CORS, WebSocket (全双工遥测推送)

---

## 快速开始

### 环境依赖
- Node.js >= 18.0.0
- npm >= 9.0.0

### 本地启动前端

1. 进入前端目录并安装依赖：
   ```bash
   cd frontend
   npm install
   ```

2. 启动前端开发服务器：
   ```bash
   npm run dev
   ```

3. 访问本地地址：`http://localhost:5173`

### 本地启动后端 (可选)

1. 进入后端目录并安装依赖：
   ```bash
   cd backend
   npm install
   ```

2. 启动后端开发服务器：
   ```bash
   npm run dev
   ```

---

## 项目结构

```
Dental_Smart_Platform/
├── frontend/                     # 前端工程
│   ├── src/
│   │   ├── assets/               # 静态资源与全局样式 (main.css)
│   │   ├── composables/          # 组合式函数 (usePageLoading.ts)
│   │   ├── router/               # 路由配置与 RBAC 权限拦截 (index.ts)
│   │   ├── stores/               # Pinia 状态管理 (userStore.ts, deviceStore.ts)
│   │   ├── views/                # 视图组件 (Dashboard, WaterDevice, Alarm, UserManagement 等)
│   │   ├── App.vue               # 根组件 (含响应式侧边栏与晶莹毛玻璃加载屏)
│   │   └── main.ts               # 应用入口
│   ├── index.html                # 入口 HTML (含首屏主题自动检测与关键 CSS)
│   └── package.json
├── backend/                      # 后端 API 工程
│   ├── src/
│   │   ├── routes/               # API 路由 (auth.ts, routes.ts)
│   │   └── server.ts             # 服务端入口
│   └── package.json
└── README.md                     # 项目说明文档
```

---

## 部署说明

项目已配置为适合 Vercel 一键零配置部署：
- 前端静态 Bundle 通过 Vite 编译优化构建。
- 包含了对前端持久化存储 (LocalStorage) 的全量容忍与降级方案，无需配置数据库即可开箱体验全量功能。

---

## 开源协议

[MIT License](LICENSE) © 2026 Dental Smart Platform Team
