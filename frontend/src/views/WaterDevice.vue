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
            <span class="m-label">水质 TDS 溶解物</span>
            <span class="m-value text-cyan">{{ getTelemetry(dev.sn).tdsVal || 14.2 }} <small>ppm</small></span>
          </div>
          <div class="sub-metric">
            <span class="m-label">水质实时浊度</span>
            <span class="m-value">{{ getTelemetry(dev.sn).turbidity || 0.12 }} <small>NTU</small></span>
          </div>
          <div class="sub-metric">
            <span class="m-label">实时供水流量</span>
            <span class="m-value">{{ getTelemetry(dev.sn).flowRate || 1.2 }} <small>L/min</small></span>
          </div>
          <div class="sub-metric">
            <span class="m-label">紫外杀菌强度</span>
            <span class="m-value text-green">{{ getTelemetry(dev.sn).uvIntensity || 98.5 }}%</span>
          </div>
        </div>

        <div class="progress-box mb-14">
          <div class="flex-between text-sub mb-6">
            <span>滤芯生命周期健康度</span>
            <span class="val-bold">{{ dev.filter_level }}%</span>
          </div>
          <el-progress :percentage="dev.filter_level" :stroke-width="8" :status="dev.filter_level < 80 ? 'warning' : 'success'" :show-text="false" />
        </div>

        <div class="progress-box mb-20">
          <div class="flex-between text-sub mb-6">
            <span>UV 杀菌灯管衰减余量</span>
            <span class="val-bold">{{ dev.uv_lamp_health }}%</span>
          </div>
          <el-progress :percentage="dev.uv_lamp_health" :stroke-width="8" status="success" :show-text="false" />
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
            <el-button size="small" type="primary" plain>
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

    <!-- 管理员编辑设备对话框 -->
    <el-dialog v-model="showEditDialog" title="管理员修改编辑感控设备" width="500px">
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
            <el-option label="深度冲洗消毒" value="DEEP_CLEAN" />
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
import { ref, computed, onMounted } from 'vue';
import { useDeviceStore, type Device } from '@/stores/deviceStore';
import { useUserStore } from '@/stores/userStore';
import { usePageLoading } from '@/composables/usePageLoading';
import { ArrowDown, Edit, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const deviceStore = useDeviceStore();
const userStore = useUserStore();
const { withLoading } = usePageLoading();
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

// 默认水源设备兜底
const defaultWaterDevices: Device[] = [
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
  { id: 14, sn: 'W-SYS-2026-14', name: '技工室印模清洗消毒水路专机', type: 'WATER', clinic_id: 101, location: '技工中心 消毒台02', work_mode: 'DEEP_CLEAN', status: 'ONLINE', uv_status: 1, filter_level: 95, uv_lamp_health: 97 }
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
  ElMessage.success('管理员修改设备信息成功');
  showEditDialog.value = false;
};

const handleDeleteDevice = (dev: Device) => {
  ElMessageBox.confirm(
    `确认要彻底删除硬件设备【${dev.name}】(${dev.sn}) 吗？此操作将同步从云数据库中移除该设备，且无法撤销！`,
    '管理员删除设备确认',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    await deviceStore.deleteDevice(dev.id);
    ElMessage.success(`设备【${dev.name}】已成功删除`);
  }).catch(() => {});
};

onMounted(async () => {
  // 已有数据时跳过 loading；否则走完整加载流程，确保所有设备卡片渲染完毕才关 loading
  await withLoading(
    [() => deviceStore.fetchDevices()],
    () => deviceStore.devices.length > 0
  );
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

@media (max-width: 767.98px) {
  .water-device-view {
    gap: 14px;
  }
  .page-header {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 14px !important;
  }
  .page-header > div:last-child {
    width: 100%;
    display: flex;
    gap: 8px;
  }
  .page-header > div:last-child .el-button {
    flex: 1;
    margin: 0 !important;
    padding: 8px 10px;
    font-size: 12px;
  }
  .device-grid {
    grid-template-columns: 1fr !important;
  }
  .metrics-grid {
    grid-template-columns: 1fr 1fr !important;
  }
}
</style>
