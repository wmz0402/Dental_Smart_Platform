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
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  uv_status: number;
  filter_level: number;
  uv_lamp_health: number;
}

export interface TelemetryData {
  tds?: number;
  tdsVal?: number;
  turbidity?: number;
  flowRate?: number;
  uvIntensity?: number;
  disinfectant_conc?: number;
  water_flow?: number;
  dew_point?: number;
  dewPoint?: number;
  pm25?: number;
  pressure?: number;
  air_flow?: number;
  timestamp: string;
}

export interface OverviewData {
  totalDevices: number;
  totalClinics: number;
  onlineDevices: number;
  waterDisinfectionRate: number;
  waterSterilizeRate: number;
  avgWaterTds: number;
  airSterilizationRate: number;
  airBacteriaKillRate: number;
  avgAirPressure: number;
  activeAlarmsCount: number;
  unresolvedAlarms: number;
}

const defaultFallbackDevices: Device[] = [
  {
    id: 1,
    sn: 'W-SYS-2026-01',
    name: '1号口腔椅位水源精准消毒机',
    type: 'WATER',
    clinic_id: 101,
    clinic_name: '示范总院口腔门诊部',
    location: '诊诊一室 牙椅01',
    work_mode: 'DEEP_CLEAN',
    status: 'ONLINE',
    uv_status: 1,
    filter_level: 88,
    uv_lamp_health: 94
  },
  {
    id: 2,
    sn: 'W-SYS-2026-02',
    name: '2号口腔椅位水源精准消毒机',
    type: 'WATER',
    clinic_id: 101,
    clinic_name: '示范总院口腔门诊部',
    location: '诊诊一室 牙椅02',
    work_mode: 'DEEP_CLEAN',
    status: 'ONLINE',
    uv_status: 1,
    filter_level: 95,
    uv_lamp_health: 98
  },
  {
    id: 3,
    sn: 'W-SYS-2026-03',
    name: '3号儿童诊室水路智能处理机',
    type: 'WATER',
    clinic_id: 101,
    clinic_name: '示范总院口腔门诊部',
    location: '诊诊二室 牙椅03',
    work_mode: 'NORMAL',
    status: 'ONLINE',
    uv_status: 1,
    filter_level: 91,
    uv_lamp_health: 92
  },
  {
    id: 4,
    sn: 'W-SYS-2026-04',
    name: 'VIP特诊间高阶水路消毒终端',
    type: 'WATER',
    clinic_id: 101,
    clinic_name: '示范总院口腔门诊部',
    location: 'VIP特诊套间 牙椅05',
    work_mode: 'ECO',
    status: 'ONLINE',
    uv_status: 1,
    filter_level: 86,
    uv_lamp_health: 90
  },
  {
    id: 5,
    sn: 'A-SYS-2026-01',
    name: '中央气源超净处理工作站',
    type: 'AIR',
    clinic_id: 101,
    clinic_name: '示范总院口腔门诊部',
    location: '设备主间 气源机组A',
    work_mode: 'NORMAL',
    status: 'ONLINE',
    uv_status: 1,
    filter_level: 78,
    uv_lamp_health: 85
  },
  {
    id: 6,
    sn: 'A-SYS-2026-02',
    name: '种植手术室无菌气源站',
    type: 'AIR',
    clinic_id: 102,
    clinic_name: '国贸分院牙科中心',
    location: '国贸分院 手术室01',
    work_mode: 'NORMAL',
    status: 'ONLINE',
    uv_status: 1,
    filter_level: 92,
    uv_lamp_health: 96
  },
  {
    id: 7,
    sn: 'A-SYS-2026-03',
    name: '二楼正畸中心高洁净气源站',
    type: 'AIR',
    clinic_id: 101,
    clinic_name: '示范总院口腔门诊部',
    location: '二楼正畸中心 气源机组B',
    work_mode: 'ECO',
    status: 'ONLINE',
    uv_status: 1,
    filter_level: 89,
    uv_lamp_health: 93
  }
];

export const useDeviceStore = defineStore('device', {
  state: () => {
    const saved = localStorage.getItem('local_devices');
    let initDevices = defaultFallbackDevices as Device[];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          initDevices = parsed;
        }
      } catch (e) {}
    }
    return {
      devices: initDevices,
      overview: {
        totalDevices: initDevices.length,
        totalClinics: 2,
        onlineDevices: initDevices.filter(d => d.status === 'ONLINE').length,
        waterDisinfectionRate: 99.99,
        waterSterilizeRate: 99.99,
        avgWaterTds: 14.2,
        airSterilizationRate: 99.85,
        airBacteriaKillRate: 99.85,
        avgAirPressure: 0.65,
        activeAlarmsCount: 3,
        unresolvedAlarms: 3
      } as OverviewData,
      realtimeTelemetry: {} as Record<string, TelemetryData>,
      wsConnected: false,
      socket: null as WebSocket | null
    };
  },

  actions: {
    async fetchOverview() {
      try {
        const res = await axios.get('/api/overview');
        if (res.data && res.data.totalDevices) {
          this.overview = { ...this.overview, ...res.data };
        }
      } catch (err) {
        this.overview.totalDevices = this.devices.length;
        this.overview.onlineDevices = this.devices.filter(d => d.status === 'ONLINE').length;
      }
    },

    async fetchDevices(typeOrForce?: any, force?: boolean) {
      try {
        const res = await axios.get('/api/devices');
        if (Array.isArray(res.data) && res.data.length > 0) {
          this.devices = res.data;
          localStorage.setItem('local_devices', JSON.stringify(this.devices));
        } else if (this.devices.length === 0 || force) {
          this.devices = defaultFallbackDevices;
          localStorage.setItem('local_devices', JSON.stringify(this.devices));
        }
      } catch (err) {
        if (this.devices.length === 0 || force) {
          this.devices = defaultFallbackDevices;
        }
      }
    },

    async updateDeviceMode(deviceId: number | string, mode: string) {
      const id = typeof deviceId === 'string' ? parseInt(deviceId, 10) : deviceId;
      const dev = this.devices.find(d => d.id === id || d.sn === deviceId);
      if (dev) {
        dev.work_mode = mode as any;
        localStorage.setItem('local_devices', JSON.stringify(this.devices));
      }
      try {
        await axios.post(`/api/devices/${id}/mode`, { mode });
      } catch (err) {}
    },

    async changeWorkMode(deviceId: number | string, mode: string) {
      return this.updateDeviceMode(deviceId, mode);
    },

    async toggleUv(deviceId: number | string, status?: any) {
      const id = typeof deviceId === 'string' ? parseInt(deviceId, 10) : deviceId;
      const dev = this.devices.find(d => d.id === id || d.sn === deviceId);
      if (dev) {
        dev.uv_status = status !== undefined ? status : (dev.uv_status === 1 ? 0 : 1);
        localStorage.setItem('local_devices', JSON.stringify(this.devices));
      }
    },

    async updateDevice(deviceId: number | string, updatedData: Partial<Device>) {
      const id = typeof deviceId === 'string' ? parseInt(deviceId, 10) : deviceId;
      const dev = this.devices.find(d => d.id === id || d.sn === deviceId);
      if (dev) {
        Object.assign(dev, updatedData);
        localStorage.setItem('local_devices', JSON.stringify(this.devices));
      }
      try {
        await axios.put(`/api/devices/${id}`, updatedData);
      } catch (err) {}
    },

    async deleteDevice(deviceId: number | string) {
      const id = typeof deviceId === 'string' ? parseInt(deviceId, 10) : deviceId;
      const index = this.devices.findIndex(d => d.id === id || d.sn === deviceId);
      if (index !== -1) {
        this.devices.splice(index, 1);
        this.overview.totalDevices = this.devices.length;
        this.overview.onlineDevices = this.devices.filter(d => d.status === 'ONLINE').length;
        localStorage.setItem('local_devices', JSON.stringify(this.devices));
      }
      try {
        await axios.delete(`/api/devices/${id}`);
      } catch (err) {}
    },

    async addDevice(newDevice: Partial<Device>) {
      const created: Device = {
        id: Date.now(),
        sn: newDevice.sn || `DEV-${Date.now()}`,
        name: newDevice.name || '新新增感控硬件设备',
        type: newDevice.type || 'WATER',
        clinic_id: 101,
        clinic_name: '示范总院口腔门诊部',
        location: newDevice.location || '诊室一',
        work_mode: 'NORMAL',
        status: 'ONLINE',
        uv_status: 1,
        filter_level: 100,
        uv_lamp_health: 100
      };

      this.devices.unshift(created);
      this.overview.totalDevices = this.devices.length;
      this.overview.onlineDevices = this.devices.filter(d => d.status === 'ONLINE').length;
      localStorage.setItem('local_devices', JSON.stringify(this.devices));

      try {
        await axios.post('/api/devices', newDevice);
      } catch (err) {}
    },

    initWebSocket() {
      if (this.socket) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      try {
        const ws = new WebSocket(wsUrl);
        this.socket = ws;

        ws.onopen = () => {
          this.wsConnected = true;
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'TELEMETRY' && data.deviceSn) {
              this.realtimeTelemetry[data.deviceSn] = data.data;
            }
          } catch (e) {}
        };

        ws.onerror = () => {
          this.wsConnected = false;
        };

        ws.onclose = () => {
          this.wsConnected = false;
          this.socket = null;
        };
      } catch (e) {
        this.wsConnected = false;
      }
    }
  }
});
