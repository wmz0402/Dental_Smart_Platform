<template>
  <div class="water-device-view">
    <div class="glass-card page-header flex-between mb-24">
      <div>
        <h2>水源消毒处理系统管控</h2>
        <p class="subtitle">解决牙科椅供水生物膜与细菌污染问题，确保消毒杀灭率≥99.99%</p>
      </div>
      <div class="flex-align gap-12">
        <el-button type="success" @click="showAddDialog = true">添加水源硬件设备</el-button>
        <el-button type="primary" @click="deviceStore.fetchDevices(true)">刷新设备状态</el-button>
      </div>
    </div>

    <!-- 水源设备卡片网格 -->
    <div class="device-grid">
      <div v-for="dev in waterDevices" :key="dev.id" class="glass-card device-card">
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
            <span class="m-label">水质TDS</span>
            <span class="m-value text-cyan">{{ getTelemetry(dev.sn).tdsVal || 14.2 }} <small>ppm</small></span>
          </div>
          <div class="sub-metric">
            <span class="m-label">水质浊度</span>
            <span class="m-value">{{ getTelemetry(dev.sn).turbidity || 0.12 }} <small>NTU</small></span>
          </div>
          <div class="sub-metric">
            <span class="m-label">实时水流</span>
            <span class="m-value">{{ getTelemetry(dev.sn).flowRate || 1.2 }} <small>L/min</small></span>
          </div>
          <div class="sub-metric">
            <span class="m-label">紫外灭菌强度</span>
            <span class="m-value text-green">{{ getTelemetry(dev.sn).uvIntensity || 98.5 }}%</span>
          </div>
        </div>

        <div class="progress-box mb-16">
          <div class="flex-between text-sub mb-4">
            <span>滤芯生命周期</span>
            <span>{{ dev.filter_level }}%</span>
          </div>
          <el-progress :percentage="dev.filter_level" :status="dev.filter_level < 80 ? 'warning' : 'success'" :show-text="false" />
        </div>

        <div class="progress-box mb-20">
          <div class="flex-between text-sub mb-4">
            <span>UV灯管衰减度</span>
            <span>{{ dev.uv_lamp_health }}%</span>
          </div>
          <el-progress :percentage="dev.uv_lamp_health" status="success" :show-text="false" />
        </div>

        <div class="card-actions flex-between">
          <el-button
            :type="dev.uv_status === 1 ? 'warning' : 'success'"
            plain
            size="small"
            @click="deviceStore.toggleUv(dev.id)"
          >
            {{ dev.uv_status === 1 ? '关闭UV杀菌灯' : '开启UV杀菌灯' }}
          </el-button>

          <el-dropdown trigger="click" @command="(cmd: string) => changeMode(dev.id, cmd)">
            <el-button size="small" type="primary">
              运行模式: {{ getModeLabel(dev.work_mode) }}
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="NORMAL">常规巡检模式</el-dropdown-item>
                <el-dropdown-item command="ECO">绿色节能模式</el-dropdown-item>
                <el-dropdown-item command="DEEP_CLEAN">深度冲洗消毒</el-dropdown-item>
                <el-dropdown-item command="OFF">关机休眠</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- 添加水源设备对话框 -->
    <el-dialog v-model="showAddDialog" title="添加水源感控硬件设备" width="480px">
      <el-form label-position="top">
        <el-form-item label="设备编号 (SN)">
          <el-input v-model="newDevForm.sn" placeholder="如: W-SYS-2026-05" />
        </el-form-item>
        <el-form-item label="设备名称">
          <el-input v-model="newDevForm.name" placeholder="如: 5号诊室水路消毒机" />
        </el-form-item>
        <el-form-item label="部署具体位置">
          <el-input v-model="newDevForm.location" placeholder="如: 诊室三 牙椅06" />
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
import { ArrowDown } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const deviceStore = useDeviceStore();
const showAddDialog = ref(false);

const newDevForm = ref({
  sn: '',
  name: '',
  location: ''
});

// 默认水源设备兜底
const defaultWaterDevices: Device[] = [
  { id: 1, sn: 'W-SYS-2026-01', name: '1号口腔椅位水源精准消毒机', type: 'WATER', clinic_id: 101, location: '诊室一 牙椅01', work_mode: 'DEEP_CLEAN', status: 'ONLINE', uv_status: 1, filter_level: 88, uv_lamp_health: 94 },
  { id: 2, sn: 'W-SYS-2026-02', name: '2号口腔椅位水源精准消毒机', type: 'WATER', clinic_id: 101, location: '诊室一 牙椅02', work_mode: 'DEEP_CLEAN', status: 'ONLINE', uv_status: 1, filter_level: 95, uv_lamp_health: 98 },
  { id: 3, sn: 'W-SYS-2026-03', name: '3号儿童诊室水路智能处理机', type: 'WATER', clinic_id: 101, location: '诊室二 牙椅03', work_mode: 'NORMAL', status: 'ONLINE', uv_status: 1, filter_level: 91, uv_lamp_health: 92 },
  { id: 4, sn: 'W-SYS-2026-04', name: 'VIP特诊间高阶水路消毒终端', type: 'WATER', clinic_id: 101, location: 'VIP套间 牙椅05', work_mode: 'ECO', status: 'ONLINE', uv_status: 1, filter_level: 86, uv_lamp_health: 90 }
];

const waterDevices = computed(() => {
  const filtered = deviceStore.devices.filter(d => d.type === 'WATER');
  return filtered.length > 0 ? filtered : defaultWaterDevices;
});

const getTelemetry = (sn: string) => {
  return deviceStore.realtimeTelemetry[sn] || {
    tdsVal: 14.2,
    turbidity: 0.12,
    flowRate: 1.2,
    uvIntensity: 98.5
  };
};

const getModeLabel = (mode: string) => {
  switch (mode) {
    case 'NORMAL': return '常规';
    case 'ECO': return '节能';
    case 'DEEP_CLEAN': return '深度消毒';
    case 'OFF': return '关机';
    default: return mode;
  }
};

const changeMode = (id: number, mode: string) => {
  deviceStore.changeWorkMode(id, mode);
  ElMessage.success('设备运行模式更新成功');
};

const handleAddDevice = () => {
  if (!newDevForm.value.name || !newDevForm.value.sn) {
    return ElMessage.error('请填写完整设备编号与名称');
  }
  deviceStore.addDevice({
    ...newDevForm.value,
    type: 'WATER'
  });
  ElMessage.success('新水源感控设备添加成功');
  showAddDialog.value = false;
  newDevForm.value = { sn: '', name: '', location: '' };
};

onMounted(() => {
  deviceStore.fetchDevices();
});
</script>

<style scoped>
.water-device-view {
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
