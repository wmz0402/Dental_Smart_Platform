<template>
  <div class="air-device-view">
    <div class="glass-card page-header flex-between mb-24">
      <div>
        <h2>气源洁净处理系统管控</h2>
        <p class="subtitle">实时监测压力、露点温度与无菌净化指标，确保符合 WS/T 842-2024 规范</p>
      </div>
      <div class="flex-align gap-12">
        <el-button type="success" @click="showAddDialog = true">添加气源硬件设备</el-button>
        <el-button type="primary" @click="deviceStore.fetchDevices(true)">刷新设备状态</el-button>
      </div>
    </div>

    <!-- 气源设备卡片网格 -->
    <div class="device-grid">
      <div v-for="dev in airDevices" :key="dev.id" class="glass-card device-card">
        <div class="card-top flex-between">
          <div class="dev-title-box">
            <span class="status-indicator" :class="dev.status.toLowerCase()"></span>
            <h4>{{ dev.name }}</h4>
          </div>
          <el-tag :type="dev.status === 'ONLINE' ? 'success' : 'info'">{{ dev.status }}</el-tag>
        </div>

        <div class="dev-sn">{{ dev.sn }} | {{ dev.location }}</div>

        <div class="metrics-grid mb-16">
          <div class="sub-metric">
            <span class="m-label">气源稳定压力</span>
            <span class="m-value text-cyan">{{ getTelemetry(dev.sn).pressure || 0.65 }} <small>MPa</small></span>
          </div>
          <div class="sub-metric">
            <span class="m-label">干燥露点温度</span>
            <span class="m-value text-green">{{ getTelemetry(dev.sn).dewPoint || -42.5 }} <small>°C</small></span>
          </div>
          <div class="sub-metric">
            <span class="m-label">实时供气流量</span>
            <span class="m-value">{{ getTelemetry(dev.sn).air_flow || 180 }} <small>L/min</small></span>
          </div>
          <div class="sub-metric">
            <span class="m-label">PM2.5尘埃颗粒</span>
            <span class="m-value">{{ getTelemetry(dev.sn).pm25 || 0.002 }} <small>mg/m³</small></span>
          </div>
        </div>

        <div class="progress-box mb-16">
          <div class="flex-between text-sub mb-4">
            <span>高效空气过滤网健康度</span>
            <span>{{ dev.filter_level }}%</span>
          </div>
          <el-progress :percentage="dev.filter_level" :status="dev.filter_level < 80 ? 'warning' : 'success'" :show-text="false" />
        </div>

        <div class="progress-box mb-20">
          <div class="flex-between text-sub mb-4">
            <span>干燥离心除水机寿命</span>
            <span>{{ dev.uv_lamp_health }}%</span>
          </div>
          <el-progress :percentage="dev.uv_lamp_health" status="success" :show-text="false" />
        </div>

        <div class="card-actions flex-between">
          <el-button
            type="primary"
            plain
            size="small"
            @click="toggleMode(dev.id, dev.work_mode)"
          >
            模式: {{ getModeLabel(dev.work_mode) }}
          </el-button>

          <el-button size="small" type="danger" plain @click="handleLock(dev)">
            切断锁止
          </el-button>
        </div>
      </div>
    </div>

    <!-- 添加气源设备对话框 -->
    <el-dialog v-model="showAddDialog" title="添加气源感控硬件设备" width="480px">
      <el-form label-position="top">
        <el-form-item label="设备编号 (SN)">
          <el-input v-model="newDevForm.sn" placeholder="如: A-SYS-2026-04" />
        </el-form-item>
        <el-form-item label="设备名称">
          <el-input v-model="newDevForm.name" placeholder="如: 4号修复中心气源净化机" />
        </el-form-item>
        <el-form-item label="部署具体位置">
          <el-input v-model="newDevForm.location" placeholder="如: 修复科 气源节点" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddDevice">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useDeviceStore, type Device } from '@/stores/deviceStore';
import { ElMessage, ElMessageBox } from 'element-plus';

const deviceStore = useDeviceStore();
const showAddDialog = ref(false);

const newDevForm = ref({
  sn: '',
  name: '',
  location: ''
});

// 默认气源设备兜底
const defaultAirDevices: Device[] = [
  { id: 5, sn: 'A-SYS-2026-01', name: '中央气源超净处理工作站', type: 'AIR', clinic_id: 101, location: '主设备间 气源机组A', work_mode: 'NORMAL', status: 'ONLINE', uv_status: 1, filter_level: 78, uv_lamp_health: 85 },
  { id: 6, sn: 'A-SYS-2026-02', name: '种植手术室无菌气源站', type: 'AIR', clinic_id: 102, location: '分院 手术室01', work_mode: 'NORMAL', status: 'ONLINE', uv_status: 1, filter_level: 92, uv_lamp_health: 96 },
  { id: 7, sn: 'A-SYS-2026-03', name: '二楼正畸中心高洁净气源站', type: 'AIR', clinic_id: 101, location: '二楼正畸中心 机组B', work_mode: 'ECO', status: 'ONLINE', uv_status: 1, filter_level: 89, uv_lamp_health: 93 }
];

const airDevices = computed(() => {
  const filtered = deviceStore.devices.filter(d => d.type === 'AIR');
  return filtered.length > 0 ? filtered : defaultAirDevices;
});

const getTelemetry = (sn: string) => {
  return deviceStore.realtimeTelemetry[sn] || {
    pressure: 0.65,
    dewPoint: -42.5,
    air_flow: 180,
    pm25: 0.002
  };
};

const getModeLabel = (mode: string) => {
  switch (mode) {
    case 'NORMAL': return '常规';
    case 'ECO': return '节能';
    case 'DEEP_CLEAN': return '深度处理';
    case 'OFF': return '关机';
    default: return mode;
  }
};

const toggleMode = (id: number, currentMode: string) => {
  const nextMode = currentMode === 'ECO' ? 'NORMAL' : 'ECO';
  deviceStore.changeWorkMode(id, nextMode);
  ElMessage.success(`运行模式已成功切换为: ${getModeLabel(nextMode)}`);
};

const handleLock = (dev: any) => {
  ElMessageBox.confirm(`确认切断锁止气源设备 ${dev.name} 吗？`, '安全警示', {
    confirmButtonText: '确认锁止',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    deviceStore.changeWorkMode(dev.id, 'OFF');
    ElMessage.success('气源设备已关机锁止');
  }).catch(() => {});
};

const handleAddDevice = () => {
  if (!newDevForm.value.name || !newDevForm.value.sn) {
    return ElMessage.error('请填写完整设备编号与名称');
  }
  deviceStore.addDevice({
    ...newDevForm.value,
    type: 'AIR'
  });
  ElMessage.success('新气源硬件设备添加成功');
  showAddDialog.value = false;
  newDevForm.value = { sn: '', name: '', location: '' };
};

onMounted(() => {
  deviceStore.fetchDevices();
});
</script>

<style scoped>
.air-device-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  padding: 24px;
}

.page-header h2 {
  font-size: 20px;
  color: var(--text-main);
  font-weight: 700;
}

.subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.device-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.device-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.dev-title-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dev-title-box h4 {
  font-size: 15px;
  color: var(--text-main);
  font-weight: 600;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-indicator.online {
  background-color: #10b981;
  box-shadow: 0 0 8px #10b981;
}

.dev-sn {
  font-size: 12px;
  color: #64748b;
  margin: 6px 0 16px 0;
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  background: rgba(30, 41, 59, 0.4);
  padding: 12px;
  border-radius: 8px;
}

.sub-metric {
  display: flex;
  flex-direction: column;
}

.m-label {
  font-size: 11px;
  color: #94a3b8;
}

.m-value {
  font-size: 16px;
  font-weight: 700;
  color: #f8fafc;
  margin-top: 2px;
}

.m-value small {
  font-size: 10px;
  font-weight: 400;
  color: #64748b;
}

.text-cyan { color: #38bdf8 !important; }
.text-green { color: #10b981 !important; }

.text-sub {
  font-size: 12px;
  color: #94a3b8;
}

.mb-4 { margin-bottom: 4px; }
.mb-16 { margin-bottom: 16px; }
.mb-20 { margin-bottom: 20px; }
.mb-24 { margin-bottom: 24px; }
.gap-12 { gap: 12px; }
</style>
