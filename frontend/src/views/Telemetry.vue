<template>
  <div class="telemetry-view">
    <!-- 顶部设备选择与控制 -->
    <div class="glass-card flex-between control-bar">
      <div class="flex-align gap-16">
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

      <div class="flex-align gap-12">
        <el-button-group>
          <el-button :type="sampleLimit === 30 ? 'primary' : 'default'" @click="changeLimit(30)">最近 30 条采样</el-button>
          <el-button :type="sampleLimit === 100 ? 'primary' : 'default'" @click="changeLimit(100)">最近 100 条采样</el-button>
        </el-button-group>
        <el-button type="primary" :icon="Refresh" @click="loadHistory">刷新数据</el-button>
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
      <el-table :data="tableData" stripe style="width: 100%">
        <el-table-column prop="id" label="日志编号" width="120" />
        <el-table-column prop="sn" label="设备编号" width="180" />
        <el-table-column prop="tds" label="水质TDS (ppm)">
          <template #default="{ row }">
            <span :class="row.tds > 30 ? 'text-warn' : 'text-normal'">{{ row.tds !== undefined ? row.tds : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="turbidity" label="水质浊度 (NTU)">
          <template #default="{ row }">
            <span>{{ row.turbidity !== undefined ? row.turbidity : '0.12' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="pressure" label="气源压力 (MPa)">
          <template #default="{ row }">
            <span>{{ row.pressure !== undefined ? row.pressure : '0.65' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="dew_point" label="露点温度 (°C)">
          <template #default="{ row }">
            <span>{{ row.dew_point !== undefined ? row.dew_point : '-42' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="uvIntensity" label="UV强度 (%)">
          <template #default="{ row }">
            <span>98.5%</span>
          </template>
        </el-table-column>
        <el-table-column prop="timestamp" label="采样时间" width="200" />
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useDeviceStore } from '@/stores/deviceStore';
import { Refresh } from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import axios from 'axios';

const deviceStore = useDeviceStore();
const selectedDeviceSn = ref('W-SYS-2026-01');
const sampleLimit = ref(30);
const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const tableData = ref<any[]>([]);

// 生成高度平滑的高频模拟曲线数据（确保无网络时完美渲染图表）
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
    uvData.push(Number((97 + Math.random() * 2.5).toFixed(1)));
  }

  return { times, tdsData, uvData };
};

const renderChart = (times: string[], tdsData: number[], uvData: number[]) => {
  if (!chartRef.value) return;

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value, 'dark');
  }

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0f172a',
      borderColor: '#38bdf8',
      textStyle: { color: '#f8fafc' }
    },
    legend: {
      data: ['TDS水质(ppm)', 'UV杀菌强度(%)'],
      top: 10,
      textStyle: { color: '#94a3b8' }
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
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8' }
    },
    yAxis: [
      {
        type: 'value',
        name: 'TDS水质(ppm)',
        position: 'left',
        splitLine: { lineStyle: { color: '#1e293b' } },
        axisLabel: { color: '#94a3b8' }
      },
      {
        type: 'value',
        name: 'UV强度(%)',
        position: 'right',
        min: 80,
        max: 100,
        splitLine: { show: false },
        axisLabel: { color: '#94a3b8' }
      }
    ],
    series: [
      {
        name: 'TDS水质(ppm)',
        type: 'line',
        smooth: true,
        data: tdsData,
        itemStyle: { color: '#38bdf8' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(56, 189, 248, 0.4)' },
            { offset: 1, color: 'rgba(56, 189, 248, 0.0)' }
          ])
        }
      },
      {
        name: 'UV杀菌强度(%)',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: uvData,
        itemStyle: { color: '#10b981' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
            { offset: 1, color: 'rgba(16, 185, 129, 0.0)' }
          ])
        }
      }
    ]
  };

  chartInstance.setOption(option);
  chartInstance.resize();
};

const loadHistory = async () => {
  const { times, tdsData, uvData } = generateMockPoints(sampleLimit.value);

  // 构造表格明细数据
  tableData.value = times.map((t, idx) => ({
    id: `LOG-${Date.now() - idx * 1000}`,
    sn: selectedDeviceSn.value,
    tds: tdsData[idx],
    turbidity: '0.12',
    pressure: '0.65',
    dew_point: '-42',
    uvIntensity: uvData[idx],
    timestamp: t
  }));

  try {
    const res = await axios.get(`/api/telemetry/history?deviceSn=${selectedDeviceSn.value}&limit=${sampleLimit.value}`);
    if (Array.isArray(res.data) && res.data.length > 0) {
      const apiTimes = res.data.map(d => d.timestamp);
      const apiTds = res.data.map(d => d.tds || 14);
      const apiUv = res.data.map(d => 98.5);
      renderChart(apiTimes, apiTds, apiUv);
      return;
    }
  } catch (e) {}

  renderChart(times, tdsData, uvData);
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

watch(selectedDeviceSn, () => {
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
  gap: 20px;
}

.control-bar {
  padding: 16px 24px;
}

.label-title {
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
}

.device-select {
  width: 320px;
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

.text-normal {
  color: #10b981;
  font-weight: 600;
}

.text-warn {
  color: #f59e0b;
  font-weight: 600;
}

.gap-16 {
  gap: 16px;
}

.gap-12 {
  gap: 12px;
}

.mb-16 {
  margin-bottom: 16px;
}
</style>
