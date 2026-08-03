<template>
  <div class="op-logs-container">
    <div class="glass-card page-card">
      <div class="page-header flex-between">
        <div class="title-area">
          <h2>操作日志</h2>
          <p>审计关键业务操作及其执行结果与安全追踪</p>
        </div>
      </div>

      <!-- 顶栏条件筛选 -->
      <div class="filter-card">
        <el-form :inline="true" :model="filterForm" class="filter-form">
          <el-form-item label="操作用户">
            <el-input v-model="filterForm.operator" placeholder="请输入用户名" clearable style="width: 160px;" />
          </el-form-item>

          <el-form-item label="业务模块">
            <el-select v-model="filterForm.module" placeholder="全部模块" clearable style="width: 150px;">
              <el-option label="全部模块" value="" />
              <el-option label="告警运维 (ALARM)" value="ALARM" />
              <el-option label="设备管控 (DEVICE)" value="DEVICE" />
              <el-option label="工单系统 (WORK_ORDER)" value="WORK_ORDER" />
              <el-option label="用户管理 (USER)" value="USER" />
              <el-option label="角色管理 (ROLE)" value="ROLE" />
            </el-select>
          </el-form-item>

          <el-form-item label="结果状态">
            <el-select v-model="filterForm.result" placeholder="全部状态" clearable style="width: 130px;">
              <el-option label="全部状态" value="" />
              <el-option label="成功" value="SUCCESS" />
              <el-option label="失败" value="FAIL" />
            </el-select>
          </el-form-item>

          <el-form-item label="日期时间">
            <el-date-picker
              v-model="filterForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              style="width: 250px;"
            />
          </el-form-item>

          <el-form-item class="filter-actions">
            <el-button @click="resetFilter">重置</el-button>
            <el-button type="primary" @click="fetchOpLogs">查询</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table
        :data="filteredLogs"
        v-loading="loading && !deviceStore.loading"
        stripe
        class="custom-dark-table"
        style="width: 100%"
      >
        <el-table-column prop="operator" label="操作用户" min-width="140" />
        <el-table-column prop="module" label="业务模块" min-width="130">
          <template #default="scope">
            <el-tag type="info" size="small">{{ scope.row.module }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="actionName" label="操作名称" min-width="160" />
        <el-table-column prop="method" label="方法" width="90">
          <template #default="scope">
            <span class="method-badge" :class="scope.row.method.toLowerCase()">{{ scope.row.method }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="targetType" label="目标类型" min-width="120" />
        <el-table-column prop="targetId" label="目标 ID" min-width="130" />
        <el-table-column label="结果" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.result === 'SUCCESS' ? 'success' : 'danger'" size="small">
              {{ scope.row.result === 'SUCCESS' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="耗时" width="90" align="center" />
        <el-table-column prop="ip" label="IP 地址" min-width="130" />
        <el-table-column prop="opTime" label="操作时间" min-width="170" sortable />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="scope">
            <el-button type="primary" link size="small" @click="viewDetail(scope.row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 Wrap -->
      <div class="pagination-wrap flex-between">
        <span class="total-text">共 {{ filteredLogs.length }} 条审计记录</span>
        <el-pagination
          layout="prev, pager, next"
          :total="filteredLogs.length"
          :page-size="10"
        />
      </div>
    </div>

    <!-- 操作日志详情 JSON 弹窗 -->
    <el-dialog v-model="showDetailDialog" title="操作审计日志详情" width="560px">
      <div class="detail-json-box">
        <pre>{{ currentDetailJson }}</pre>
      </div>
      <template #footer>
        <el-button type="primary" @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { useDeviceStore } from '@/stores/deviceStore';
import { usePageLoading } from '@/composables/usePageLoading';

interface OpLogItem {
  id: number;
  operator: string;
  module: string;
  actionName: string;
  method: string;
  targetType: string;
  targetId: string;
  result: 'SUCCESS' | 'FAIL';
  duration: string;
  ip: string;
  opTime: string;
}

const deviceStore = useDeviceStore();
const { withLoading } = usePageLoading();
const loading = ref(false);
const logs = ref<OpLogItem[]>([]);

const filterForm = ref({
  operator: '',
  module: '',
  result: '',
  dateRange: null
});

const showDetailDialog = ref(false);
const currentDetailJson = ref('');

const defaultMockOpLogs: OpLogItem[] = [
  { id: 1, operator: 'admin', module: 'ALARM', actionName: '关闭严重告警', method: 'POST', targetType: 'ALARM', targetId: '101', result: 'SUCCESS', duration: '6 ms', ip: '127.0.0.1', opTime: '2026-07-31 09:20:15' },
  { id: 2, operator: 'demo_operator', module: 'WORK_ORDER', actionName: '完成水路保养工单', method: 'POST', targetType: 'WORK_ORDER', targetId: '11', result: 'SUCCESS', duration: '8 ms', ip: '127.0.0.1', opTime: '2026-07-31 08:39:16' },
  { id: 3, operator: 'demo_operator', module: 'WORK_ORDER', actionName: '添加工单备注说明', method: 'POST', targetType: 'WORK_ORDER', targetId: '11', result: 'SUCCESS', duration: '4 ms', ip: '127.0.0.1', opTime: '2026-07-31 08:39:15' },
  { id: 4, operator: 'admin', module: 'DEVICE', actionName: '切换消毒工作模式', method: 'POST', targetType: 'DEVICE', targetId: 'W-SYS-2026-01', result: 'SUCCESS', duration: '12 ms', ip: '127.0.0.1', opTime: '2026-07-30 19:12:44' }
];

const fetchOpLogs = async () => {
  loading.value = true;
  try {
    const res = await axios.get('/api/system/op-logs');
    if (Array.isArray(res.data) && res.data.length > 0) {
      logs.value = res.data;
    } else {
      logs.value = defaultMockOpLogs;
    }
  } catch (e) {
    logs.value = defaultMockOpLogs;
  } finally {
    loading.value = false;
  }
};

const filteredLogs = computed(() => {
  return logs.value.filter(l => {
    const matchOp = !filterForm.value.operator || l.operator.toLowerCase().includes(filterForm.value.operator.toLowerCase());
    const matchMod = !filterForm.value.module || l.module === filterForm.value.module;
    const matchRes = !filterForm.value.result || l.result === filterForm.value.result;
    return matchOp && matchMod && matchRes;
  });
});

const resetFilter = () => {
  filterForm.value = { operator: '', module: '', result: '', dateRange: null };
};

const viewDetail = (row: OpLogItem) => {
  currentDetailJson.value = JSON.stringify({
    logId: row.id,
    operator: row.operator,
    module: row.module,
    action: row.actionName,
    method: row.method,
    target: { type: row.targetType, id: row.targetId },
    execution: { status: row.result, duration: row.duration, clientIp: row.ip },
    timestamp: row.opTime,
    requestPayload: { sampleParam: 'active', traceId: `trace-${Date.now()}` }
  }, null, 2);
  showDetailDialog.value = true;
};

onMounted(async () => {
  await withLoading(
    [() => fetchOpLogs()],
    () => logs.value.length > 0
  );
});
</script>

<style scoped>
.op-logs-container {
  width: 100%;
}

.page-card {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.title-area h2 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
}

.title-area p {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

.filter-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px 20px 0 20px;
}

:global(html.light-theme) .filter-card {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
}

.method-badge {
  font-weight: 700;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
}

.method-badge.post {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.15);
}

.method-badge.put {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.15);
}

.method-badge.get {
  color: #10b981;
  background: rgba(16, 185, 129, 0.15);
}

.detail-json-box {
  background: #090d16;
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 6px;
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

:global(html.light-theme) .detail-json-box {
  background: #f1f5f9 !important;
  border: 1px solid #cbd5e1 !important;
}

.detail-json-box pre {
  margin: 0;
  font-family: monospace;
  font-size: 13px;
  color: #38bdf8;
  white-space: pre-wrap;
}

:global(html.light-theme) .detail-json-box pre {
  color: #0284c7 !important;
}

.pagination-wrap {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.total-text {
  font-size: 13px;
  color: var(--text-muted);
}
</style>
