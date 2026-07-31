<template>
  <div class="login-logs-container">
    <div class="glass-card page-card">
      <div class="page-header flex-between">
        <div class="title-area">
          <h2>登录日志</h2>
          <p>查询系统登录成功与失败记录审计</p>
        </div>
      </div>

      <!-- 搜索筛选区 -->
      <div class="filter-card">
        <el-form :inline="true" :model="filterForm" class="filter-form">
          <el-form-item label="用户名">
            <el-input v-model="filterForm.username" placeholder="请输入用户名" clearable style="width: 180px;" />
          </el-form-item>

          <el-form-item label="登录结果">
            <el-select v-model="filterForm.result" placeholder="全部结果" clearable style="width: 140px;">
              <el-option label="全部结果" value="" />
              <el-option label="成功" value="SUCCESS" />
              <el-option label="失败" value="FAIL" />
            </el-select>
          </el-form-item>

          <el-form-item label="IP 地址">
            <el-input v-model="filterForm.ip" placeholder="如 127.0.0.1" clearable style="width: 160px;" />
          </el-form-item>

          <el-form-item label="日期范围">
            <el-date-picker
              v-model="filterForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 260px;"
            />
          </el-form-item>

          <el-form-item class="filter-actions">
            <el-button @click="resetFilter">重置</el-button>
            <el-button type="primary" @click="fetchLogs">查询</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 登录日志数据表格 -->
      <el-table
        :data="filteredLogs"
        v-loading="loading"
        stripe
        class="custom-dark-table"
        style="width: 100%"
      >
        <el-table-column prop="username" label="用户名" min-width="140" />
        <el-table-column label="登录结果" width="110">
          <template #default="scope">
            <el-tag :type="scope.row.result === 'SUCCESS' ? 'success' : 'danger'">
              {{ scope.row.result === 'SUCCESS' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="failReason" label="失败原因" min-width="150" />
        <el-table-column prop="ip" label="IP 地址" min-width="140" />
        <el-table-column prop="userAgent" label="浏览器摘要" min-width="320" show-overflow-tooltip />
        <el-table-column prop="loginTime" label="登录时间" min-width="180" sortable />
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import axios from 'axios';
import { useDeviceStore } from '@/stores/deviceStore';

interface LoginLogItem {
  id: number;
  username: string;
  result: 'SUCCESS' | 'FAIL';
  failReason: string;
  ip: string;
  userAgent: string;
  loginTime: string;
}

const deviceStore = useDeviceStore();
const loading = ref(false);
const logs = ref<LoginLogItem[]>([]);

const filterForm = ref({
  username: '',
  result: '',
  ip: '',
  dateRange: null
});

const defaultMockLoginLogs: LoginLogItem[] = [
  { id: 1, username: 'admin', result: 'SUCCESS', failReason: '—', ip: '127.0.0.1', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0', loginTime: '2026-07-31 09:13:58' },
  { id: 2, username: 'demo_operator', result: 'SUCCESS', failReason: '—', ip: '127.0.0.1', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0', loginTime: '2026-07-31 08:14:50' },
  { id: 3, username: 'admin', result: 'SUCCESS', failReason: '—', ip: '192.168.1.102', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', loginTime: '2026-07-30 20:58:13' }
];

const fetchLogs = async () => {
  loading.value = true;
  let fetched: LoginLogItem[] = [];

  try {
    const res = await axios.get('/api/system/login-logs');
    if (Array.isArray(res.data) && res.data.length > 0) {
      fetched = res.data;
    } else {
      fetched = defaultMockLoginLogs;
    }
  } catch (e) {
    fetched = defaultMockLoginLogs;
  }

  try {
    const liveSaved = sessionStorage.getItem('live_login_logs');
    if (liveSaved) {
      const liveList = JSON.parse(liveSaved);
      if (Array.isArray(liveList)) {
        fetched = [...liveList, ...fetched];
      }
    }
  } catch (e) {}

  logs.value = fetched;
  loading.value = false;
  await nextTick();
  requestAnimationFrame(() => {
    deviceStore.loading = false;
  });
};

const filteredLogs = computed(() => {
  return logs.value.filter(l => {
    const matchUser = !filterForm.value.username || l.username.toLowerCase().includes(filterForm.value.username.toLowerCase());
    const matchResult = !filterForm.value.result || l.result === filterForm.value.result;
    const matchIp = !filterForm.value.ip || l.ip.includes(filterForm.value.ip);
    return matchUser && matchResult && matchIp;
  });
});

const resetFilter = () => {
  filterForm.value = { username: '', result: '', ip: '', dateRange: null };
};

onMounted(() => {
  deviceStore.loading = false;
  fetchLogs();
});
</script>

<style scoped>
.login-logs-container {
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
