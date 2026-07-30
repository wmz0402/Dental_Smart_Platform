<template>
  <div class="air-device-page">
    <div class="header-action">
      <div class="page-title">
        <h2>气源洁净处理系统管控</h2>
        <span>四级高效过滤与除湿干燥，消除油雾、粉尘与细菌飞沫，气体杀灭率≥99%</span>
      </div>
      <div class="btn-group">
        <el-button
          v-if="userStore.isAdmin"
          type="success"
          @click="showAddDialog = true"
        >
          添加气源硬件设备
        </el-button>
        <el-button type="primary" @click="refreshList">刷新设备状态</el-button>
      </div>
    </div>

    <!-- 普通用户只读提示 -->
    <el-alert
      v-if="!userStore.isAdmin"
      title="您当前为【普通用户】权限，气体控制与强切锁止按钮已被锁止，如需操作请联系超级管理员。"
      type="info"
      show-icon
      :closable="false"
      style="margin-bottom: 16px;"
    />

    <div class="air-grid">
      <div
        v-for="item in airDevices"
        :key="item.sn"
        class="glass-card air-card"
      >
        <div class="card-top">
          <div class="dev-info">
            <span class="sn-badge">{{ item.sn }}</span>
            <h3>{{ item.name }}</h3>
            <span class="loc-text">{{ item.location }}</span>
          </div>
          <el-tag :type="item.status === 'ONLINE' ? 'success' : 'danger'" effect="dark">
            {{ item.status === 'ONLINE' ? '在线运行中' : '离线' }}
          </el-tag>
        </div>

        <div class="telemetry-box">
          <div class="metric-item">
            <span class="label">压缩空气压力</span>
            <span class="value text-amber">
              {{ store.realtimeTelemetry[item.sn]?.pressure || 0.65 }} <small>MPa</small>
            </span>
          </div>
          <div class="metric-item">
            <span class="label">干燥露点温度</span>
            <span class="value text-emerald">
              {{ store.realtimeTelemetry[item.sn]?.dewPoint || -43.2 }} <small>℃</small>
            </span>
          </div>
          <div class="metric-item">
            <span class="label">尘埃颗粒(PM2.5)</span>
            <span class="value text-cyan">
              {{ store.realtimeTelemetry[item.sn]?.pm25 || 1.8 }} <small>μg/m³</small>
            </span>
          </div>
          <div class="metric-item">
            <span class="label">气体杀灭效率</span>
            <span class="value text-emerald">99.85 <small>%</small></span>
          </div>
        </div>

        <div class="filter-stage-box">
          <span class="stage-title">四级净化过滤网状态链：</span>
          <div class="stage-grid">
            <div class="stage-item">
              <span>初效预过滤</span>
              <el-tag size="small" type="success">正常 (92%)</el-tag>
            </div>
            <div class="stage-item">
              <span>油雾拦截模组</span>
              <el-tag size="small" type="success">正常 (89%)</el-tag>
            </div>
            <div class="stage-item">
              <span>ULPA超精滤</span>
              <el-tag size="small" type="success">正常 ({{ item.filter_level }}%)</el-tag>
            </div>
            <div class="stage-item">
              <span>活性炭吸附床</span>
              <el-tag size="small" type="success">正常 (95%)</el-tag>
            </div>
          </div>
        </div>

        <div class="control-area">
          <div class="ctrl-row">
            <span>气源供应工作模式</span>
            <el-radio-group
              :disabled="!userStore.isAdmin"
              :model-value="item.work_mode"
              size="small"
              @change="(val: any) => handleModeChange(item.sn, val)"
            >
              <el-radio-button label="NORMAL">标准运行</el-radio-button>
              <el-radio-button label="ECO">绿色节能</el-radio-button>
              <el-radio-button label="OFF">停止供气</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <div class="card-bottom">
          <div class="health-info">
            <span>滤芯综合剩余健康度: {{ item.filter_level }}%</span>
            <el-progress :percentage="item.filter_level" :color="getProgressColor(item.filter_level)" />
          </div>
          <el-button
            :disabled="!userStore.isAdmin"
            type="danger"
            plain
            size="small"
            @click="handleEmergencyCutoff(item.sn)"
          >
            气路紧急切断
          </el-button>
        </div>
      </div>
    </div>

    <!-- 添加设备弹窗 (限超级管理员) -->
    <el-dialog v-model="showAddDialog" title="添加新气源洁净处理设备" width="500px">
      <el-form label-position="top">
        <el-form-item label="设备 SN 序列编号">
          <el-input v-model="newDevice.sn" placeholder="例: A-SYS-2026-03" />
        </el-form-item>
        <el-form-item label="设备名称">
          <el-input v-model="newDevice.name" placeholder="例: 种植中心高洁净无菌气源站" />
        </el-form-item>
        <el-form-item label="部署具体位置">
          <el-input v-model="newDevice.location" placeholder="例: 设备主间 气源机组B" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="submitAddDevice">确认添加并接入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useDeviceStore } from '@/stores/deviceStore';
import { useUserStore } from '@/stores/userStore';
import axios from 'axios';
import { ElMessage } from 'element-plus';

const store = useDeviceStore();
const userStore = useUserStore();

const showAddDialog = ref(false);
const newDevice = ref({
  sn: `A-SYS-2026-0${Math.floor(Math.random() * 90 + 10)}`,
  name: '',
  location: '设备主间 气源机组B'
});

const airDevices = computed(() => {
  return store.devices.filter((d) => d.type === 'AIR');
});

const refreshList = () => {
  store.fetchDevices('AIR');
};

const handleModeChange = async (sn: string, mode: string) => {
  await store.changeWorkMode(sn, mode);
  ElMessage.success(`设备 ${sn} 气源工作模式已设定为 ${mode}`);
};

const handleEmergencyCutoff = async (sn: string) => {
  await store.changeWorkMode(sn, 'OFF');
  ElMessage.warning(`安全警报：设备 ${sn} 气压已安全切断止回`);
};

const submitAddDevice = async () => {
  if (!newDevice.value.name) {
    return ElMessage.error('设备名称不能为空');
  }
  try {
    await axios.post('/api/devices', {
      sn: newDevice.value.sn,
      name: newDevice.value.name,
      type: 'AIR',
      location: newDevice.value.location,
      workMode: 'NORMAL'
    });
    ElMessage.success('气源洁净设备添加成功！');
    showAddDialog.value = false;
    store.fetchDevices();
  } catch (e) {
    ElMessage.error('添加失败');
  }
};

const getProgressColor = (val: number) => {
  if (val > 60) return '#10b981';
  if (val > 30) return '#f59e0b';
  return '#ef4444';
};

onMounted(() => {
  store.fetchDevices('AIR');
});
</script>

<style scoped>
.air-device-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title h2 {
  font-size: 20px;
  color: var(--text-main);
  font-weight: 700;
}

.page-title span {
  font-size: 13px;
  color: var(--text-muted);
}

.btn-group {
  display: flex;
  gap: 12px;
}

.air-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
  gap: 20px;
}

.air-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.sn-badge {
  font-family: monospace;
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.dev-info h3 {
  font-size: 16px;
  color: var(--text-main);
  margin: 4px 0;
}

.loc-text {
  font-size: 12px;
  color: var(--text-muted);
}

.telemetry-box {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  background: var(--bg-dark);
  padding: 12px;
  border-radius: 8px;
}

.metric-item {
  display: flex;
  flex-direction: column;
}

.metric-item .label {
  font-size: 11px;
  color: var(--text-muted);
}

.metric-item .value {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
}

.metric-item .value small {
  font-size: 10px;
  color: var(--text-muted);
}

.text-amber { color: #f59e0b; }
.text-cyan { color: #38bdf8; }
.text-emerald { color: #10b981; }

.filter-stage-box {
  background: var(--card-bg);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--card-border);
}

.stage-title {
  font-size: 12px;
  color: var(--text-muted);
  display: block;
  margin-bottom: 8px;
}

.stage-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.stage-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-main);
}

.control-area {
  border-top: 1px solid var(--card-border);
  border-bottom: 1px solid var(--card-border);
  padding: 12px 0;
}

.ctrl-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--text-muted);
}

.card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.health-info {
  width: 60%;
  font-size: 12px;
  color: var(--text-muted);
}
</style>
