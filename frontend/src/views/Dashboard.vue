<template>
  <div class="dashboard-page">
    <!-- 顶部 KPI 指标卡片矩阵 -->
    <div class="kpi-grid">
      <div class="glass-card kpi-item">
        <div class="kpi-title">管辖诊所与设备数</div>
        <div class="kpi-value-box">
          <span class="kpi-num">{{ store.overview.totalDevices }}</span>
          <span class="kpi-unit">台在线 ({{ store.overview.totalClinics }}诊所)</span>
        </div>
        <div class="kpi-footer text-success">
          <span>在线率 {{ Math.round((store.overview.onlineDevices / (store.overview.totalDevices || 1)) * 100) }}%</span>
        </div>
      </div>

      <div class="glass-card kpi-item">
        <div class="kpi-title">水消毒杀灭率</div>
        <div class="kpi-value-box">
          <span class="kpi-num gradient-text">{{ store.overview.waterSterilizeRate }}%</span>
        </div>
        <div class="kpi-footer">
          <span>TDS均值 {{ store.overview.avgWaterTds }} ppm</span>
        </div>
      </div>

      <div class="glass-card kpi-item">
        <div class="kpi-title">气源总菌杀灭率</div>
        <div class="kpi-value-box">
          <span class="kpi-num gradient-text">{{ store.overview.airBacteriaKillRate }}%</span>
        </div>
        <div class="kpi-footer">
          <span>稳定气压 {{ store.overview.avgAirPressure }} MPa</span>
        </div>
      </div>

      <div class="glass-card kpi-item">
        <div class="kpi-title">安全事件与未处置告警</div>
        <div class="kpi-value-box">
          <span class="kpi-num" :class="store.overview.unresolvedAlarms > 0 ? 'text-danger' : 'text-success'">
            {{ store.overview.unresolvedAlarms }}
          </span>
          <span class="kpi-unit">起待响应</span>
        </div>
        <div class="kpi-footer">
          <span>主动防御保护中</span>
        </div>
      </div>
    </div>

    <!-- 中部可视化图表行 -->
    <div class="charts-row">
      <div class="glass-card chart-card flex-2">
        <div class="card-header">
          <h3>24小时感控水质与露点趋势</h3>
          <span class="sub-tip">动态多模态数据分析</span>
        </div>
        <div ref="trendChartRef" class="chart-container"></div>
      </div>

      <div class="glass-card chart-card flex-1">
        <div class="card-header">
          <h3>设备运行模式分布</h3>
        </div>
        <div ref="pieChartRef" class="chart-container"></div>
      </div>
    </div>

    <!-- 下部实时设备矩阵控制台 -->
    <div class="glass-card table-section">
      <div class="card-header">
        <h3>感控硬件设备状态全览</h3>
        <el-button type="primary" size="small" @click="refreshData">刷新列表</el-button>
      </div>

      <el-table :data="store.devices" style="width: 100%" size="large">
        <el-table-column prop="sn" label="设备编号" width="160" />
        <el-table-column prop="name" label="设备名称" min-width="200" />
        <el-table-column prop="type" label="系统分类" width="140">
          <template #default="{ row }">
            <el-tag :type="row.type === 'WATER' ? 'primary' : 'success'">
              {{ row.type === 'WATER' ? '水源消毒系统' : '气源洁净系统' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="部署位置" width="180" />
        <el-table-column prop="work_mode" label="运行模式" width="140">
          <template #default="{ row }">
            <el-tag effect="dark" :type="getModeTagType(row.work_mode)">
              {{ getModeLabel(row.work_mode) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="filter_level" label="滤芯健康度" width="150">
          <template #default="{ row }">
            <el-progress :percentage="row.filter_level" :color="getProgressColor(row.filter_level)" />
          </template>
        </el-table-column>
        <el-table-column label="快捷调控" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              :disabled="!userStore.isAdmin"
              size="small"
              :type="row.work_mode === 'ECO' ? 'primary' : 'default'"
              @click="toggleEcoMode(row)"
            >
              {{ row.work_mode === 'ECO' ? '常规模式' : '节能模式' }}
            </el-button>
            <el-button
              :disabled="!userStore.isAdmin"
              size="small"
              type="danger"
              plain
              @click="emergencyStop(row)"
            >
              切断锁止
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDeviceStore, Device } from '@/stores/deviceStore';
import { useUserStore } from '@/stores/userStore';
import * as echarts from 'echarts';
import { ElMessage } from 'element-plus';

const store = useDeviceStore();
const userStore = useUserStore();

const trendChartRef = ref<HTMLElement | null>(null);
const pieChartRef = ref<HTMLElement | null>(null);

let trendChart: echarts.ECharts | null = null;
let pieChart: echarts.ECharts | null = null;

const refreshData = () => {
  store.fetchOverview();
  store.fetchDevices();
};

const getModeLabel = (mode: string) => {
  const map: Record<string, string> = {
    NORMAL: '正常巡检',
    ECO: '绿色节能',
    DEEP_CLEAN: '深度消毒',
    OFF: '挂起停机'
  };
  return map[mode] || mode;
};

const getModeTagType = (mode: string) => {
  if (mode === 'NORMAL') return 'primary';
  if (mode === 'ECO') return 'success';
  if (mode === 'DEEP_CLEAN') return 'warning';
  return 'info';
};

const getProgressColor = (val: number) => {
  if (val > 60) return '#10b981';
  if (val > 30) return '#f59e0b';
  return '#ef4444';
};

const toggleEcoMode = async (row: Device) => {
  const targetMode = row.work_mode === 'ECO' ? 'NORMAL' : 'ECO';
  await store.changeWorkMode(row.sn, targetMode);
  ElMessage.success(`设备 ${row.sn} 模式已成功切换为 ${getModeLabel(targetMode)}`);
};

const emergencyStop = async (row: Device) => {
  await store.changeWorkMode(row.sn, 'OFF');
  ElMessage.warning(`设备 ${row.sn} 已安全紧急锁止断开`);
};

const initCharts = () => {
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value, 'dark');
    trendChart.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      legend: { data: ['水质TDS(ppm)', '露点温度(℃)'] },
      xAxis: {
        type: 'category',
        data: ['02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00']
      },
      yAxis: [
        { type: 'value', name: 'TDS (ppm)', min: 0, max: 50 },
        { type: 'value', name: '露点 (℃)', min: -50, max: -30 }
      ],
      series: [
        {
          name: '水质TDS(ppm)',
          type: 'line',
          smooth: true,
          data: [14.2, 13.8, 14.5, 15.1, 14.0, 13.6, 14.8, 14.1, 13.9],
          itemStyle: { color: '#38bdf8' }
        },
        {
          name: '露点温度(℃)',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          data: [-43.2, -44.1, -42.8, -43.5, -44.0, -42.1, -43.8, -44.2, -43.0],
          itemStyle: { color: '#10b981' }
        }
      ]
    });
  }

  if (pieChartRef.value) {
    pieChart = echarts.init(pieChartRef.value, 'dark');
    pieChart.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item' },
      series: [
        {
          name: '运行模式',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          label: { show: true, color: '#94a3b8' },
          data: [
            { value: 3, name: '正常巡检', itemStyle: { color: '#0284c7' } },
            { value: 1, name: '绿色节能', itemStyle: { color: '#10b981' } },
            { value: 0, name: '深度消毒', itemStyle: { color: '#f59e0b' } },
            { value: 0, name: '挂起停机', itemStyle: { color: '#64748b' } }
          ]
        }
      ]
    });
  }
};

onMounted(() => {
  store.fetchOverview();
  store.fetchDevices();
  setTimeout(() => {
    initCharts();
  }, 200);
});
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.kpi-item {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 140px;
}

.kpi-title {
  font-size: 13px;
  color: var(--text-muted);
}

.kpi-value-box {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.kpi-num {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-main);
}

.kpi-unit {
  font-size: 12px;
  color: var(--text-muted);
}

.kpi-footer {
  font-size: 12px;
  color: var(--text-muted);
}

.text-success { color: #10b981; }
.text-danger { color: #ef4444; }

.charts-row {
  display: flex;
  gap: 20px;
}

.chart-card {
  height: 340px;
  display: flex;
  flex-direction: column;
}

.flex-2 { flex: 2; }
.flex-1 { flex: 1; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.sub-tip {
  font-size: 12px;
  color: var(--text-muted);
}

.chart-container {
  flex: 1;
  width: 100%;
  height: 100%;
}

.table-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
