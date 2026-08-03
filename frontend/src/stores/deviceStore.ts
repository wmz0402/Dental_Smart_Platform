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

export interface AlarmItem {
  id: number;
  device_sn: string;
  title: string;
  description: string;
  level: 'CRITICAL' | 'WARNING';
  status: 'UNRESOLVED' | 'RESOLVED';
  triggered_at: string;
}

export interface ConsumableItem {
  id: number;
  device_sn: string;
  item_name: string;
  life_remaining: number;
  estimated_replace_date: string;
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

const defaultFallbackAlarms: AlarmItem[] = [
  {
    id: 101,
    device_sn: 'W-SYS-2026-01',
    title: '紫外线杀菌辐射强度严重衰减',
    description: 'AI算法对比光谱与辐射强度遥测，检测到紫外灯管输出效率较出厂基准下降超 85%，存在微生物超标风险，建议立即更换配件',
    level: 'CRITICAL',
    status: 'UNRESOLVED',
    triggered_at: '2026-07-30 17:15:32'
  },
  {
    id: 102,
    device_sn: 'W-SYS-2026-01',
    title: 'PP棉/超滤膜滤芯接近堵塞临界点',
    description: 'AI预警模型计算压差上升趋势，结合水流量递减曲线评估，预计在 72 小时内发生反冲洗失效',
    level: 'WARNING',
    status: 'UNRESOLVED',
    triggered_at: '2026-07-30 16:40:10'
  },
  {
    id: 103,
    device_sn: 'A-SYS-2026-01',
    title: '气源露点温度发生微幅漂移',
    description: '检测到吸附干燥罐效能微幅下降，露点温度由 -42°C 升至 -35°C，建议安排预警性再生保养',
    level: 'WARNING',
    status: 'RESOLVED',
    triggered_at: '2026-07-30 14:22:05'
  },
  {
    id: 104,
    device_sn: 'W-SYS-2026-03',
    title: '出水TDS溶解性固体指标突增',
    description: '监测到水质TDS值瞬间突破 45 ppm（正常范畴 <15 ppm），系统已自动开启深度消毒与备用旁路',
    level: 'CRITICAL',
    status: 'UNRESOLVED',
    triggered_at: '2026-07-30 12:05:48'
  },
  {
    id: 105,
    device_sn: 'A-SYS-2026-02',
    title: 'HEPA高效过滤器气阻增加',
    description: '种植手术室气源前置初效过滤器阻力增加 24%，AI耗材衰减模型评估建议于本周内完成替换',
    level: 'WARNING',
    status: 'RESOLVED',
    triggered_at: '2026-07-30 09:12:15'
  }
];

const defaultFallbackConsumables: ConsumableItem[] = [
  { id: 1, device_sn: 'W-SYS-2026-01', item_name: '1号牙椅水路超滤膜滤芯', life_remaining: 12, estimated_replace_date: '2026-08-05' },
  { id: 2, device_sn: 'W-SYS-2026-01', item_name: 'UV紫外线杀菌灯管(254nm)', life_remaining: 6, estimated_replace_date: '2026-08-02' },
  { id: 3, device_sn: 'A-SYS-2026-01', item_name: '中央气源精密除水除油滤芯', life_remaining: 35, estimated_replace_date: '2026-09-10' },
  { id: 4, device_sn: 'A-SYS-2026-02', item_name: '正畸中心无菌气源HEPA过滤器', life_remaining: 78, estimated_replace_date: '2026-11-20' },
  { id: 5, device_sn: 'W-SYS-2026-04', item_name: 'VIP特诊间高阶反渗透膜组', life_remaining: 92, estimated_replace_date: '2026-12-30' }
];

export const useDeviceStore = defineStore('device', {
  state: () => {
    const savedDev = localStorage.getItem('local_devices');
    let initDevices = defaultFallbackDevices as Device[];
    if (savedDev) {
      try {
        const parsed = JSON.parse(savedDev);
        if (Array.isArray(parsed) && parsed.length > 0) {
          initDevices = parsed;
        }
      } catch (e) {}
    }

    const savedAlarms = localStorage.getItem('persistent_alarms');
    let initAlarms = defaultFallbackAlarms;
    if (savedAlarms) {
      try {
        const parsedA = JSON.parse(savedAlarms);
        if (Array.isArray(parsedA) && parsedA.length > 0) {
          initAlarms = parsedA;
        }
      } catch (e) {}
    }

    const activeCount = initAlarms.filter(a => a.status === 'UNRESOLVED').length;

    return {
      devices: initDevices,
      alarms: initAlarms,
      consumables: defaultFallbackConsumables,
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
        activeAlarmsCount: activeCount,
        unresolvedAlarms: activeCount
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
        const unresolved = this.alarms.filter(a => a.status === 'UNRESOLVED').length;
        this.overview.activeAlarmsCount = unresolved;
        this.overview.unresolvedAlarms = unresolved;
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
        }
      } catch (err) {
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
      const item = this.alarms.find(a => a.id === id);
      if (item) {
        item.status = 'RESOLVED';
      }
      const unresolvedCount = this.alarms.filter(a => a.status === 'UNRESOLVED').length;
      this.overview.activeAlarmsCount = unresolvedCount;
      this.overview.unresolvedAlarms = unresolvedCount;
      localStorage.setItem('persistent_alarms', JSON.stringify(this.alarms));
    },

    async fetchAlarms() {
      try {
        const res = await axios.get('/api/alarms');
        if (Array.isArray(res.data) && res.data.length > 0) {
          const localMap = localStorage.getItem('persistent_alarms');
          if (localMap) {
            const parsed = JSON.parse(localMap);
            const resolvedSet = new Set(parsed.filter((a: any) => a.status === 'RESOLVED').map((a: any) => a.id));
            this.alarms = res.data.map((item: any) => {
              if (resolvedSet.has(item.id)) {
                return { ...item, status: 'RESOLVED' };
              }
              return item;
            });
          } else {
            this.alarms = res.data;
          }
          const unresolved = this.alarms.filter(a => a.status === 'UNRESOLVED').length;
          this.overview.activeAlarmsCount = unresolved;
          this.overview.unresolvedAlarms = unresolved;
          localStorage.setItem('persistent_alarms', JSON.stringify(this.alarms));
        }
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
