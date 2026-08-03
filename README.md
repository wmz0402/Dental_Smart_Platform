# 智护牙境 (Dental Smart Platform)

![DentalSmartPlatform](https://img.shields.io/badge/DentalSmartPlatform-Platform-blue)
![version](https://img.shields.io/badge/version-1.0.0-green)
![node](https://img.shields.io/badge/node->=18.0.0-brightgreen)
![pnpm](https://img.shields.io/badge/pnpm->=8.0.0-orange)
![license](https://img.shields.io/badge/license-MIT-blue)
![status](https://img.shields.io/badge/status-Production%20Ready-success)

### 口腔智能感控与设备运维管控中心

[在线演示](#快速体验) · [演示账号](#演示账号---开箱即用) · [项目简介](#项目简介) · [功能模块详述](#核心功能模块详述) · [权限矩阵](#rbac-权限控制矩阵) · [技术架构](#技术架构与技术选型) · [快速开始](#快速开始与环境搭建) · [项目结构](#完整项目文件目录树) · [部署说明](#部署与生产构建指南)

---

## 快速体验

### 已成功部署到 Vercel

访问地址：https://dental-smart-platform.vercel.app

> 提示：项目已针对云端 Serverless / Vercel 静态托管环境进行了全量兼容处理，内置离线持久化数据引擎 (LocalStorage)，无需配置数据库即可体验所有功能。

---

## 演示账号 - 开箱即用

无需注册，使用以下测试账号登录即可体验不同角色的完整功能与权限隔离机制：

| 账号角色 | 登录账号 (用户名) | 登录密码 | 真实称谓 | 权限范围与演示亮点 |
| :--- | :--- | :--- | :--- | :--- |
| **超级管理员** | `admin` | `admin123` | 超级管理员 | **全量最高控制权**：拥有平台所有功能访问权限，可进行账号创建/编辑/禁用、角色权限分配、日志全量审计以及系统参数配置。 |
| **系统管理员** | `sysytem_admin` | `sysytem_admin123` | 系统管理员 | **机构运营与运维管理**：可管理日常设备配置、查看日志审计、管理普通维修人员账号（受限保护：无法编辑或禁用超级管理员 `admin`）。 |
| **维修人员** | `demo_operator` | `demo_operator123` | 维修人员 | **一线设备运维**：专注于设备状态监控、实时遥测查看、告警处置标记及合规报表。系统管理与系统配置模块实施菜单隐去与路由 Guard 硬隔离。 |

> 推荐演示路线：
> 1. 登录 **维修人员** (`demo_operator`) -> 进入“告警与预测性维护” -> 点击“标记已处置” -> 观察概览计数器实时扣减与日志自动记录。
> 2. 登出并登录 **系统管理员** (`sysytem_admin`) 或 **超级管理员** (`admin`) -> 验证告警处置状态已全平台持久化同步 -> 进入“系统管理-登录日志/操作日志”查看审计轨迹。

---

## 项目简介

**智护牙境 (Dental Smart Platform)** 是一个专为口腔医院与大型诊所打造的现代化水路、气路智能感控与设备运维管控平台。

平台基于 **Vue 3 (Composition API) + TypeScript + Vite + Pinia + Element Plus + ECharts + Express** 打造，旨在解决传统口腔医疗机构中“水气感控数据不可见、滤芯消耗无法预测、告警响应滞后、人员角色职责混乱”等核心痛点。通过实时数据遥测流、AI 预测性维保诊断算法、晶莹毛玻璃双主题视觉感知与三级 RBAC 权限硬隔离机制，为口腔感控合规与设备运维提供标准化、数字化的技术支撑。

---

## 核心功能模块详述

### 1. 全局监控概览 (Dashboard)
- **核心 KPI 仪表盘**：实时展示设备总数、诊所机构数、在线设备数、水质合格率（99.99%）、气源除菌率（99.85%）、平均水质 TDS 及未响应待处理告警数。
- **水气设备态势感知**：以卡片形式展示核心水路与气路设备当前的运行状态、工作模式（正常模式 / 深度消毒 / 节能模式）及实时遥测指标。
- **告警分布统计**：聚合显示严重告警与预警提醒数，与后台告警处置状态保持全同步。

### 2. 水源消毒处理系统 (WaterDevice)
- **牙椅水路集中管控**：覆盖诊室牙椅水路消毒机、儿童诊室水路处理机、VIP 专科水路终端及供应中心次氯酸水发生主站。
- **远程工作模式切换**：支持一键下发指令切换设备工作模式（常规运行 / 深度消毒 / 节能模式）。
- **UV 杀菌与滤芯监控**：动态展示 UV 杀菌灯管开关状态与辐射效率，实时追踪超滤膜滤芯剩余寿命。

### 3. 气源洁净处理系统 (AirDevice)
- **无菌气源态势监控**：针对中央气源超净工作站、种植手术室无菌气源站、正畸中心气源站及负压抽吸除菌站进行集中监管。
- **多维度气源遥测**：实时监控供气压力 (MPa)、露点温度 (°C) 及空气流速。
- **滤芯衰减预警**：对 HEPA 高效过滤器气阻及除水除油滤芯衰减进行预测性评估。

### 4. 实时遥测与数据流 (Telemetry)
- **ECharts 动态可视化**：提供多通道遥测指标（水质 TDS、UV 强度、气压、露点）的 24 小时实时动态曲线图。
- **采样点多维度对比**：支持按设备编号进行过滤切换，高亮标注告警阈值区间。

### 5. 告警与预测性维护 (Alarm)
- **AI 预测性诊断**：算法对比光谱衰减、压差上升趋势与流量递减曲线，对滤芯堵塞及灯管老化进行提前预警。
- **告警一键处置**：支持运维人员与管理员点击“标记已处置”，状态实时写入持久化存储并全平台同步。
- **耗材维保看板**：列出各设备主要耗材（超滤膜、UV 灯管、HEPA 过滤器）的剩余使用寿命百分比及预计到期更换日期。

### 6. 感控合规报表 (Reports)
- **自动化检测汇总**：汇总口腔水质检测、气源菌落数及消毒合格率。
- **合规电子盖章**：内置电子检验专用章与编号，支持导出标准化 PDF / 印刷报表。

### 7. 系统管理与 RBAC 权限隔离 (System Management)
- **用户管理 (UserManagement)**：支持超级管理员与系统管理员新增/编辑/禁用账号。针对角色级别实施安全防范（系统管理员无法禁用超级管理员，用户无法禁用自身）。
- **角色管理 (RoleManagement)**：展示平台预设角色（超级管理员、系统管理员、维修人员）及其权限分配说明。
- **登录日志 (LoginLogs)**：实时记录全量账号的登录时间、IP 地址、浏览器 UserAgent 及登录结果，去除了所有硬编码假数据，全量持久化。
- **操作日志 (OperationLogs)**：审计记录设备模式切换、告警处置等敏感操作的操作人、模块名称、方法及时间戳。

### 8. 晶莹毛玻璃双主题视觉体系 (Design System)
- **高颜值为先**：采用高级 HSL 色调与毛玻璃 (Glassmorphic) 质感设计。
- **深浅模式平滑切换**：支持深色科技模式 (Dark Mode) 与优雅浅色明亮模式 (Light Mode) 一键切换。
- **系统色调感知加载屏**：在页面初始化及路由切换时提供高透明毛玻璃跃动加载屏，并自动识别操作系统色彩偏好（`prefers-color-scheme`）。

---

## RBAC 权限控制矩阵

平台采用严格的角色权限控制矩阵 (RBAC)，确保不同岗位的用户职责明确、数据安全：

| 模块 / 功能页面 | 路由路径 | 超级管理员 (`admin`) | 系统管理员 (`sysytem_admin`) | 维修人员 (`demo_operator`) |
| :--- | :--- | :---: | :---: | :---: |
| 全局监控概览 | `/` | 可访问 | 可访问 | 可访问 |
| 水源消毒处理系统 | `/water` | 可访问 / 可控制 | 可访问 / 可控制 | 可访问 / 可控制 |
| 气源洁净处理系统 | `/air` | 可访问 / 可控制 | 可访问 / 可控制 | 可访问 / 可控制 |
| 实时遥测与数据流 | `/telemetry` | 可访问 | 可访问 | 可访问 |
| 告警与预测性维护 | `/alarm` | 可处置 / 可查看 | 可处置 / 可查看 | **核心运维（可处置）** |
| 感控合规报表 | `/reports` | 可查看 / 可导出 | 可查看 / 可导出 | 可查看 / 可导出 |
| 系统与机构配置 | `/settings` | **全量配置** | **全量配置** | **硬隔离（菜单隐藏 + 路由拦截）** |
| 用户管理 | `/system/users` | **全量管理** | **受限管理（无法动 admin）** | **硬隔离（菜单隐藏 + 路由拦截）** |
| 角色管理 | `/system/roles` | **全量管理** | **可查看 / 可编辑** | **硬隔离（菜单隐藏 + 路由拦截）** |
| 登录日志审计 | `/system/login-logs` | **全量审计** | **全量审计** | **硬隔离（菜单隐藏 + 路由拦截）** |
| 操作日志审计 | `/system/op-logs` | **全量审计** | **全量审计** | **硬隔离（菜单隐藏 + 路由拦截）** |

---

## 技术架构与技术选型

### 前端技术栈 (Frontend)
- **核心框架**：Vue 3 ( Composition API, TypeScript, `<script setup>` )
- **构建工具**：Vite 5 (高效率 HMR 与生产打包优化)
- **状态管理**：Pinia 2 (模块化管理 `userStore` 与 `deviceStore`)
- **路由守护**：Vue Router 4 (基于角色与 Token 的 `beforeEach` 动态路由 Guard)
- **组件库**：Element Plus (定制黑暗/浅色主题变量) + Element Plus Icons
- **图表引擎**：ECharts 5 (响应式遥测折线图)
- **HTTP 客户端**：Axios (自动拦截与错误处理)
- **持久化引擎**：LocalStorage + SessionStorage (多级同步保障离线状态连通)

### 后端技术栈 (Backend)
- **运行环境**：Node.js >= 18
- **服务端框架**：Express (TypeScript)
- **实时通信**：WebSocket (模拟全双工硬件设备遥测推送)
- **邮件服务**：Nodemailer (验证码与系统通知)

---

## 快速开始与环境搭建

### 1. 环境准备
确保本地安装了以下开发环境：
- Node.js >= 18.0.0
- npm >= 9.0.0 或 pnpm >= 8.0.0

### 2. 获取代码与安装依赖

```bash
# 克隆代码仓库
git clone https://github.com/wmz0402/Dental_Smart_Platform.git
cd Dental_Smart_Platform

# 安装前端依赖
cd frontend
npm install

# 安装后端依赖 (可选)
cd ../backend
npm install
```

### 3. 启动开发服务器

#### 启动前端
```bash
cd frontend
npm run dev
```
访问地址：`http://localhost:5173`

#### 启动后端 (可选)
```bash
cd backend
npm run dev
```
后端服务端口：`http://localhost:3000`

### 4. 生产打包构建

```bash
cd frontend
npm run build
```
构建产物将输出在 `frontend/dist` 目录下。

---

## 完整项目文件目录树

```
Dental_Smart_Platform/
├── frontend/                             # 前端项目工程
│   ├── src/
│   │   ├── assets/                       # 静态资源与样式
│   │   │   ├── logo.svg                  # 品牌 Logo 图标
│   │   │   └── styles/
│   │   │       └── main.css              # 全局设计系统、双主题 CSS 变量与毛玻璃样式
│   │   ├── composables/                  # 组合式 API
│   │   │   └── usePageLoading.ts         # 统一跃动加载动画逻辑
│   │   ├── router/
│   │   │   └── index.ts                  # Vue Router 路由拦截与 RBAC 权限 Guard
│   │   ├── stores/                       # Pinia 状态中心
│   │   │   ├── deviceStore.ts            # 设备状态、遥测数据与告警计数 Store
│   │   │   └── userStore.ts              # 用户登录、权限校验与暗色主题 Store
│   │   ├── views/                        # 业务页面组件
│   │   │   ├── AirDevice.vue             # 气源洁净处理系统视图
│   │   │   ├── Alarm.vue                 # 告警与预测性维护视图
│   │   │   ├── Dashboard.vue             # 全局监控概览视图
│   │   │   ├── Login.vue                 # 登录视图 (纯净免记住凭据)
│   │   │   ├── LoginLogs.vue             # 登录日志审计视图
│   │   │   ├── OperationLogs.vue         # 操作日志审计视图
│   │   │   ├── Reports.vue               # 感控合规报表视图
│   │   │   ├── RoleManagement.vue        # 角色管理视图
│   │   │   ├── Settings.vue              # 系统与机构配置视图
│   │   │   ├── Telemetry.vue             # 实时遥测与数据流视图
│   │   │   ├── UserManagement.vue        # 用户管理视图
│   │   │   └── WaterDevice.vue           # 水源消毒处理系统视图
│   │   ├── App.vue                       # 根组件 (响应式侧栏、顶部用户中心、加载屏)
│   │   └── main.ts                       # 前端入口文件
│   ├── index.html                        # 入口 HTML (含首屏主题识别脚本与关键 CSS)
│   ├── package.json                      # 前端依赖配置
│   └── vite.config.ts                    # Vite 打包与代理配置
├── backend/                              # 后端 API 服务工程
│   ├── src/
│   │   ├── routes/                       # 路由控制器
│   │   │   ├── auth.ts                   # 身份验证路由
│   │   │   └── routes.ts                 # 设备、告警与日志 API 路由
│   │   └── server.ts                     # Express 与 WebSocket 服务端入口
│   └── package.json                      # 后端依赖配置
├── .gitignore                            # Git 忽略配置
└── README.md                             # 项目说明文档
```

---

## 部署与生产构建指南

### Vercel 部署
项目天然支持部署在 Vercel 平台：
1. 关联 GitHub 仓库 `wmz0402/Dental_Smart_Platform`。
2. 设置根目录为 `frontend`，Build Command 设置为 `npm run build`，Output Directory 设置为 `dist`。
3. 点击 Deploy 即可一键完成自动化构建发布。

---

## 开源协议与版权

[MIT License](LICENSE) © 2026 Dental Smart Platform Team. All rights reserved.
