<template>
  <div class="settings-page">
    <div class="header-action">
      <div class="page-title">
        <h2>系统与机构配置</h2>
        <span>诊所基础资料、物联网通信协议及智能告警规则设置</span>
      </div>
      <el-button
        :disabled="!userStore.isAdmin"
        type="primary"
        @click="saveSettings"
      >
        保存配置更新
      </el-button>
    </div>

    <!-- 普通用户只读提示 -->
    <el-alert
      v-if="!userStore.isAdmin"
      title="当前权限为【普通用户】，系统参数与告警阈值配置处于只读状态，无法提交保存。"
      type="warning"
      show-icon
      :closable="false"
      style="margin-bottom: 16px;"
    />

    <div class="settings-grid">
      <!-- 机构基础信息 -->
      <div class="glass-card settings-card">
        <div class="card-header pb-12 mb-16">
          <h3>诊所机构档案信息</h3>
        </div>
        <el-form label-position="top">
          <el-form-item label="机构名称">
            <el-input :disabled="!userStore.isAdmin" v-model="form.clinicName" />
          </el-form-item>
          <el-form-item label="诊所代码">
            <el-input v-model="form.clinicCode" disabled />
          </el-form-item>
          <el-form-item label="联系负责人">
            <el-input :disabled="!userStore.isAdmin" v-model="form.contact" />
          </el-form-item>
          <el-form-item label="联系电话">
            <el-input :disabled="!userStore.isAdmin" v-model="form.phone" />
          </el-form-item>
        </el-form>
      </div>

      <!-- 物联网与通信协议参数 -->
      <div class="glass-card settings-card">
        <div class="card-header pb-12 mb-16">
          <h3>物联网协议与接入服务</h3>
        </div>
        <el-form label-position="top">
          <el-form-item label="MQTT Broker 地址">
            <el-input :disabled="!userStore.isAdmin" v-model="form.mqttBroker" />
          </el-form-item>
          <el-form-item label="数据采样上报间隔">
            <el-select :disabled="!userStore.isAdmin" v-model="form.sampleRate" style="width: 100%;">
              <el-option label="高频 (3秒/次)" value="3" />
              <el-option label="标准 (10秒/次)" value="10" />
              <el-option label="节能 (30秒/次)" value="30" />
            </el-select>
          </el-form-item>
          <el-form-item label="数据加密方式">
            <el-input v-model="form.encryption" disabled />
          </el-form-item>
        </el-form>
      </div>

      <!-- 告警规则配置 -->
      <div class="glass-card settings-card span-2">
        <div class="card-header pb-12 mb-16">
          <h3>智能告警与阈值策略设置</h3>
        </div>
        <div class="rules-grid">
          <div class="rule-item">
            <span>水质TDS异常阀值上限</span>
            <el-input-number :disabled="!userStore.isAdmin" v-model="form.tdsLimit" :min="10" :max="100" />
            <span class="unit-text">ppm</span>
          </div>
          <div class="rule-item">
            <span>气源输出压力下限警告</span>
            <el-input-number :disabled="!userStore.isAdmin" v-model="form.pressLimit" :step="0.05" :min="0.3" :max="0.8" />
            <span class="unit-text">MPa</span>
          </div>
          <div class="rule-item">
            <span>干燥露点温度上线预警</span>
            <el-input-number :disabled="!userStore.isAdmin" v-model="form.dewLimit" :step="1" :min="-60" :max="-20" />
            <span class="unit-text">℃</span>
          </div>
          <div class="rule-item">
            <span>紫外线失效强制停水锁定</span>
            <el-switch :disabled="!userStore.isAdmin" v-model="form.autoCutoff" active-text="已启用" inactive-text="未启用" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { ElMessage } from 'element-plus';

const userStore = useUserStore();

const form = ref({
  clinicName: '智护牙科示范总院',
  clinicCode: 'HQ-001',
  contact: '张院长',
  phone: '010-88886666',
  mqttBroker: 'mqtt://iot.dental-smart.com:1883',
  sampleRate: '3',
  encryption: 'TLS v1.3 / AES-256-GCM',
  tdsLimit: 30,
  pressLimit: 0.55,
  dewLimit: -40,
  autoCutoff: true
});

import { onMounted } from 'vue';
import { useDeviceStore } from '@/stores/deviceStore';
import { usePageLoading } from '@/composables/usePageLoading';

const deviceStore = useDeviceStore();
const { finishLoading } = usePageLoading();

const saveSettings = () => {
  ElMessage.success('系统配置参数已成功保存并实时下发同步');
};

onMounted(async () => {
  // 设置页无远程数据请求，仅需等待表单 DOM 渲染完成即可关 loading
  await finishLoading();
});
</script>

<style scoped>
.settings-page {
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

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.settings-card {
  display: flex;
  flex-direction: column;
}

.span-2 {
  grid-column: span 2;
}

.card-header h3 {
  font-size: 16px;
  color: var(--text-main);
  font-weight: 700;
}

.pb-12 {
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(56, 189, 248, 0.15);
}

.mb-16 {
  margin-bottom: 16px;
}

.rules-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.rule-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: var(--text-main);
  background: rgba(30, 41, 59, 0.4);
  padding: 18px 20px;
  border-radius: 8px;
  border: 1px solid rgba(56, 189, 248, 0.2);
}

.unit-text {
  font-size: 12px;
  color: var(--text-muted);
}
</style>
