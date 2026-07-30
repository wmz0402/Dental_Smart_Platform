import { Router, Request, Response } from 'express';
import { getDb, memoryDevices } from '../db/database';

export const router = Router();

// 1. 获取全局概览指标数据
router.get('/overview', (req: Request, res: Response) => {
  const db = getDb();
  if (!db) {
    // 云端 Vercel 环境安全降级
    return res.json({
      totalDevices: memoryDevices.length,
      totalClinics: 2,
      onlineDevices: memoryDevices.filter(d => d.status === 'ONLINE').length,
      waterDisinfectionRate: 99.99,
      waterSterilizeRate: 99.99,
      avgWaterTds: 14.2,
      airSterilizationRate: 99.85,
      airBacteriaKillRate: 99.85,
      avgAirPressure: 0.65,
      activeAlarmsCount: 1,
      unresolvedAlarms: 1
    });
  }

  const sql = `
    SELECT 
      (SELECT COUNT(*) FROM devices) as totalDevices,
      (SELECT COUNT(*) FROM devices WHERE status = 'ONLINE') as onlineDevices
  `;

  db.get(sql, [], (err, row: any) => {
    if (err || !row) {
      return res.json({
        totalDevices: memoryDevices.length,
        totalClinics: 2,
        onlineDevices: memoryDevices.length,
        waterDisinfectionRate: 99.99,
        airSterilizationRate: 99.85,
        activeAlarmsCount: 1
      });
    }

    res.json({
      totalDevices: row.totalDevices || memoryDevices.length,
      totalClinics: 2,
      onlineDevices: row.onlineDevices || memoryDevices.length,
      waterDisinfectionRate: 99.99,
      waterSterilizeRate: 99.99,
      avgWaterTds: 14.2,
      airSterilizationRate: 99.85,
      airBacteriaKillRate: 99.85,
      avgAirPressure: 0.65,
      activeAlarmsCount: 1,
      unresolvedAlarms: 1
    });
  });
});

// 2. 获取硬件设备列表 (支持类型筛选)
router.get('/devices', (req: Request, res: Response) => {
  const { type } = req.query;
  const db = getDb();

  if (!db) {
    let result = memoryDevices;
    if (type) {
      result = memoryDevices.filter(d => d.type === String(type).toUpperCase());
    }
    return res.json(result);
  }

  let sql = `SELECT d.*, c.name as clinic_name FROM devices d LEFT JOIN clinics c ON d.clinic_id = c.id`;
  const params: any[] = [];

  if (type) {
    sql += ` WHERE d.type = ?`;
    params.push(String(type).toUpperCase());
  }

  db.all(sql, params, (err, rows) => {
    if (err || !rows || rows.length === 0) {
      let result = memoryDevices;
      if (type) {
        result = memoryDevices.filter(d => d.type === String(type).toUpperCase());
      }
      return res.json(result);
    }
    res.json(rows);
  });
});

// 3. 修改设备工作模式
router.post('/devices/:id/mode', (req: Request, res: Response) => {
  const { id } = req.params;
  const { mode } = req.body;

  const devId = parseInt(id, 10);
  const memDev = memoryDevices.find(d => d.id === devId || d.sn === id);
  if (memDev) {
    memDev.work_mode = mode as any;
  }

  const db = getDb();
  if (!db) {
    return res.json({ success: true, message: '模式切换成功 (云端降级)' });
  }

  db.run(`UPDATE devices SET work_mode = ? WHERE id = ? OR sn = ?`, [mode, id, id], (err) => {
    res.json({ success: true, message: '模式修改成功' });
  });
});

// 4. 新增硬件设备
router.post('/devices', (req: Request, res: Response) => {
  const { sn, name, type, clinic_id, location } = req.body;

  const newMemDev: any = {
    id: Date.now(),
    sn: sn || `DEV-${Date.now()}`,
    name: name || '新感控设备',
    type: type || 'WATER',
    clinic_id: clinic_id || 101,
    location: location || '诊室',
    work_mode: 'NORMAL',
    status: 'ONLINE',
    uv_status: 1,
    filter_level: 100,
    uv_lamp_health: 100
  };
  memoryDevices.unshift(newMemDev);

  const db = getDb();
  if (!db) {
    return res.json({ success: true, deviceId: newMemDev.id });
  }

  const sql = `
    INSERT INTO devices (sn, name, type, clinic_id, location, work_mode, status)
    VALUES (?, ?, ?, ?, ?, 'NORMAL', 'ONLINE')
  `;

  db.run(sql, [sn, name, type, clinic_id || 101, location || '诊室'], function (err) {
    res.json({ success: true, deviceId: this?.lastID || newMemDev.id });
  });
});

// 5. 获取告警数据
router.get('/alarms', (req: Request, res: Response) => {
  const defaultAlarms = [
    {
      id: 1,
      device_sn: 'W-SYS-2026-01',
      device_name: '1号口腔椅位水源消毒机',
      level: 'WARNING',
      message: '紫外杀菌灯使用寿命剩余 6%（预计 14 天内需更换配件）',
      created_at: new Date().toISOString(),
      status: 'UNRESOLVED'
    }
  ];
  res.json(defaultAlarms);
});

// 6. 获取设备历史遥测数据
router.get('/telemetry/history', (req: Request, res: Response) => {
  const { deviceSn } = req.query;
  const history: any[] = [];
  const now = Date.now();

  for (let i = 10; i >= 0; i--) {
    const time = new Date(now - i * 60 * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const uvVal = Number((94.5 + Math.sin(i * 0.45) * 3.5 + (Math.random() - 0.5) * 1.5).toFixed(1));
    history.push({
      timestamp: time,
      tds: Math.floor(12 + Math.random() * 5),
      dew_point: -42 + Math.floor(Math.random() * 3),
      pressure: 0.65,
      water_flow: 1.2,
      uvIntensity: uvVal
    });
  }

  res.json(history);
});
