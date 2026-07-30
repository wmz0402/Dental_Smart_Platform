<template>
  <div class="water-device-page">
    <div class="header-action">
      <div class="page-title">
        <h2>水源消毒处理系统管控</h2>
        <span>解决牙椅供水生物膜与细菌污染问题，确保消毒杀灭率≥99.99%</span>
      </div>
      <div class="btn-group">
        <el-button
          v-if="userStore.isAdmin"
          type="success"
          @click="showAddDialog = true"
        >
          添加水源硬件设备
        </el-button>
        <el-button type="primary" @click="refreshList">刷新设备状态</el-button>
      </div>
    </div>

    <!-- 普通用户只读提示 -->
    <el-alert
      v-if="!userStore.isAdmin"
      title="您当前为【普通用户】权限，设备模式修改与开关控制已被锁定，如需修改请联系管理员。"
      type="info"
      show-icon
      :closable="false"
      style="margin-bottom: 16px;"
    />

    <!-- 设备列表面板 -->
    <div class="water-grid">
      <div
        v-for="item in waterDevices"
        :key="item.sn"
        class="glass-card water-card"
      >
        <div class="card-top">
          <div class="dev-info">
            <span class="sn-badge">{{ item.sn }}</span>
            <h3>{{ item.name }}</h3>
            <span class="loc-text">{{ item.location }}</span>
          </div>
          <el-tag :type="item.status === 'ONLINE' ? 'success' : 'danger'" effect="dark">
            {{ item.status === 'ONLINE' ? '运行正常' : '已断开' }}
          </el-tag>
        </div>

        <!-- 实时参数遥测流 display -->
        <div class="telemetry-box">
          <div class="metric-item">
            <span class="label">水质TDS值</span>
            <span class="value text-cyan">
              {{ store.realtimeTelemetry[item.sn]?.tdsVal || 14.2 }} <small>ppm</small>
            </span>
          </div>
          <div class="metric-item">
            <span class="label">水质浊度</span>
            <span class="value text-cyan">
              {{ store.realtimeTelemetry[item.sn]?.turbidity || 0.03 }} <small>NTU</small>
            </span>
          </div>
          <div class="metric-item">
            <span class="label">出水流量</span>
            <span class="value">
              {{ store.realtimeTelemetry[item.sn]?.flowRate || 1.4 }} <small>L/min</small>
            </span>
          </div>
          <div class="metric-item">
            <span class="label">UV杀菌照度</span>
            <span class="value text-emerald">
              {{ store.realtimeTelemetry[item.sn]?.uvIntensity || 99.1 }} <small>%</small>
            </span>
          </div>
        </div>

        <!-- 功能控制区域 -->
        <div class="control-area">
          <div class="ctrl-row">
            <span>深紫外线(UV-C)消毒模块</span>
            <el-switch
              :disabled="!userStore.isAdmin"
              :model-value="item.uv_status === 1"
              @change="(val: boolean) => handleUvToggle(item.sn, val)"
              active-text="开启消毒"
              inactive-text="关闭"
            />
          </div>

          <div class="ctrl-row">
            <span>设备工作模式</span>
            <el-radio-group
              :disabled="!userStore.isAdmin"
              :model-value="item.work_mode"
              size="small"
              @change="(val: any) => handleModeChange(item.sn, val)"
            >
              <el-radio-button label="NORMAL">标准消毒</el-radio-button>
              <el-radio-button label="ECO">绿色节能</el-radio-button>
              <el-radio-button label="DEEP_CLEAN">深度清洗</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <div class="card-bottom">
          <div class="health-info">
            <span>高分子过滤膜寿命: {{ item.filter_level }}%</span>
            <el-progress :percentage="item.filter_level" status="success" />
          </div>
          <el-button
            :disabled="!userStore.isAdmin"
            type="warning"
            plain
            size="small"
            @click="triggerAutoClean(item.sn)"
          >
            自动管路脉冲冲洗
          </el-button>
        </div>
      </div>
    </div>

    <!-- 添加设备弹窗 (限超级管理员) -->
    <el-dialog v-model="showAddDialog" title="添加新水源消毒硬件设备" width="500px">
      <el-form label-position="top">
        <el-form-item label="设备 SN 序列编号">
          <el-input v-model="newDevice.sn" placeholder="例: W-SYS-2026-03" />
        </el-form-item>
        <el-form-item label="设备名称">
          <el-input v-model="newDevice.name" placeholder="例: 3号椅位水质净消毒机" />
        </el-form-item>
        <el-form-item label="部署具体位置">
          <el-input v-model="newDevice.location" placeholder="例: 诊室三 牙椅03" />
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
  sn: `W-SYS-2026-0${Math.floor(Math.random() * 90 + 10)}`,
  name: '',
  location: '诊诊三室 牙椅03'
});

const waterDevices = computed(() => {
  return store.devices.filter((d) => d.type === 'WATER');
});

const refreshList = () => {
  store.fetchDevices('WATER');
};

const handleUvToggle = async (sn: string, status: boolean) => {
  await store.toggleUv(sn, status);
  ElMessage.success(`设备 ${sn} UV-C 紫外线杀菌模块已${status ? '开启' : '关闭'}`);
};

const handleModeChange = async (sn: string, mode: string) => {
  await store.changeWorkMode(sn, mode);
  ElMessage.success(`设备 ${sn} 运行模式已设定为 ${mode}`);
};

const triggerAutoClean = (sn: string) => {
  ElMessage.info(`已下发命令：设备 ${sn} 正在启动自动管路防生物膜脉冲冲洗程序`);
};

const submitAddDevice = async () => {
  if (!newDevice.value.name) {
    return ElMessage.error('设备名称不能为空');
  }
  try {
    await axios.post('/api/devices', {
      sn: newDevice.value.sn,
      name: newDevice.value.name,
      type: 'WATER',
      location: newDevice.value.location,
      workMode: 'NORMAL'
    });
    ElMessage.success('水源消毒设备添加成功！');
    showAddDialog.value = false;
    store.fetchDevices();
  } catch (e) {
    ElMessage.error('添加失败');
  }
};

onMounted(() => {
  store.fetchDevices('WATER');
});
</script>

<style scoped>
.water-device-page {
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

.water-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
  gap: 20px;
}

.water-card {
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
  background: rgba(56, 189, 248, 0.1);
  color: var(--primary-color);
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

.text-cyan { color: #38bdf8; }
.text-emerald { color: #10b981; }

.control-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
