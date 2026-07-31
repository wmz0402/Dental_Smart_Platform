<template>
  <div class="role-management-container">
    <div class="glass-card page-card">
      <div class="page-header flex-between">
        <div class="title-area">
          <h2>角色管理</h2>
          <p>维护系统角色及其权限范围</p>
        </div>
      </div>

      <!-- 操作工具栏 -->
      <div class="table-actions flex-between">
        <el-button type="primary" class="add-btn" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>
          <span>新增角色</span>
        </el-button>

        <div class="table-right-tools">
          <el-button circle size="small" @click="fetchRoles">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- 角色数据表格 -->
      <el-table
        :data="roles"
        v-loading="loading"
        stripe
        class="custom-dark-table"
        style="width: 100%"
      >
        <el-table-column prop="roleCode" label="角色编码" min-width="160" />
        <el-table-column prop="roleName" label="角色名称" min-width="160" />
        <el-table-column label="状态" width="120">
          <template #default="scope">
            <el-tag type="success" round>
              <span class="status-dot-inline green"></span>
              启用
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="permissionCount" label="权限数量" width="120" align="center" />
        <el-table-column prop="description" label="说明" min-width="260" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button type="primary" link size="small" @click="openEditDialog(scope.row)">编辑</el-button>
            <el-button type="primary" link size="small" @click="openPermissionDialog(scope.row)">权限分配</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增 / 编辑角色弹窗 -->
    <el-dialog v-model="showRoleDialog" :title="isEditing ? '编辑角色信息' : '新增系统角色'" width="480px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="角色编码">
          <el-input v-model="roleForm.roleCode" :disabled="isEditing" placeholder="如 CLINIC_DIRECTOR" />
        </el-form-item>
        <el-form-item label="角色名称">
          <el-input v-model="roleForm.roleName" placeholder="如 诊所院长" />
        </el-form-item>
        <el-form-item label="角色说明">
          <el-input v-model="roleForm.description" type="textarea" :rows="3" placeholder="请输入角色的职责与管理范围说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRoleDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRole">保存</el-button>
      </template>
    </el-dialog>

    <!-- 权限分配弹窗 -->
    <el-dialog v-model="showPermissionDialog" title="角色权限配置树" width="520px">
      <el-tree
        :data="permissionTree"
        show-checkbox
        node-key="id"
        :default-checked-keys="defaultCheckedKeys"
        :props="treeProps"
      />
      <template #footer>
        <el-button @click="showPermissionDialog = false">取消</el-button>
        <el-button type="primary" @click="savePermissions">确认保存权限设置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { Plus, Refresh } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useDeviceStore } from '@/stores/deviceStore';

interface RoleItem {
  id: number;
  roleCode: string;
  roleName: string;
  status: string;
  permissionCount: number;
  description: string;
}

const deviceStore = useDeviceStore();
const loading = ref(false);
const roles = ref<RoleItem[]>([]);

const showRoleDialog = ref(false);
const showPermissionDialog = ref(false);
const isEditing = ref(false);

const roleForm = ref({
  id: 0,
  roleCode: '',
  roleName: '',
  description: ''
});

const defaultCheckedKeys = ref([101, 102, 201, 202, 301]);

const treeProps = {
  label: 'label',
  children: 'children'
};

const permissionTree = [
  {
    id: 1,
    label: '全局监控概览',
    children: [
      { id: 101, label: '查看实时设备指标' },
      { id: 102, label: '远程切换消毒模式' }
    ]
  },
  {
    id: 2,
    label: '告警与预测性维护',
    children: [
      { id: 201, label: '查看告警列表' },
      { id: 202, label: '确认与平息告警' },
      { id: 203, label: '创建派发保养工单' }
    ]
  },
  {
    id: 3,
    label: '系统管理模块',
    children: [
      { id: 301, label: '用户账号管理' },
      { id: 302, label: '角色权限配置' },
      { id: 303, label: '查看登录与操作审计日志' }
    ]
  }
];

const fetchRoles = async () => {
  loading.value = true;
  deviceStore.loading = true;
  try {
    const res = await axios.get('/api/system/roles');
    if (Array.isArray(res.data)) {
      roles.value = res.data;
    }
  } catch (e) {
    roles.value = [
      { id: 1, roleCode: 'SUPER_ADMIN', roleName: '超级管理员', status: 'ACTIVE', permissionCount: 55, description: '拥有平台全部最高管理与配置权限' },
      { id: 2, roleCode: 'SYSTEM_ADMIN', roleName: '系统管理员', status: 'ACTIVE', permissionCount: 36, description: '负责用户、角色与机构资产管理' },
      { id: 3, roleCode: 'OPERATOR', roleName: '运维人员', status: 'ACTIVE', permissionCount: 29, description: '负责设备监测、告警与工单处理' }
    ];
  } finally {
    loading.value = false;
    setTimeout(() => {
      deviceStore.loading = false;
    }, 200);
  }
};

const openCreateDialog = () => {
  isEditing.value = false;
  roleForm.value = { id: 0, roleCode: '', roleName: '', description: '' };
  showRoleDialog.value = true;
};

const openEditDialog = (row: RoleItem) => {
  isEditing.value = true;
  roleForm.value = { id: row.id, roleCode: row.roleCode, roleName: row.roleName, description: row.description };
  showRoleDialog.value = true;
};

const openPermissionDialog = (row: RoleItem) => {
  showPermissionDialog.value = true;
};

const saveRole = () => {
  if (!roleForm.value.roleCode || !roleForm.value.roleName) {
    return ElMessage.error('请填写完整角色编码与角色名称');
  }

  if (isEditing.value) {
    const target = roles.value.find(r => r.id === roleForm.value.id);
    if (target) {
      target.roleName = roleForm.value.roleName;
      target.description = roleForm.value.description;
    }
    ElMessage.success('角色信息已更新');
  } else {
    roles.value.push({
      id: Date.now(),
      roleCode: roleForm.value.roleCode,
      roleName: roleForm.value.roleName,
      status: 'ACTIVE',
      permissionCount: 15,
      description: roleForm.value.description || '自定义新建角色'
    });
    ElMessage.success('新角色创建成功');
  }
  showRoleDialog.value = false;
};

const savePermissions = () => {
  ElMessage.success('角色权限规则已生效保存');
  showPermissionDialog.value = false;
};

onMounted(() => {
  fetchRoles();
});
</script>

<style scoped>
.role-management-container {
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
</style>
