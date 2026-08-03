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
  { id: 1, sn: 'W-SYS-2026-01', name: '1号口腔椅位水源精准消毒机', type: 'WATER', clinic_id: 101, clinic_name: '示范总院口腔门诊部', location: '诊室一 牙椅01', work_mode: 'DEEP_CLEAN', status: 'ONLINE', uv_status: 1, filter_level: 88, uv_lamp_health: 94 },
  { id: 2, sn: 'W-SYS-2026-02', name: '2号口腔椅位水源精准消毒机', type: 'WATER', clinic_id: 101, clinic_name: '示范总院口腔门诊部', location: '诊室一 牙椅02', work_mode: 'DEEP_CLEAN', status: 'ONLINE', uv_status: 1, filter_level: 95, uv_lamp_health: 98 },
  { id: 3, sn: 'W-SYS-2026-03', name: '3号儿童诊室水路智能处理机', type: 'WATER', clinic_id: 101, clinic_name: '示范总院口腔门诊部', location: '诊室二 牙椅03', work_mode: 'NORMAL', status: 'ONLINE', uv_status: 1, filter_level: 91, uv_lamp_health: 92 },
  { id: 4, sn: 'W-SYS-2026-04', name: 'VIP特诊间高阶水路消毒终端', type: 'WATER', clinic_id: 101, clinic_name: '示范总院口腔门诊部', location: 'VIP套间 牙椅05', work_mode: 'ECO', status: 'ONLINE', uv_status: 1, filter_level: 86, uv_lamp_health: 90 },
  { id: 5, sn: 'W-SYS-2026-05', name: '5号种植专科水路无菌消毒站', type: 'WATER', clinic_id: 101, clinic_name: '示范总院口腔门诊部', location: '种植中心 牙椅08', work_mode: 'DEEP_CLEAN', status: 'ONLINE', uv_status: 1, filter_level: 94, uv_lamp_health: 97 },
  { id: 6, sn: 'W-SYS-2026-06', name: '6号正畸中心综合水路净化机', type: 'WATER', clinic_id: 101, clinic_name: '示范总院口腔门诊部', location: '正畸中心 牙椅10', work_mode: 'NORMAL', status: 'ONLINE', uv_status: 1, filter_level: 89, uv_lamp_health: 91 },
  { id: 7, sn: 'W-SYS-2026-07', name: '二楼牙体牙髓科水路处理终端', type: 'WATER', clinic_id: 101, clinic_name: '示范总院口腔门诊部', location: '二楼诊区 牙椅12', work_mode: 'NORMAL', status: 'ONLINE', uv_status: 1, filter_level: 92, uv_lamp_health: 95 },
  { id: 8, sn: 'W-SYS-2026-08', name: '消毒供应中心次氯酸水发生主站', type: 'WATER', clinic_id: 101, clinic_name: '示范总院口腔门诊部', location: '消毒供应室 主柜01', work_mode: 'DEEP_CLEAN', status: 'ONLINE', uv_status: 1, filter_level: 98, uv_lamp_health: 99 },
  { id: 9, sn: 'A-SYS-2026-01', name: '中央气源超净处理工作站', type: 'AIR', clinic_id: 101, clinic_name: '示范总院口腔门诊部', location: '主设备间 气源机组A', work_mode: 'NORMAL', status: 'ONLINE', uv_status: 1, filter_level: 78, uv_lamp_health: 85 },
  { id: 10, sn: 'A-SYS-2026-02', name: '种植手术室无菌气源站', type: 'AIR', clinic_id: 102, clinic_name: '示范分院', location: '分院 手术室01', work_mode: 'NORMAL', status: 'ONLINE', uv_status: 1, filter_level: 92, uv_lamp_health: 96 },
  { id: 11, sn: 'A-SYS-2026-03', name: '二楼正畸中心高洁净气源站', type: 'AIR', clinic_id: 101, clinic_name: '示范总院口腔门诊部', location: '二楼正畸中心 机组B', work_mode: 'ECO', status: 'ONLINE', uv_status: 1, filter_level: 89, uv_lamp_health: 93 },
  { id: 12, sn: 'A-SYS-2026-04', name: '牙科负压抽吸高效除菌处理站', type: 'AIR', clinic_id: 101, clinic_name: '示范总院口腔门诊部', location: '设备负压间 机组C', work_mode: 'DEEP_CLEAN', status: 'ONLINE', uv_status: 1, filter_level: 85, uv_lamp_health: 90 },
  { id: 13, sn: 'A-SYS-2026-05', name: '儿童牙科诊区舒适低噪气源站', type: 'AIR', clinic_id: 101, clinic_name: '示范总院口腔门诊部', location: '诊室二 气源分支02', work_mode: 'ECO', status: 'ONLINE', uv_status: 1, filter_level: 91, uv_lamp_health: 94 },
  { id: 14, sn: 'A-SYS-2026-06', name: 'VIP特诊中心高压无油无菌气源站', type: 'AIR', clinic_id: 101, clinic_name: '示范总院口腔门诊部', location: 'VIP层 气源主节点', work_mode: 'NORMAL', status: 'ONLINE', uv_status: 1, filter_level: 96, uv_lamp_health: 98 }
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
      socket: null as WebSocket | null,
      loading: false
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
      if (this.devices.length === 0) {
        this.loading = true;
      }
      try {
        const res = await axios.get('/api/devices');
        if (Array.isArray(res.data) && res.data.length > 0) {
          const serverSns = new Set(res.data.map((d: any) => d.sn));
          const localOnly = this.devices.filter(d => !serverSns.has(d.sn));
          this.devices = [...res.data, ...localOnly];
          localStorage.setItem('local_devices', JSON.stringify(this.devices));
        } else if (this.devices.length === 0 || force) {
          const saved = localStorage.getItem('local_devices');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                this.devices = parsed;
                return;
              }
            } catch (e) {}
          }
          this.devices = defaultFallbackDevices;
          localStorage.setItem('local_devices', JSON.stringify(this.devices));
        }
      } catch (err) {
        const saved = localStorage.getItem('local_devices');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              this.devices = parsed;
              return;
            }
          } catch (e) {}
        }
        if (this.devices.length === 0 || force) {
          this.devices = defaultFallbackDevices;
        }
      } finally {
        this.loading = false;
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

    resolveAlarm(id: number) {
      try {
        const localMap = localStorage.getItem('local_resolved_alarm_ids');
        const resolvedIds = localMap ? JSON.parse(localMap) : {};
        resolvedIds[id] = true;
        localStorage.setItem('local_resolved_alarm_ids', JSON.stringify(resolvedIds));

        const initialUnresolved = [101, 102, 104];
        const remaining = initialUnresolved.filter(aId => !resolvedIds[aId]).length;
        this.overview.unresolvedAlarms = Math.max(0, remaining);
        this.overview.activeAlarmsCount = Math.max(0, remaining);
      } catch (e) {}
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
