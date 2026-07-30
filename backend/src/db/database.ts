import path from 'path';
import fs from 'fs';

let db: any = null;

export interface MemoryDevice {
  id: number;
  sn: string;
  name: string;
  type: 'WATER' | 'AIR';
  clinic_id: number;
  location: string;
  work_mode: 'NORMAL' | 'ECO' | 'DEEP_CLEAN' | 'OFF';
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  uv_status: number;
  filter_level: number;
  uv_lamp_health: number;
}

export const memoryDevices: MemoryDevice[] = [
  { id: 1, sn: 'W-SYS-2026-01', name: '1号口腔椅位水源消毒机', type: 'WATER', clinic_id: 101, location: '诊室一 牙椅01', work_mode: 'DEEP_CLEAN', status: 'ONLINE', uv_status: 1, filter_level: 88, uv_lamp_health: 94 },
  { id: 2, sn: 'W-SYS-2026-02', name: '2号口腔椅位水源消毒机', type: 'WATER', clinic_id: 101, location: '诊室一 牙椅02', work_mode: 'DEEP_CLEAN', status: 'ONLINE', uv_status: 1, filter_level: 95, uv_lamp_health: 98 },
  { id: 3, sn: 'W-SYS-2026-03', name: '3号儿童诊室水路智能处理机', type: 'WATER', clinic_id: 101, location: '诊室二 牙椅03', work_mode: 'NORMAL', status: 'ONLINE', uv_status: 1, filter_level: 91, uv_lamp_health: 92 },
  { id: 4, sn: 'W-SYS-2026-04', name: 'VIP特诊间高阶水路消毒终端', type: 'WATER', clinic_id: 101, location: 'VIP套间 牙椅05', work_mode: 'ECO', status: 'ONLINE', uv_status: 1, filter_level: 86, uv_lamp_health: 90 },
  { id: 5, sn: 'A-SYS-2026-01', name: '中央气源超净处理工作站', type: 'AIR', clinic_id: 101, location: '主设备间 气源机组A', work_mode: 'NORMAL', status: 'ONLINE', uv_status: 1, filter_level: 78, uv_lamp_health: 85 },
  { id: 6, sn: 'A-SYS-2026-02', name: '种植手术室无菌气源站', type: 'AIR', clinic_id: 102, location: '分院 手术室01', work_mode: 'NORMAL', status: 'ONLINE', uv_status: 1, filter_level: 92, uv_lamp_health: 96 },
  { id: 7, sn: 'A-SYS-2026-03', name: '二楼正畸中心高洁净气源站', type: 'AIR', clinic_id: 101, location: '二楼正畸中心 机组B', work_mode: 'ECO', status: 'ONLINE', uv_status: 1, filter_level: 89, uv_lamp_health: 93 }
];

export function initDatabase(): Promise<any> {
  return new Promise((resolve) => {
    // 云端 Vercel 环境彻底免除原生 C++ sqlite3 模块依赖，保障零报错运行
    if (process.env.VERCEL) {
      console.log('Vercel 云端运行模式：加载内存与 Atlas 云服务');
      return resolve(null);
    }

    try {
      // 仅在本地开发环境中动态要求 sqlite3 模块
      const sqlite3 = require('sqlite3');
      const dbPath = path.resolve(__dirname, '../../dental_smart.db');
      const schemaPath = path.resolve(__dirname, 'schema.sql');

      db = new sqlite3.Database(dbPath, (err: any) => {
        if (err) {
          console.error('本地数据库初始化提示 (降级为内存模式):', err.message);
          return resolve(null);
        }

        if (fs.existsSync(schemaPath)) {
          const schema = fs.readFileSync(schemaPath, 'utf8');
          db.exec(schema, () => resolve(db));
        } else {
          resolve(db);
        }
      });
    } catch (e) {
      resolve(null);
    }
  });
}

export function getDb(): any {
  return db;
}
