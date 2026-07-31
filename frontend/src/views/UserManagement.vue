<template>
  <div class="user-management-container">
    <div class="glass-card page-card">
      <div class="page-header flex-between">
        <div class="title-area">
          <h2>用户管理</h2>
          <p>管理平台登录账号、显示名称、所属角色与账号状态</p>
        </div>
      </div>

      <!-- 顶栏搜索筛选条件 -->
      <div class="filter-card">
        <el-form :inline="true" :model="filterForm" class="filter-form">
          <el-form-item label="关键字">
            <el-input
              v-model="filterForm.keyword"
              placeholder="用户名 / 显示名称"
              clearable
              style="width: 220px;"
            />
          </el-form-item>

          <el-form-item label="账号状态">
            <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 150px;">
              <el-option label="全部" value="" />
              <el-option label="启用" value="ACTIVE" />
              <el-option label="禁用" value="INACTIVE" />
            </el-select>
          </el-form-item>

          <el-form-item label="角色">
            <el-select v-model="filterForm.role" placeholder="全部" clearable style="width: 160px;">
              <el-option label="全部" value="" />
              <el-option label="超级管理员" value="SUPER_ADMIN" />
              <el-option label="系统管理员" value="SYSTEM_ADMIN" />
              <el-option label="运维人员" value="OPERATOR" />
            </el-select>
          </el-form-item>

          <el-form-item class="filter-actions">
            <el-button @click="resetFilter">重置</el-button>
            <el-button type="primary" @click="fetchUsers">搜索</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 操作按钮栏 -->
      <div class="table-actions flex-between">
        <el-button type="primary" class="add-btn" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>
          <span>新增用户</span>
        </el-button>

        <div class="table-right-tools">
          <el-button circle size="small" @click="fetchUsers">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- 用户数据列表表格 -->
      <el-table
        :data="filteredUsers"
        v-loading="loading"
        stripe
        class="custom-dark-table"
        style="width: 100%"
      >
        <el-table-column prop="username" label="用户名" min-width="140" />
        <el-table-column prop="realName" label="显示名称" min-width="140" />
        <el-table-column label="角色" min-width="130">
          <template #default="scope">
            <el-tag :type="getRoleTagType(scope.row.role)" effect="light">
              {{ scope.row.roleName || scope.row.role }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="账号状态" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'ACTIVE' ? 'success' : 'danger'" rounded>
              <span class="status-dot-inline" :class="scope.row.status === 'ACTIVE' ? 'green' : 'red'"></span>
              {{ scope.row.status === 'ACTIVE' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastLogin" label="最后登录时间" min-width="180" />
        <el-table-column prop="createdAt" label="创建时间" min-width="180" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="scope">
            <el-button type="primary" link size="small" @click="openEditDialog(scope.row)">编辑</el-button>
            <el-button
              :type="scope.row.status === 'ACTIVE' ? 'danger' : 'success'"
              link
              size="small"
              @click="toggleUserStatus(scope.row)"
            >
              {{ scope.row.status === 'ACTIVE' ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页栏 -->
      <div class="pagination-wrap flex-between">
        <span class="total-text">共 {{ filteredUsers.length }} 条记录</span>
        <el-pagination
          layout="prev, pager, next"
          :total="filteredUsers.length"
          :page-size="10"
        />
      </div>
    </div>

    <!-- 新增 / 编辑用户弹窗 -->
    <el-dialog
      v-model="showUserDialog"
      :title="isEditing ? '编辑用户信息' : '新增平台用户'"
      width="480px"
      destroy-on-close
    >
      <el-form label-position="top" class="dialog-form">
        <el-form-item label="登录账号用户名">
          <el-input v-model="userForm.username" :disabled="isEditing" placeholder="如 doctor_zhang" />
        </el-form-item>
        <el-form-item label="现实显示姓名">
          <el-input v-model="userForm.realName" placeholder="如 张敏 医师" />
        </el-form-item>
        <el-form-item label="分配权限角色">
          <el-select v-model="userForm.role" style="width: 100%;">
            <el-option label="超级管理员" value="SUPER_ADMIN" />
            <el-option label="系统管理员" value="SYSTEM_ADMIN" />
            <el-option label="运维人员 / 诊疗医师" value="OPERATOR" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="!isEditing" label="初始登录密码">
          <el-input v-model="userForm.password" type="password" show-password placeholder="请输入初始密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUserDialog = false">取消</el-button>
        <el-button type="primary" @click="saveUser">确认保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { Plus, Refresh } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useDeviceStore } from '@/stores/deviceStore';

interface UserItem {
  id: number;
  username: string;
  realName: string;
  role: string;
  roleName: string;
  status: 'ACTIVE' | 'INACTIVE';
  lastLogin: string;
  createdAt: string;
}

const deviceStore = useDeviceStore();
const loading = ref(false);
const users = ref<UserItem[]>([]);

const filterForm = ref({
  keyword: '',
  status: '',
  role: ''
});

const showUserDialog = ref(false);
const isEditing = ref(false);
const userForm = ref({
  id: 0,
  username: '',
  realName: '',
  role: 'OPERATOR',
  password: ''
});

const getRoleTagType = (role: string) => {
  if (role === 'SUPER_ADMIN') return 'danger';
  if (role === 'SYSTEM_ADMIN') return 'warning';
  return 'info';
};

const fetchUsers = async () => {
  loading.value = true;
  deviceStore.loading = true;
  let fetched: UserItem[] = [];

  try {
    const res = await axios.get('/api/system/users');
    if (Array.isArray(res.data)) {
      fetched = res.data;
    }
  } catch (e) {
    fetched = [
      { id: 1, username: 'admin', realName: '超级管理员', role: 'SUPER_ADMIN', roleName: '超级管理员', status: 'ACTIVE', lastLogin: '2026-07-31 09:13:58', createdAt: '2026-07-18 21:04:12' },
      { id: 2, username: 'demo_system_admin', realName: '诊所系统管理员', role: 'SYSTEM_ADMIN', roleName: '系统管理员', status: 'ACTIVE', lastLogin: '2026-07-31 08:24:12', createdAt: '2026-07-18 21:04:12' },
      { id: 3, username: 'demo_operator', realName: '诊所主治医师', role: 'OPERATOR', roleName: '运维人员', status: 'ACTIVE', lastLogin: '2026-07-30 23:01:02', createdAt: '2026-07-18 21:04:12' }
    ];
  }

  // 映射真实最新登录时间
  try {
    const mapSaved = sessionStorage.getItem('user_last_login_map');
    if (mapSaved) {
      const map = JSON.parse(mapSaved);
      fetched = fetched.map(u => {
        if (map[u.username]) {
          return { ...u, lastLogin: map[u.username] };
        }
        return u;
      });
    }
  } catch (e) {}

  users.value = fetched;
  loading.value = false;
  setTimeout(() => {
    deviceStore.loading = false;
  }, 200);
};

const filteredUsers = computed(() => {
  return users.value.filter(u => {
    const matchKw = !filterForm.value.keyword ||
      u.username.toLowerCase().includes(filterForm.value.keyword.toLowerCase()) ||
      u.realName.toLowerCase().includes(filterForm.value.keyword.toLowerCase());
    const matchStatus = !filterForm.value.status || u.status === filterForm.value.status;
    const matchRole = !filterForm.value.role || u.role === filterForm.value.role;
    return matchKw && matchStatus && matchRole;
  });
});

const resetFilter = () => {
  filterForm.value = { keyword: '', status: '', role: '' };
};

const openCreateDialog = () => {
  isEditing.value = false;
  userForm.value = { id: 0, username: '', realName: '', role: 'OPERATOR', password: 'password123' };
  showUserDialog.value = true;
};

const openEditDialog = (row: UserItem) => {
  isEditing.value = true;
  userForm.value = { id: row.id, username: row.username, realName: row.realName, role: row.role, password: '' };
  showUserDialog.value = true;
};

const saveUser = () => {
  if (!userForm.value.username || !userForm.value.realName) {
    return ElMessage.error('请完整填写用户名与现实姓名');
  }

  if (isEditing.value) {
    const target = users.value.find(u => u.id === userForm.value.id);
    if (target) {
      target.realName = userForm.value.realName;
      target.role = userForm.value.role;
      target.roleName = userForm.value.role === 'SUPER_ADMIN' ? '超级管理员' : (userForm.value.role === 'SYSTEM_ADMIN' ? '系统管理员' : '运维人员');
    }
    ElMessage.success('用户信息更改保存成功');
  } else {
    const roleName = userForm.value.role === 'SUPER_ADMIN' ? '超级管理员' : (userForm.value.role === 'SYSTEM_ADMIN' ? '系统管理员' : '运维人员');
    users.value.unshift({
      id: Date.now(),
      username: userForm.value.username,
      realName: userForm.value.realName,
      role: userForm.value.role,
      roleName,
      status: 'ACTIVE',
      lastLogin: '尚未登录',
      createdAt: new Date().toLocaleString('zh-CN')
    });
    ElMessage.success('新用户成功添加');
  }
  showUserDialog.value = false;
};

const toggleUserStatus = (row: UserItem) => {
  const actionText = row.status === 'ACTIVE' ? '禁用' : '启用';
  ElMessageBox.confirm(`确认要${actionText}用户 "${row.realName}" 的登录权限吗？`, '提示', { type: 'warning' })
    .then(() => {
      row.status = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      ElMessage.success(`已成功${actionText}用户 ${row.realName}`);
    }).catch(() => {});
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.user-management-container {
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

.table-actions {
  margin-top: 4px;
}

.status-dot-inline {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 6px;
}

.status-dot-inline.green {
  background: #10b981;
}

.status-dot-inline.red {
  background: #ef4444;
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
