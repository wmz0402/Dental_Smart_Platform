import { db } from '../db/database';
import { WebSocketServer, WebSocket } from 'ws';

export class DeviceSimulator {
  private wss: WebSocketServer | null = null;
  private timer: NodeJS.Timeout | null = null;

  constructor(wss: WebSocketServer) {
    this.wss = wss;
  }

  public start() {
    console.log('虚拟硬件设备模拟器已启动，开始实时产生遥测数据...');
    this.timer = setInterval(() => {
      this.generateTelemetry();
    }, 3000); // 每3秒推送一次最新遥测数据
  }

  public stop() {
    if (this.timer) clearInterval(this.timer);
  }

  private generateTelemetry() {
    db.all('SELECT sn, type, work_mode, status FROM devices', (err, devices: any[]) => {
      if (err || !devices) return;

      devices.forEach((dev) => {
        if (dev.status === 'OFFLINE') return;

        const isWater = dev.type === 'WATER';
        
        // 生成传感器数值
        const tdsVal = isWater ? parseFloat((12 + Math.random() * 6).toFixed(2)) : 0; // TDS 12-18 ppm (优质纯净水)
        const turbidity = isWater ? parseFloat((0.02 + Math.random() * 0.05).toFixed(3)) : 0; // 浊度 0.02-0.07 NTU
        const flowRate = isWater ? parseFloat((1.2 + Math.random() * 0.4).toFixed(2)) : 0; // 流量 1.2-1.6 L/min

        const pressure = !isWater ? parseFloat((0.62 + Math.random() * 0.08 - 0.04).toFixed(2)) : 0; // 气压 0.58-0.70 MPa
        const dewPoint = !isWater ? parseFloat((-42.5 + Math.random() * 3.0 - 1.5).toFixed(1)) : 0; // 露点 -44~-41 ℃
        const pm25 = !isWater ? parseFloat((1.2 + Math.random() * 1.5).toFixed(1)) : 0; // PM2.5

        const uvIntensity = parseFloat((98.5 + Math.random() * 1.5).toFixed(1)); // UV强度 %

        // 保存日志
        const stmt = db.prepare(`
          INSERT INTO telemetry_logs (device_sn, tds_val, turbidity, flow_rate, pressure, dew_point, pm25, uv_intensity)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(dev.sn, tdsVal, turbidity, flowRate, pressure, dewPoint, pm25, uvIntensity);
        stmt.finalize();

        // WebSocket 实时推送
        const payload = JSON.stringify({
          type: 'TELEMETRY_UPDATE',
          deviceSn: dev.sn,
          deviceType: dev.type,
          data: {
            tdsVal,
            turbidity,
            flowRate,
            pressure,
            dewPoint,
            pm25,
            uvIntensity,
            timestamp: new Date().toISOString()
          }
        });

        this.broadcast(payload);
      });
    });
  }

  private broadcast(data: string) {
    if (!this.wss) return;
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }
}
