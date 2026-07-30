import { defineStore } from 'pinia';
import axios from 'axios';

export interface Device {
  id: number;
  sn: string;
  name: string;
  type: 'WATER' | 'AIR';
  clinic_id: number;
  clinic_name?: string;
  location: string;
  work_mode: 'NORMAL' | 'ECO' | 'DEEP_CLEAN' | 'OFF';
  status: 'ONLINE' | 'OFFLINE' | 'ALARM' | 'MAINTENANCE';
  uv_status: number;
  filter_level: number;
  uv_lamp_health: number;
}

export interface TelemetryData {
  tdsVal: number;
  turbidity: number;
  flowRate: number;
  pressure: number;
  dewPoint: number;
  pm25: number;
  uvIntensity: number;
  timestamp: string;
}

export const useDeviceStore = defineStore('device', {
  state: () => ({
    overview: {
      totalClinics: 0,
      totalDevices: 0,
      onlineDevices: 0,
      waterDevices: 0,
      airDevices: 0,
      unresolvedAlarms: 0,
      avgWaterTds: 14.2,
      avgAirPressure: 0.65,
      waterSterilizeRate: 99.99,
      airBacteriaKillRate: 99.85
    },
    devices: [] as Device[],
    realtimeTelemetry: {} as Record<string, TelemetryData>,
    wsConnected: false,
    socket: null as WebSocket | null
  }),

  actions: {
    async fetchOverview() {
      try {
        const res = await axios.get('/api/overview');
        this.overview = res.data;
      } catch (err) {
        console.error('获取概览指标失败', err);
      }
    },

    async fetchDevices(type?: string) {
      try {
        const res = await axios.get('/api/devices', { params: { type } });
        this.devices = res.data;
      } catch (err) {
        console.error('获取设备列表失败', err);
      }
    },

    async changeWorkMode(sn: string, workMode: string) {
      try {
        await axios.post(`/api/devices/${sn}/mode`, { workMode });
        await this.fetchDevices();
        await this.fetchOverview();
      } catch (err) {
        console.error('修改工作模式失败', err);
        throw err;
      }
    },

    async toggleUv(sn: string, uvStatus: boolean) {
      try {
        await axios.post(`/api/devices/${sn}/uv`, { uvStatus });
        await this.fetchDevices();
      } catch (err) {
        console.error('切换UV消毒开关失败', err);
        throw err;
      }
    },

    initWebSocket() {
      if (this.socket) return;
      const wsUrl = `ws://${window.location.hostname}:8080`;
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.wsConnected = true;
        console.log('与感控平台 WebSocket 连接构建成功');
      };

      this.socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'TELEMETRY_UPDATE') {
            this.realtimeTelemetry[msg.deviceSn] = msg.data;
          }
        } catch (e) {
          console.error('解析推送数据错误', e);
        }
      };

      this.socket.onclose = () => {
        this.wsConnected = false;
        this.socket = null;
        // 自动断线重连
        setTimeout(() => this.initWebSocket(), 5000);
      };
    }
  }
});
