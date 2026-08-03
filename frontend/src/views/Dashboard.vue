<template>
  <div class="dashboard-view">
    <!-- 1. 顶部四大核心概览指标卡片组 -->
    <div class="metrics-grid">
      <div class="glass-card metric-card">
        <div class="metric-header flex-between">
          <span class="metric-title">管辖诊所与设备数</span>
          <el-icon class="icon-cyan"><Monitor /></el-icon>
        </div>
        <div class="metric-body">
          <div class="metric-num-wrap">
            <span class="metric-number">{{ store.overview.totalDevices }}</span>
            <span class="metric-unit">台在线 ({{ store.overview.totalClinics || 2 }}诊所)</span>
          </div>
          <p class="metric-sub">在线率 100%</p>
        </div>
      </div>

      <div class="glass-card metric-card">
        <div class="metric-header flex-between">
          <span class="metric-title">水源消毒灭菌率</span>
          <el-icon class="icon-green"><Filter /></el-icon>
        </div>
        <div class="metric-body">
          <div class="metric-num-wrap">
            <span class="metric-number green">{{ store.overview.waterDisinfectionRate || 99.99 }}%</span>
          </div>
          <p class="metric-sub">TDS均值 14.2 ppm</p>
        </div>
      </div>

      <div class="glass-card metric-card">
        <div class="metric-header flex-between">
          <span class="metric-title">气源总菌杀灭率</span>
          <el-icon class="icon-cyan"><WindPower /></el-icon>
        </div>
        <div class="metric-body">
          <div class="metric-num-wrap">
            <span class="metric-number cyan">{{ store.overview.airSterilizationRate || 99.85 }}%</span>
          </div>
          <p class="metric-sub">稳定气压 0.65 MPa</p>
        </div>
      </div>

      <div class="glass-card metric-card">
        <div class="metric-header flex-between">
          <span class="metric-title">安全事件与未处置告警</span>
          <el-icon class="icon-warn"><Warning /></el-icon>
        </div>
        <div class="metric-body">
          <div class="metric-num-wrap">
            <span class="metric-number warn">{{ store.overview.activeAlarmsCount }}</span>
            <span class="metric-unit">起待响应</span>
          </div>
          <p class="metric-sub">主动预测保护中</p>
        </div>
      </div>
    </div>

    <!-- 2. 中部核心图表双栏 -->
    <div class="charts-grid">
      <div class="glass-card chart-card">
        <div class="card-header flex-between">
          <h3>24小时感控水质与露点趋势</h3>
          <span class="tag-blue">动态多模态数据分析</span>
        </div>
        <div ref="trendChartRef" class="chart-container"></div>
      </div>

      <div class="glass-card chart-card">
        <div class="card-header flex-between">
          <h3>设备运行模式分布</h3>
        </div>
        <div ref="pieChartRef" class="chart-container"></div>
      </div>
    </div>

    <!-- 3. 下部全量感控硬件设备状态表 -->
    <div class="glass-card table-card">
      <div class="card-header flex-between mb-16">
        <h3>感控硬件设备状态全览</h3>
        <el-button type="primary" size="small" @click="store.fetchDevices(true)">刷新列表</el-button>
      </div>

      <el-table :data="store.devices" border stripe class="custom-dark-table" style="width: 100%">
        <el-table-column prop="sn" label="设备编号" width="180" />
        <el-table-column prop="name" label="设备名称" min-width="220" />
        <el-table-column prop="type" label="系统分类" width="180" align="center">
          <template #default="{ row }">
            <el-tag :type="row.type === 'WATER' ? 'primary' : 'success'">
              {{ row.type === 'WATER' ? '水源消毒系统' : '气源净化系统' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="部署位置" min-width="160" />
        <el-table-column prop="work_mode" label="运行模式" width="140">
          <template #default="{ row }">
            <el-tag :type="getModeTagType(row.work_mode)">
              {{ getModeLabel(row.work_mode) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="filter_level" label="滤芯健康度" width="180">
          <template #default="{ row }">
            <el-progress
              :percentage="row.filter_level"
              :status="row.filter_level < 80 ? 'warning' : 'success'"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
        <el-table-column label="快捷调控" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <div class="action-btn-group">
              <el-button
                size="small"
                type="primary"
                plain
                @click="store.changeWorkMode(row.id, row.work_mode === 'ECO' ? 'NORMAL' : 'ECO')"
              >
                {{ row.work_mode === 'ECO' ? '常规模式' : '节能模式' }}
              </el-button>
              <el-button size="small" type="danger" plain @click="handleLock(row)">
                切断锁止
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useDeviceStore } from '@/stores/deviceStore';
import { useUserStore } from '@/stores/userStore';
import { usePageLoading } from '@/composables/usePageLoading';
import { Monitor, Filter, WindPower, Warning } from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import { ElMessage, ElMessageBox } from 'element-plus';

const store = useDeviceStore();
const userStore = useUserStore();
const { withLoading } = usePageLoading();

const trendChartRef = ref<HTMLElement | null>(null);
const pieChartRef = ref<HTMLElement | null>(null);

let trendChart: echarts.ECharts | null = null;
let pieChart: echarts.ECharts | null = null;

const getModeLabel = (mode: string) => {
  switch (mode) {
    case 'NORMAL': return '正常巡检';
    case 'ECO': return '绿色节能';
    case 'DEEP_CLEAN': return '深度消毒';
    case 'OFF': return '关机休眠';
    default: return mode;
  }
};

const getModeTagType = (mode: string) => {
  switch (mode) {
    case 'NORMAL': return 'info';
    case 'ECO': return 'success';
    case 'DEEP_CLEAN': return 'warning';
    case 'OFF': return 'danger';
    default: return 'info';
  }
};

const chartsLoading = ref(true);

const initCharts = () => {
  if (!trendChartRef.value || !pieChartRef.value) return;

  const widthTrend = trendChartRef.value.clientWidth || trendChartRef.value.parentElement?.clientWidth || 600;
  const widthPie = pieChartRef.value.clientWidth || pieChartRef.value.parentElement?.clientWidth || 300;

  const isDark = userStore.isDarkTheme;
  const textColor = isDark ? '#94a3b8' : '#475569';
  const splitLineColor = isDark ? '#1e293b' : '#e2e8f0';
  const axisLineColor = isDark ? '#334155' : '#cbd5e1';

  if (trendChart) trendChart.dispose();
  trendChart = echarts.init(trendChartRef.value, isDark ? 'dark' : undefined, { width: widthTrend, height: 320 });
  trendChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { data: ['水质TDS(ppm)', '露点温度(°C)'], top: 10, textStyle: { color: textColor } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00'],
      axisLine: { lineStyle: { color: axisLineColor } }
    },
    yAxis: [
      { type: 'value', name: 'TDS (ppm)', splitLine: { lineStyle: { color: splitLineColor } } },
      { type: 'value', name: '露点 (°C)', min: -50, max: -30, splitLine: { show: false } }
    ],
    series: [
      {
        name: '水质TDS(ppm)',
        type: 'line',
        smooth: true,
        data: [14.2, 13.8, 14.5, 12.9, 14.1, 19.5, 15.2, 13.6, 17.1],
        itemStyle: { color: isDark ? '#38bdf8' : '#0284c7' }
      },
      {
        name: '露点温度(°C)',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: [-43, -42, -44, -42, -45, -43, -44, -42, -44],
        itemStyle: { color: isDark ? '#10b981' : '#059669' }
      }
    ]
  }, true);

  if (pieChart) pieChart.dispose();
  pieChart = echarts.init(pieChartRef.value, isDark ? 'dark' : undefined, { width: widthPie, height: 320 });
  pieChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { color: textColor } },
    series: [
      {
        name: '运行模式',
        type: 'pie',
        radius: ['45%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: isDark ? '#0f172a' : '#ffffff', borderWidth: 2 },
        label: { show: false },
        data: [
          { value: 4, name: '正常巡检', itemStyle: { color: '#0284c7' } },
          { value: 2, name: '深度消毒', itemStyle: { color: '#f59e0b' } },
          { value: 1, name: '绿色节能', itemStyle: { color: '#10b981' } }
        ]
      }
    ]
  }, true);

  chartsLoading.value = false;
};

const handleResize = () => {
  trendChart?.resize();
  pieChart?.resize();
};

let resizeObserver: ResizeObserver | null = null;

watch(() => userStore.isDarkTheme, () => {
  nextTick(() => {
    initCharts();
    handleResize();
  });
});

watch(() => store.loading, (isLoading) => {
  if (!isLoading) {
    nextTick(() => {
      handleResize();
    });
  }
});

const handleLock = (row: any) => {
  ElMessageBox.confirm(`确认紧急切断锁止设备 ${row.name} (${row.sn}) 吗？`, '安全调控警示', {
    confirmButtonText: '确认锁止',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    store.changeWorkMode(row.id, 'OFF');
    ElMessage.success(`设备 ${row.sn} 已紧急锁止`);
  }).catch(() => {});
};

onMounted(async () => {
  initCharts();

  if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    if (trendChartRef.value) resizeObserver.observe(trendChartRef.value);
    if (pieChartRef.value) resizeObserver.observe(pieChartRef.value);
  }

  window.addEventListener('resize', handleResize);

  // 由 composable 统一管理全局 loading：等数据拉取 + 图表重绘 + DOM 渲染全部完成
  await withLoading(
    [
      () => store.fetchOverview(),
      () => store.fetchDevices(),
      () => {
        initCharts();
        return Promise.resolve();
      }
    ],
    () => store.devices.length > 0 && store.overview.totalDevices > 0
  );

  // loading 关闭后再做一次 resize，确保 ECharts 容器尺寸正确
  nextTick(() => handleResize());
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  trendChart?.dispose();
  pieChart?.dispose();
});
</script>

<style scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  width: 100%;
}

.metric-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.metric-header {
  margin-bottom: 12px;
}

.metric-title {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
}

.icon-cyan { color: #38bdf8; font-size: 20px; }
.icon-green { color: #10b981; font-size: 20px; }
.icon-warn { color: #ef4444; font-size: 20px; }

.metric-number {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-main);
  line-height: 1.2;
}

.metric-number.green { color: #10b981; }
.metric-number.cyan { color: #38bdf8; }
.metric-number.warn { color: #ef4444; }

.metric-unit {
  font-size: 12px;
  color: var(--text-secondary);
  margin-left: 6px;
}

.metric-sub {
  font-size: 12px;
  color: #64748b;
  margin-top: 8px;
}

.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.chart-card {
  padding: 20px;
}

.chart-container {
  width: 100%;
  height: 320px;
  margin-top: 12px;
}

.table-card {
  padding: 24px;
}

.card-header h3 {
  font-size: 16px;
  color: var(--text-main);
  font-weight: 600;
}

.tag-blue {
  font-size: 12px;
  color: var(--accent-cyan);
  background: rgba(56, 189, 248, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
}

:deep(.custom-dark-table) {
  --el-table-bg-color: transparent !important;
  --el-table-tr-bg-color: transparent !important;
  --el-table-header-bg-color: #1e293b !important;
  --el-table-header-text-color: #cbd5e1 !important;
  --el-table-row-hover-bg-color: rgba(30, 41, 59, 0.9) !important;
  --el-table-text-color: #f8fafc !important;
  --el-table-border-color: #1e293b !important;
}

:deep(.custom-dark-table td.el-table__cell) {
  background-color: transparent !important;
  color: #f8fafc !important;
  border-bottom: 1px solid #1e293b !important;
}

.mb-16 {
  margin-bottom: 16px;
}

.action-btn-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
}

.action-btn-group .el-button {
  margin: 0 !important;
}
</style>
