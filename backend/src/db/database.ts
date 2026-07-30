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
  { id: 1, sn: 'W-SYS-2026-01', name: '1号口腔椅位水源精准消毒机', type: 'WATER', clinic_id: 101, location: '诊室一 牙椅01', work_mode: 'DEEP_CLEAN', status: 'ONLINE', uv_status: 1, filter_level: 88, uv_lamp_health: 94 },
  { id: 2, sn: 'W-SYS-2026-02', name: '2号口腔椅位水源精准消毒机', type: 'WATER', clinic_id: 101, location: '诊室一 牙椅02', work_mode: 'DEEP_CLEAN', status: 'ONLINE', uv_status: 1, filter_level: 95, uv_lamp_health: 98 },
  { id: 3, sn: 'W-SYS-2026-03', name: '3号儿童诊室水路智能处理机', type: 'WATER', clinic_id: 101, location: '诊室二 牙椅03', work_mode: 'NORMAL', status: 'ONLINE', uv_status: 1, filter_level: 91, uv_lamp_health: 92 },
  { id: 4, sn: 'W-SYS-2026-04', name: 'VIP特诊间高阶水路消毒终端', type: 'WATER', clinic_id: 101, location: 'VIP套间 牙椅05', work_mode: 'ECO', status: 'ONLINE', uv_status: 1, filter_level: 86, uv_lamp_health: 90 },
  { id: 5, sn: 'W-SYS-2026-05', name: '5号种植专科水路无菌消毒站', type: 'WATER', clinic_id: 101, location: '种植中心 牙椅08', work_mode: 'DEEP_CLEAN', status: 'ONLINE', uv_status: 1, filter_level: 94, uv_lamp_health: 97 },
  { id: 6, sn: 'W-SYS-2026-06', name: '6号正畸中心综合水路净化机', type: 'WATER', clinic_id: 101, location: '正畸中心 牙椅10', work_mode: 'NORMAL', status: 'ONLINE', uv_status: 1, filter_level: 89, uv_lamp_health: 91 },
  { id: 7, sn: 'W-SYS-2026-07', name: '二楼牙体牙髓科水路处理终端', type: 'WATER', clinic_id: 101, location: '二楼诊区 牙椅12', work_mode: 'NORMAL', status: 'ONLINE', uv_status: 1, filter_level: 92, uv_lamp_health: 95 },
  { id: 8, sn: 'W-SYS-2026-08', name: '消毒供应中心次氯酸水发生主站', type: 'WATER', clinic_id: 101, location: '消毒供应室 主柜01', work_mode: 'DEEP_CLEAN', status: 'ONLINE', uv_status: 1, filter_level: 98, uv_lamp_health: 99 },
  { id: 9, sn: 'W-SYS-2026-09', name: '9号修复专科综合牙椅水路净化站', type: 'WATER', clinic_id: 101, location: '修复科 牙椅15', work_mode: 'NORMAL', status: 'ONLINE', uv_status: 1, filter_level: 90, uv_lamp_health: 93 },
  { id: 10, sn: 'W-SYS-2026-10', name: '10号牙周专科超声洁治高洁水站', type: 'WATER', clinic_id: 101, location: '牙周科 牙椅18', work_mode: 'DEEP_CLEAN', status: 'ONLINE', uv_status: 1, filter_level: 87, uv_lamp_health: 89 },
  { id: 11, sn: 'W-SYS-2026-11', name: '11号急诊颌面外科无菌冲洗机', type: 'WATER', clinic_id: 101, location: '急诊室 牙椅20', work_mode: 'DEEP_CLEAN', status: 'ONLINE', uv_status: 1, filter_level: 96, uv_lamp_health: 98 },
  { id: 12, sn: 'W-SYS-2026-12', name: '12号预防齿科水路软化消毒终端', type: 'WATER', clinic_id: 101, location: '预防齿科 牙椅22', work_mode: 'ECO', status: 'ONLINE', uv_status: 1, filter_level: 93, uv_lamp_health: 95 },
  { id: 13, sn: 'W-SYS-2026-13', name: '三楼特诊中心高洁抑菌水路节点', type: 'WATER', clinic_id: 101, location: '三楼VIP区 牙椅25', work_mode: 'NORMAL', status: 'ONLINE', uv_status: 1, filter_level: 91, uv_lamp_health: 94 },
  { id: 14, sn: 'W-SYS-2026-14', name: '技工室印模清洗消毒水路专机', type: 'WATER', clinic_id: 101, location: '技工中心 消毒台02', work_mode: 'DEEP_CLEAN', status: 'ONLINE', uv_status: 1, filter_level: 95, uv_lamp_health: 97 },

  { id: 15, sn: 'A-SYS-2026-01', name: '中央气源超净处理工作站', type: 'AIR', clinic_id: 101, location: '主设备间 气源机组A', work_mode: 'NORMAL', status: 'ONLINE', uv_status: 1, filter_level: 78, uv_lamp_health: 85 },
  { id: 16, sn: 'A-SYS-2026-02', name: '种植手术室无菌气源站', type: 'AIR', clinic_id: 102, location: '分院 手术室01', work_mode: 'NORMAL', status: 'ONLINE', uv_status: 1, filter_level: 92, uv_lamp_health: 96 },
  { id: 17, sn: 'A-SYS-2026-03', name: '二楼正畸中心高洁净气源站', type: 'AIR', clinic_id: 101, location: '二楼正畸中心 机组B', work_mode: 'ECO', status: 'ONLINE', uv_status: 1, filter_level: 89, uv_lamp_health: 93 },
  { id: 18, sn: 'A-SYS-2026-04', name: '牙科负压抽吸高效除菌处理站', type: 'AIR', clinic_id: 101, location: '设备负压间 机组C', work_mode: 'DEEP_CLEAN', status: 'ONLINE', uv_status: 1, filter_level: 85, uv_lamp_health: 90 },
  { id: 19, sn: 'A-SYS-2026-05', name: '儿童牙科诊区舒适低噪气源站', type: 'AIR', clinic_id: 101, location: '诊室二 气源分支02', work_mode: 'ECO', status: 'ONLINE', uv_status: 1, filter_level: 91, uv_lamp_health: 94 },
  { id: 20, sn: 'A-SYS-2026-06', name: 'VIP特诊中心高压无油无菌气源站', type: 'AIR', clinic_id: 101, location: 'VIP层 气源主节点', work_mode: 'NORMAL', status: 'ONLINE', uv_status: 1, filter_level: 96, uv_lamp_health: 98 },
  { id: 21, sn: 'A-SYS-2026-07', name: '7号修复中心气源高精度过滤工作站', type: 'AIR', clinic_id: 101, location: '修复科 气源机组D', work_mode: 'NORMAL', status: 'ONLINE', uv_status: 1, filter_level: 88, uv_lamp_health: 91 },
  { id: 22, sn: 'A-SYS-2026-08', name: '8号牙周洁治区气溶胶抽吸净化工作站', type: 'AIR', clinic_id: 101, location: '牙周科 气源分支04', work_mode: 'DEEP_CLEAN', status: 'ONLINE', uv_status: 1, filter_level: 84, uv_lamp_health: 87 },
  { id: 23, sn: 'A-SYS-2026-09', name: '9号急诊手术室医用压缩空气净化机', type: 'AIR', clinic_id: 101, location: '急诊手术室 机组E', work_mode: 'NORMAL', status: 'ONLINE', uv_status: 1, filter_level: 93, uv_lamp_health: 96 },
  { id: 24, sn: 'A-SYS-2026-10', name: '10号口腔放射影像室除湿除尘气源机', type: 'AIR', clinic_id: 101, location: '放射科 机组F', work_mode: 'ECO', status: 'ONLINE', uv_status: 1, filter_level: 90, uv_lamp_health: 92 },
  { id: 25, sn: 'A-SYS-2026-11', name: '技工中心高压气动研磨无尘气源站', type: 'AIR', clinic_id: 101, location: '技工室 气源分支06', work_mode: 'DEEP_CLEAN', status: 'ONLINE', uv_status: 1, filter_level: 87, uv_lamp_health: 89 },
  { id: 26, sn: 'A-SYS-2026-12', name: '消毒供应中心器械吹干无菌气源站', type: 'AIR', clinic_id: 101, location: '消毒供应室 吹干台01', work_mode: 'NORMAL', status: 'ONLINE', uv_status: 1, filter_level: 95, uv_lamp_health: 97 }
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
