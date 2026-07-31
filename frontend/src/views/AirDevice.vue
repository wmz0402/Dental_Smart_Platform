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
        <div class="card-top flex-between align-start">
          <div class="dev-title-box">
            <span class="status-indicator" :class="dev.status.toLowerCase()"></span>
            <h4>{{ dev.name }}</h4>
          </div>
          <div class="flex-align gap-8 flex-shrink-0">
            <el-tag :type="dev.status === 'ONLINE' ? 'success' : (dev.status === 'MAINTENANCE' ? 'warning' : 'info')" size="small">{{ dev.status }}</el-tag>
            <!-- 管理员专属编辑与删除功能按钮组 -->
            <template v-if="userStore.isAdmin">
              <el-tooltip content="管理员编辑设备信息" placement="top">
                <el-button circle size="small" type="primary" plain @click="openEditDialog(dev)">
                  <el-icon><Edit /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="管理员删除该设备" placement="top">
                <el-button circle size="small" type="danger" plain @click="handleDeleteDevice(dev)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </el-tooltip>
            </template>
          </div>
        </div>

        <div class="dev-sn">
          <span class="sn-code">{{ dev.sn }}</span>
          <span class="sn-divider">|</span>
          <span class="loc-text">{{ dev.location }}</span>
        </div>

        <div class="metrics-grid mb-18">
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
            <span class="m-label">PM2.5 尘埃颗粒</span>
            <span class="m-value">{{ getTelemetry(dev.sn).pm25 || 0.002 }} <small>mg/m³</small></span>
          </div>
        </div>

        <div class="progress-box mb-14">
          <div class="flex-between text-sub mb-6">
            <span>高效空气过滤网健康度</span>
            <span class="val-bold">{{ dev.filter_level }}%</span>
          </div>
          <el-progress :percentage="dev.filter_level" :stroke-width="8" :status="dev.filter_level < 80 ? 'warning' : 'success'" :show-text="false" />
        </div>

        <div class="progress-box mb-20">
          <div class="flex-between text-sub mb-6">
            <span>干燥离心除水机寿命</span>
            <span class="val-bold">{{ dev.uv_lamp_health }}%</span>
          </div>
          <el-progress :percentage="dev.uv_lamp_health" :stroke-width="8" status="success" :show-text="false" />
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

    <!-- 管理员编辑设备对话框 -->
    <el-dialog v-model="showEditDialog" title="管理员修改编辑气源硬件设备" width="500px">
      <el-form label-position="top">
        <el-form-item label="设备名称">
          <el-input v-model="editDevForm.name" placeholder="请输入新的设备名称" />
        </el-form-item>
        <el-form-item label="设备编号 (SN)">
          <el-input v-model="editDevForm.sn" placeholder="请输入设备 SN" />
        </el-form-item>
        <el-form-item label="部署位置">
          <el-input v-model="editDevForm.location" placeholder="请输入具体位置" />
        </el-form-item>
        <el-form-item label="工作模式">
          <el-select v-model="editDevForm.work_mode" style="width: 100%">
            <el-option label="常规巡检模式" value="NORMAL" />
            <el-option label="绿色节能模式" value="ECO" />
            <el-option label="深度处理消毒" value="DEEP_CLEAN" />
            <el-option label="关机休眠" value="OFF" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备状态">
          <el-select v-model="editDevForm.status" style="width: 100%">
            <el-option label="ONLINE (正常在线)" value="ONLINE" />
            <el-option label="MAINTENANCE (维保检修中)" value="MAINTENANCE" />
            <el-option label="OFFLINE (已关机离线)" value="OFFLINE" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveEdit">保存修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useDeviceStore, type Device } from '@/stores/deviceStore';
import { useUserStore } from '@/stores/userStore';
import { Edit, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const deviceStore = useDeviceStore();
const userStore = useUserStore();
const showAddDialog = ref(false);
const showEditDialog = ref(false);

const newDevForm = ref({
  sn: '',
  name: '',
  location: ''
});

const editDevForm = ref<{
  id: number | string;
  sn: string;
  name: string;
  location: string;
  work_mode: 'NORMAL' | 'ECO' | 'DEEP_CLEAN' | 'OFF';
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
}>({
  id: '',
  sn: '',
  name: '',
  location: '',
  work_mode: 'NORMAL',
  status: 'ONLINE'
});

// 默认气源设备兜底
const defaultAirDevices: Device[] = [
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

const openEditDialog = (dev: Device) => {
  editDevForm.value = {
    id: dev.id,
    sn: dev.sn,
    name: dev.name,
    location: dev.location,
    work_mode: dev.work_mode,
    status: dev.status
  };
  showEditDialog.value = true;
};

const handleSaveEdit = async () => {
  if (!editDevForm.value.name || !editDevForm.value.sn) {
    return ElMessage.error('设备名称与 SN 编号不能为空');
  }
  await deviceStore.updateDevice(editDevForm.value.id, editDevForm.value as any);
  ElMessage.success('管理员修改气源设备信息成功');
  showEditDialog.value = false;
};

const handleDeleteDevice = (dev: Device) => {
  ElMessageBox.confirm(
    `确认要彻底删除气源设备【${dev.name}】(${dev.sn}) 吗？此操作将同步从云数据库中移除该设备，且无法撤销！`,
    '管理员删除设备确认',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    await deviceStore.deleteDevice(dev.id);
    ElMessage.success(`气源设备【${dev.name}】已成功删除`);
  }).catch(() => {});
};

onMounted(() => {
  deviceStore.loading = false;
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
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 22px;
}

.device-card {
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
}

.align-start {
  align-items: flex-start;
}

.dev-title-box {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.dev-title-box h4 {
  font-size: 15px;
  color: var(--text-main);
  font-weight: 700;
  line-height: 1.4;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-indicator.online {
  background-color: #10b981;
  box-shadow: 0 0 8px #10b981;
}

.dev-sn {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 10px 0 18px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sn-code {
  font-family: monospace;
  color: #94a3b8;
}

.sn-divider {
  color: rgba(148, 163, 184, 0.4);
}

.loc-text {
  color: #cbd5e1;
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(56, 189, 248, 0.15);
  padding: 14px 16px;
  border-radius: 10px;
}

.sub-metric {
  display: flex;
  flex-direction: column;
}

.m-label {
  font-size: 11px;
  color: #94a3b8;
  margin-bottom: 3px;
}

.m-value {
  font-size: 17px;
  font-weight: 700;
  color: #f8fafc;
}

.m-value small {
  font-size: 11px;
  font-weight: 400;
  color: #94a3b8;
  margin-left: 2px;
}

.text-cyan { color: #38bdf8 !important; }
.text-green { color: #10b981 !important; }

.text-sub {
  font-size: 12px;
  color: #94a3b8;
}

.val-bold {
  font-weight: 600;
  color: #f8fafc;
}

.mb-6 { margin-bottom: 6px; }
.mb-14 { margin-bottom: 14px; }
.mb-18 { margin-bottom: 18px; }
.mb-20 { margin-bottom: 20px; }
.mb-24 { margin-bottom: 24px; }
.gap-8 { gap: 8px; }
.gap-12 { gap: 12px; }
.flex-shrink-0 { flex-shrink: 0; }

.card-actions {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid rgba(56, 189, 248, 0.12);
}
</style>
