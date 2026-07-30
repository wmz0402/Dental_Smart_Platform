<template>
  <div class="alarm-page">
    <div class="header-action">
      <div class="page-title">
        <h2>告警处置与预测性维护 (AI 预警算法)</h2>
        <span>提前72小时预警滤芯堵塞与紫外线衰减，实现从“被动响应”到“主动预防”</span>
      </div>
      <el-button type="primary" @click="loadData">刷新告警列表</el-button>
    </div>

    <!-- 顶部耗材健康预警卡片 -->
    <div class="consumables-section glass-card">
      <div class="card-header">
        <h3>智能预测性耗材维保状态看板</h3>
        <span class="sub-tip">基于算法衰减建模评估</span>
      </div>
      <div class="consumables-grid">
        <div v-for="c in consumables" :key="c.id" class="consumable-card">
          <div class="c-top">
            <span class="c-title">{{ c.item_name }}</span>
            <el-tag :type="getLifeTagType(c.life_remaining)" size="small">
              {{ c.life_remaining > 20 ? '正常' : '需替换' }}
            </el-tag>
          </div>
          <div class="c-sn">归属设备：{{ c.device_sn }}</div>
          <div class="c-progress">
            <span>剩余使用寿命: {{ c.life_remaining }}%</span>
            <el-progress :percentage="c.life_remaining" :color="getLifeColor(c.life_remaining)" />
          </div>
          <div class="c-footer">
            <span>预计到期日: {{ c.estimated_replace_date }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 异常告警列表 -->
    <div class="glass-card alarm-table-box">
      <div class="card-header mb-16">
        <h3>感控故障与风险告警日志</h3>
      </div>
      <el-table :data="alarmList" border stripe style="width: 100%">
        <el-table-column prop="id" label="告警ID" width="100" align="center" />
        <el-table-column prop="level" label="严重等级" width="140" align="center">
          <template #default="{ row }">
            <el-tag :type="row.level === 'CRITICAL' ? 'danger' : 'warning'" effect="dark">
              {{ row.level === 'CRITICAL' ? '严重告警' : '警告提醒' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="device_sn" label="设备编号" width="180" />
        <el-table-column prop="title" label="告警名称" width="220" />
        <el-table-column prop="description" label="详细故障诊断描述" min-width="280" />
        <el-table-column prop="status" label="处置状态" width="165" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'RESOLVED' ? 'success' : 'danger'">
              {{ row.status === 'RESOLVED' ? '已处置解决' : '未响应待处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="triggered_at" label="触发时间" width="200" align="center" />
        <el-table-column label="快捷操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'UNRESOLVED'"
              size="small"
              type="success"
              @click="resolveAlarm(row.id)"
            >
              标记已处置
            </el-button>
            <span v-else class="text-muted">无需操作</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';

const alarmList = ref<any[]>([]);
const consumables = ref<any[]>([]);

const loadData = async () => {
  try {
    const resA = await axios.get('/api/alarms');
    alarmList.value = resA.data;

    const resC = await axios.get('/api/consumables');
    consumables.value = resC.data;
  } catch (e) {
    console.error('加载告警数据失败', e);
  }
};

const resolveAlarm = async (id: number) => {
  try {
    await axios.post(`/api/alarms/${id}/resolve`);
    ElMessage.success(`告警 #${id} 已处置成功`);
    loadData();
  } catch (e) {
    ElMessage.error('处理失败');
  }
};

const getLifeColor = (val: number) => {
  if (val > 50) return '#10b981';
  if (val > 20) return '#f59e0b';
  return '#ef4444';
};

const getLifeTagType = (val: number) => {
  if (val > 50) return 'success';
  if (val > 20) return 'warning';
  return 'danger';
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.alarm-page {
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
  color: #f8fafc;
  font-weight: 700;
}

.page-title span {
  font-size: 13px;
  color: #94a3b8;
}

.consumables-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  border-bottom: 1px solid rgba(56, 189, 248, 0.15);
  padding-bottom: 12px;
}

.card-header h3 {
  font-size: 16px;
  color: #f8fafc;
  font-weight: 700;
}

.sub-tip {
  font-size: 12px;
  color: #64748b;
}

.consumables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
}

.consumable-card {
  background: rgba(15, 23, 42, 0.6);
  padding: 18px;
  border-radius: 8px;
  border: 1px solid rgba(56, 189, 248, 0.2);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.c-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.c-title {
  font-size: 14px;
  font-weight: 600;
  color: #f8fafc;
}

.c-sn {
  font-size: 12px;
  color: #64748b;
}

.c-progress {
  font-size: 12px;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.c-footer {
  font-size: 11px;
  color: #64748b;
}

.alarm-table-box {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mb-16 {
  margin-bottom: 16px;
}

.text-muted {
  font-size: 12px;
  color: #64748b;
}
</style>
