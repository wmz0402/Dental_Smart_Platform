import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve(__dirname, '../../dental_smart.db');
export const db = new sqlite3.Database(dbPath);

export function initDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    db.exec(sql, (err) => {
      if (err) {
        console.error('数据库初始化失败:', err);
        return reject(err);
      }
      console.log('数据库结构建立完成');

      // 植入初始演示数据
      seedInitialData()
        .then(() => resolve())
        .catch((e) => reject(e));
    });
  });
}

function seedInitialData(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM clinics', (err, row: any) => {
      if (err) return reject(err);
      if (row.count > 0) return resolve(); // 已有数据

      console.log('正在植入初始演示诊所与设备数据...');
      db.serialize(() => {
        // 插入诊所
        db.run(
          `INSERT INTO clinics (id, name, code, address, contact_person, phone) 
           VALUES (1, '智护牙科示范总院', 'HQ-001', '北京市海淀区中关村科技园区8号', '张院长', '010-88886666')`
        );
        db.run(
          `INSERT INTO clinics (id, name, code, address, contact_person, phone) 
           VALUES (2, '智护牙科国贸分院', 'BJ-002', '北京市朝阳区建国门外大街1号', '李主任', '010-66668888')`
        );

        // 插入设备 (水源消毒设备与气源洁净设备)
        db.run(
          `INSERT INTO devices (sn, name, type, clinic_id, location, work_mode, status, uv_status, filter_level, uv_lamp_health) 
           VALUES ('W-SYS-2026-01', '1号口腔椅位水源精滤消毒机', 'WATER', 1, '诊诊一室 牙椅01', 'NORMAL', 'ONLINE', 1, 88, 92)`
        );
        db.run(
          `INSERT INTO devices (sn, name, type, clinic_id, location, work_mode, status, uv_status, filter_level, uv_lamp_health) 
           VALUES ('W-SYS-2026-02', '2号口腔椅位水源精滤消毒机', 'WATER', 1, '诊诊一室 牙椅02', 'ECO', 'ONLINE', 1, 95, 96)`
        );
        db.run(
          `INSERT INTO devices (sn, name, type, clinic_id, location, work_mode, status, uv_status, filter_level, uv_lamp_health) 
           VALUES ('A-SYS-2026-01', '中央气源超净处理工作站', 'AIR', 1, '设备主间 气源机组A', 'NORMAL', 'ONLINE', 1, 78, 85)`
        );
        db.run(
          `INSERT INTO devices (sn, name, type, clinic_id, location, work_mode, status, uv_status, filter_level, uv_lamp_health) 
           VALUES ('A-SYS-2026-02', '种植手术室无菌气源站', 'AIR', 2, '国贸分院 手术室01', 'NORMAL', 'ONLINE', 1, 92, 94)`
        );

        // 插入初始耗材
        db.run(
          `INSERT INTO consumables (device_sn, item_name, life_remaining, estimated_replace_date, status)
           VALUES ('W-SYS-2026-01', '高分子聚合物滤芯', 88.0, '2026-11-15', 'HEALTHY')`
        );
        db.run(
          `INSERT INTO consumables (device_sn, item_name, life_remaining, estimated_replace_date, status)
           VALUES ('W-SYS-2026-01', '深紫外UV-C杀菌灯管', 92.0, '2027-01-20', 'HEALTHY')`
        );
        db.run(
          `INSERT INTO consumables (device_sn, item_name, life_remaining, estimated_replace_date, status)
           VALUES ('A-SYS-2026-01', 'ULPA超高效空气过滤网', 78.0, '2026-09-30', 'HEALTHY')`
        );

        // 插入初始告警
        db.run(
          `INSERT INTO alarms (device_sn, alarm_code, title, level, description, status)
           VALUES ('A-SYS-2026-01', 'ERR_AIR_PRESS_LOW', '压缩空气输出压力略微偏低', 'WARNING', '检出输出气压低于0.55MPa，建议排查空气管道密封', 'UNRESOLVED')`
        );

        resolve();
      });
    });
  });
}
