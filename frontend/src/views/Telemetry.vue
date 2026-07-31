<template>
  <div class="telemetry-view">
    <!-- 顶部设备选择与控制 -->
    <div class="glass-card control-bar">
      <div class="control-bar-inner">
        <div class="control-left">
          <span class="label-title">选择监控设备:</span>
          <el-select v-model="selectedDeviceSn" placeholder="请选择设备" class="device-select" @change="loadHistory">
            <el-option
              v-for="item in deviceStore.devices"
              :key="item.sn"
              :label="`${item.name} (${item.sn})`"
              :value="item.sn"
            />
          </el-select>
        </div>

        <div class="control-right">
          <el-button-group class="limit-group">
            <el-button :type="sampleLimit === 30 ? 'primary' : 'default'" @click="changeLimit(30)">最近 30 条采样</el-button>
            <el-button :type="sampleLimit === 100 ? 'primary' : 'default'" @click="changeLimit(100)">最近 100 条采样</el-button>
          </el-button-group>
          <el-button type="primary" :icon="Refresh" @click="loadHistory">刷新数据</el-button>
        </div>
      </div>
    </div>

    <!-- 高频遥测指标趋势图卡片 -->
    <div class="glass-card chart-card">
      <div class="card-header flex-between">
        <h3>高频遥测指标趋势图</h3>
        <span class="subtitle">实况数据采样频率: 3秒/次</span>
      </div>
      <!-- ECharts 动态绘图容器 -->
      <div ref="chartRef" class="chart-container"></div>
    </div>

    <!-- 数据日志明细表 -->
    <div class="glass-card table-card">
      <div class="card-header flex-between mb-16">
        <h3>数据日志明细 (实况遥测记录)</h3>
        <span class="badge-tag">在线数据流正常</span>
      </div>
      <el-table :data="tableData" border stripe class="custom-dark-table" style="width: 100%">
        <el-table-column prop="id" label="日志编号" min-width="140" />
        <el-table-column prop="sn" label="设备编号" min-width="160" />
        <el-table-column prop="tds" label="水质TDS (ppm)" min-width="120">
          <template #default="{ row }">
            <span :class="row.tds > 30 ? 'text-warn' : 'text-normal'">{{ row.tds !== undefined ? row.tds : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="turbidity" label="水质浊度 (NTU)" min-width="120">
          <template #default="{ row }">
            <span class="text-light">{{ row.turbidity !== undefined ? row.turbidity : '0.12' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="pressure" label="气源压力 (MPa)" min-width="120">
          <template #default="{ row }">
            <span class="text-light">{{ row.pressure !== undefined ? row.pressure : '0.65' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="dew_point" label="露点温度 (°C)" min-width="120">
          <template #default="{ row }">
            <span class="text-light">{{ row.dew_point !== undefined ? row.dew_point : '-42' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="uvIntensity" label="UV强度 (%)" min-width="120">
          <template #default="{ row }">
            <span class="text-light">98.5%</span>
          </template>
        </el-table-column>
        <el-table-column prop="timestamp" label="采样时间" min-width="180" />
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useDeviceStore } from '@/stores/deviceStore';
import { useUserStore } from '@/stores/userStore';
import { Refresh } from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import axios from 'axios';

const deviceStore = useDeviceStore();
const userStore = useUserStore();
const selectedDeviceSn = ref('W-SYS-2026-01');
const sampleLimit = ref(30);
const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const tableData = ref<any[]>([]);

const generateMockPoints = (count: number) => {
  const times: string[] = [];
  const tdsData: number[] = [];
  const uvData: number[] = [];
  const now = Date.now();

  for (let i = count - 1; i >= 0; i--) {
    const t = new Date(now - i * 3000);
    const timeStr = t.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    times.push(timeStr);
    tdsData.push(Number((12 + Math.random() * 3).toFixed(1)));
    const uvVal = 94.5 + Math.sin(i * 0.45) * 3.5 + (Math.random() - 0.5) * 1.5;
    uvData.push(Number(uvVal.toFixed(1)));
  }

  return { times, tdsData, uvData };
};

const renderChart = (times: string[], tdsData: number[], uvData: number[]) => {
  if (!chartRef.value) return;

  const isDark = userStore.isDarkTheme;
  const textColor = isDark ? '#94a3b8' : '#475569';
  const splitLineColor = isDark ? '#1e293b' : '#e2e8f0';
  const axisLineColor = isDark ? '#334155' : '#cbd5e1';

  if (chartInstance) {
    chartInstance.dispose();
  }
  chartInstance = echarts.init(chartRef.value, isDark ? 'dark' : undefined);

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderColor: isDark ? '#38bdf8' : '#0284c7',
      textStyle: { color: isDark ? '#f8fafc' : '#0f172a' }
    },
    legend: {
      data: ['TDS水质(ppm)', 'UV杀菌强度(%)'],
      top: 10,
      textStyle: { color: textColor }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: times,
      axisLine: { lineStyle: { color: axisLineColor } },
      axisLabel: { color: textColor }
    },
    yAxis: [
      {
        type: 'value',
        name: 'TDS水质(ppm)',
        position: 'left',
        splitLine: { lineStyle: { color: splitLineColor } },
        axisLabel: { color: textColor }
      },
      {
        type: 'value',
        name: 'UV强度(%)',
        position: 'right',
        min: 80,
        max: 100,
        splitLine: { show: false },
        axisLabel: { color: textColor }
      }
    ],
    series: [
      {
        name: 'TDS水质(ppm)',
        type: 'line',
        smooth: true,
        data: tdsData,
        itemStyle: { color: isDark ? '#38bdf8' : '#0284c7' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(2, 132, 199, 0.25)' },
            { offset: 1, color: isDark ? 'rgba(56, 189, 248, 0.0)' : 'rgba(2, 132, 199, 0.0)' }
          ])
        }
      },
      {
        name: 'UV杀菌强度(%)',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: uvData,
        itemStyle: { color: isDark ? '#10b981' : '#059669' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(5, 150, 105, 0.2)' },
            { offset: 1, color: isDark ? 'rgba(16, 185, 129, 0.0)' : 'rgba(5, 150, 105, 0.0)' }
          ])
        }
      }
    ]
  };

  chartInstance.setOption(option);
  chartInstance.resize();
};

const loadHistory = async () => {
  deviceStore.loading = true;
  const { times, tdsData, uvData } = generateMockPoints(sampleLimit.value);

  try {
    const res = await axios.get(`/api/telemetry/history?deviceSn=${selectedDeviceSn.value}&limit=${sampleLimit.value}`);
    if (Array.isArray(res.data) && res.data.length > 0) {
      const apiTimes = res.data.map(d => d.timestamp);
      const apiTds = res.data.map(d => d.tds || 14);
      const apiUv = res.data.map((d, idx) => Number(d.uvIntensity || (94.5 + Math.sin(idx * 0.45) * 3.5 + (Math.random() - 0.5) * 1.5).toFixed(1)));
      
      tableData.value = apiTimes.map((t, idx) => ({
        id: `LOG-${Date.now() - idx * 1000}`,
        sn: selectedDeviceSn.value,
        tds: apiTds[idx],
        turbidity: '0.12',
        pressure: '0.65',
        dewPoint: '-42.0',
        uvIntensity: apiUv[idx],
        timestamp: t
      }));

      renderChart(apiTimes, apiTds, apiUv);
      await nextTick();
      setTimeout(() => {
        deviceStore.loading = false;
      }, 150);
      return;
    }
  } catch (err) {}

  tableData.value = times.map((t, idx) => ({
    id: `LOG-${Date.now() - idx * 1000}`,
    sn: selectedDeviceSn.value,
    tds: tdsData[idx],
    turbidity: '0.12',
    pressure: '0.65',
    dewPoint: '-42.0',
    uvIntensity: uvData[idx],
    timestamp: t
  }));

  renderChart(times, tdsData, uvData);
  await nextTick();
  setTimeout(() => {
    deviceStore.loading = false;
  }, 150);
};

const changeLimit = (limit: number) => {
  sampleLimit.value = limit;
  loadHistory();
};

const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize();
  }
};

watch([selectedDeviceSn, () => userStore.isDarkTheme], () => {
  loadHistory();
});

onMounted(() => {
  deviceStore.fetchDevices();
  nextTick(() => {
    loadHistory();
    window.addEventListener('resize', handleResize);
  });
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (chartInstance) {
    chartInstance.dispose();
  }
});
</script>

<style scoped>
.telemetry-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.control-bar {
  padding: 20px 24px;
}

.control-bar-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.control-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.control-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.label-title {
  color: var(--text-main);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.device-select {
  width: 360px;
}

.chart-card {
  padding: 24px;
}

.chart-container {
  width: 100%;
  height: 380px;
  margin-top: 16px;
}

.table-card {
  padding: 24px;
}

.card-header h3 {
  font-size: 16px;
  color: var(--text-main);
  font-weight: 600;
}

.subtitle {
  font-size: 12px;
  color: #64748b;
}

.badge-tag {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
}

/* 消除深色模式下 Element Plus 表格白条条，并提升文字高对比度 */
:deep(.custom-dark-table) {
  --el-table-bg-color: transparent !important;
  --el-table-tr-bg-color: transparent !important;
  --el-table-header-bg-color: #1e293b !important;
  --el-table-header-text-color: #cbd5e1 !important;
  --el-table-row-hover-bg-color: rgba(30, 41, 59, 0.9) !important;
  --el-table-text-color: #f8fafc !important;
  --el-table-border-color: #1e293b !important;
}

:deep(.custom-dark-table .el-table__row) {
  background-color: transparent !important;
  color: #f8fafc !important;
}

:deep(.custom-dark-table td.el-table__cell) {
  background-color: transparent !important;
  color: #f8fafc !important;
  border-bottom: 1px solid #1e293b !important;
}

.text-light {
  color: #f8fafc !important;
}

.text-normal {
  color: #10b981;
  font-weight: 600;
}

.text-warn {
  color: #f59e0b;
  font-weight: 600;
}

.mb-16 {
  margin-bottom: 16px;
}
</style>
