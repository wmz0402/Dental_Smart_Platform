-- 口腔智能感控平台数据库结构

-- 1. 诊所机构表
CREATE TABLE IF NOT EXISTS clinics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT,
  contact_person TEXT,
  phone TEXT,
  status TEXT DEFAULT 'ACTIVE',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 系统用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  real_name TEXT NOT NULL,
  role TEXT DEFAULT 'OPERATOR', -- ADMIN, MANAGER, OPERATOR, ENGINEER
  clinic_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clinic_id) REFERENCES clinics (id)
);

-- 3. 设备信息表
CREATE TABLE IF NOT EXISTS devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sn TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- WATER: 水源消毒处理系统, AIR: 气源洁净处理系统
  clinic_id INTEGER,
  location TEXT,
  work_mode TEXT DEFAULT 'NORMAL', -- NORMAL: 正常模式, ECO: 节能模式, DEEP_CLEAN: 深度消毒, OFF: 关机
  status TEXT DEFAULT 'ONLINE', -- ONLINE, OFFLINE, ALARM, MAINTENANCE
  uv_status INTEGER DEFAULT 1, -- 1: 开启, 0: 关闭
  filter_level INTEGER DEFAULT 100, -- 滤芯健康度 0-100%
  uv_lamp_health INTEGER DEFAULT 100, -- UV灯管健康度 0-100%
  last_online DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clinic_id) REFERENCES clinics (id)
);

-- 4. 传感器遥测日志表
CREATE TABLE IF NOT EXISTS telemetry_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_sn TEXT NOT NULL,
  tds_val REAL, -- 水质TDS值 (ppm)
  turbidity REAL, -- 水质浊度 (NTU)
  flow_rate REAL, -- 水流量 (L/min)
  pressure REAL, -- 气源压力 (MPa)
  dew_point REAL, -- 气源露点温度 (℃)
  pm25 REAL, -- 尘埃颗粒物 (μg/m³)
  uv_intensity REAL, -- UV照射强度 (mW/cm²)
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. 故障告警记录表
CREATE TABLE IF NOT EXISTS alarms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_sn TEXT NOT NULL,
  alarm_code TEXT NOT NULL,
  title TEXT NOT NULL,
  level TEXT DEFAULT 'WARNING', -- CRITICAL: 严重, WARNING: 警告, INFO: 提醒
  description TEXT,
  status TEXT DEFAULT 'UNRESOLVED', -- UNRESOLVED: 未处理, RESOLVED: 已解决, IGNORED: 已忽略
  triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME
);

-- 6. 耗材维保记录表
CREATE TABLE IF NOT EXISTS consumables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_sn TEXT NOT NULL,
  item_name TEXT NOT NULL, -- 如 PP棉滤芯, RO反渗透膜, UV消毒灯管, 活性炭模组
  life_remaining REAL DEFAULT 100.0, -- 剩余寿命百分比
  installed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  estimated_replace_date DATE,
  status TEXT DEFAULT 'HEALTHY' -- HEALTHY, REPLACEMENT_REQUIRED, EXPIRED
);
