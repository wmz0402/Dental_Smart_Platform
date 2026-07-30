<template>
  <div class="telemetry-page">
    <div class="header-filter glass-card">
      <div class="filter-left">
        <span>选择监控设备：</span>
        <el-select v-model="selectedDevice" placeholder="请选择设备" style="width: 280px;" @change="loadHistory">
          <el-option
            v-for="item in store.devices"
            :key="item.sn"
            :label="`${item.name} (${item.sn})`"
            :value="item.sn"
          />
        </el-select>
      </div>
      <div class="filter-right">
        <el-radio-group v-model="timeRange" size="small" @change="loadHistory">
          <el-radio-button label="30">最近 30 条采样</el-radio-button>
          <el-radio-button label="100">最近 100 条采样</el-radio-button>
        </el-radio-group>
        <el-button type="primary" size="small" @click="loadHistory">刷新数据</el-button>
      </div>
    </div>

    <!-- 趋势图表区 -->
    <div class="glass-card chart-wrapper">
      <div class="card-header">
        <h3>高频遥测指标趋势图</h3>
        <span class="sub-tip">实况数据采样频率：3秒/次</span>
      </div>
      <div ref="chartRef" class="chart-container"></div>
    </div>

    <!-- 历史数据明细表格 -->
    <div class="glass-card table-wrapper">
      <div class="card-header">
        <h3>数据日志明细（从后端数据库拉取）</h3>
      </div>
      <el-table :data="historyLogs" style="width: 100%" height="320">
        <el-table-column prop="id" label="日志编号" width="100" />
        <el-table-column prop="device_sn" label="设备编号" width="180" />
        <el-table-column prop="tds_val" label="水质TDS (ppm)" width="150">
          <template #default="{ row }">{{ row.tds_val || '-' }}</template>
        </el-table-column>
        <el-table-column prop="turbidity" label="水质浊度 (NTU)" width="150">
          <template #default="{ row }">{{ row.turbidity || '-' }}</template>
        </el-table-column>
        <el-table-column prop="pressure" label="气源压力 (MPa)" width="150">
          <template #default="{ row }">{{ row.pressure || '-' }}</template>
        </el-table-column>
        <el-table-column prop="dew_point" label="露点温度 (℃)" width="150">
          <template #default="{ row }">{{ row.dew_point || '-' }}</template>
        </el-table-column>
        <el-table-column prop="uv_intensity" label="UV强度 (%)" width="140" />
        <el-table-column prop="recorded_at" label="采样时间" min-width="200" />
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useDeviceStore } from '@/stores/deviceStore';
import axios from 'axios';
import * as echarts from 'echarts';

const store = useDeviceStore();
const selectedDevice = ref('W-SYS-2026-01');
const timeRange = ref('30');
const historyLogs = ref<any[]>([]);

const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const loadHistory = async () => {
  try {
    const res = await axios.get('/api/telemetry/history', {
      params: {
        deviceSn: selectedDevice.value,
        limit: timeRange.value
      }
    });
    historyLogs.value = res.data;
    updateChartData();
  } catch (err) {
    console.error('加载遥测历史失败', err);
  }
};

const updateChartData = () => {
  if (!chartInstance) return;

  const times = historyLogs.value.map((l) => l.recorded_at ? l.recorded_at.split('T')[1] || l.recorded_at : '');
  const isWater = selectedDevice.value.startsWith('W');

  if (isWater) {
    const tdsList = historyLogs.value.map((l) => l.tds_val);
    const uvList = historyLogs.value.map((l) => l.uv_intensity);

    chartInstance.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      legend: { data: ['TDS水质(ppm)', 'UV强度(%)'] },
      xAxis: { type: 'category', data: times },
      yAxis: [{ type: 'value', name: 'TDS' }, { type: 'value', name: 'UV强度%' }],
      series: [
        { name: 'TDS水质(ppm)', type: 'line', data: tdsList, itemStyle: { color: '#38bdf8' } },
        { name: 'UV强度(%)', type: 'line', yAxisIndex: 1, data: uvList, itemStyle: { color: '#10b981' } }
      ]
    });
  } else {
    const pressList = historyLogs.value.map((l) => l.pressure);
    const dewList = historyLogs.value.map((l) => l.dew_point);

    chartInstance.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      legend: { data: ['气压(MPa)', '露点(℃)'] },
      xAxis: { type: 'category', data: times },
      yAxis: [{ type: 'value', name: '气压' }, { type: 'value', name: '露点' }],
      series: [
        { name: '气压(MPa)', type: 'line', data: pressList, itemStyle: { color: '#f59e0b' } },
        { name: '露点(℃)', type: 'line', yAxisIndex: 1, data: dewList, itemStyle: { color: '#10b981' } }
      ]
    });
  }
};

onMounted(async () => {
  await store.fetchDevices();
  if (store.devices.length > 0) {
    selectedDevice.value = store.devices[0].sn;
  }
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value, 'dark');
  }
  loadHistory();
});
</script>

<style scoped>
.telemetry-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-filter {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-left, .filter-right {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
  color: #94a3b8;
}

.chart-wrapper {
  height: 380px;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-header h3 {
  font-size: 16px;
  color: #f8fafc;
}

.sub-tip {
  font-size: 12px;
  color: #64748b;
}

.chart-container {
  flex: 1;
  width: 100%;
}

.table-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
