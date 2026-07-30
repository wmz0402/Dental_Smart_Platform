<template>
  <el-container class="app-layout">
    <!-- 未登录状态：渲染纯净全屏登录页 -->
    <template v-if="!userStore.isLoggedIn">
      <router-view />
    </template>

    <!-- 已登录状态：渲染整体科技感控制台主框架 -->
    <template v-else>
      <el-aside width="240px" class="sidebar">
        <div class="logo-area flex-align">
          <img :src="logoSvg" class="logo-icon-img" alt="Logo" />
          <div class="logo-text">
            <h1>智护牙境</h1>
            <p>口腔智能感控平台</p>
          </div>
        </div>

        <el-menu
          :default-active="$route.path"
          router
          class="sidebar-menu"
          background-color="transparent"
          text-color="#94a3b8"
          active-text-color="#38bdf8"
        >
          <el-menu-item index="/">
            <el-icon><DataBoard /></el-icon>
            <span>全局监控概览</span>
          </el-menu-item>
          <el-menu-item index="/water">
            <el-icon><Filter /></el-icon>
            <span>水源消毒处理系统</span>
          </el-menu-item>
          <el-menu-item index="/air">
            <el-icon><WindPower /></el-icon>
            <span>气源洁净处理系统</span>
          </el-menu-item>
          <el-menu-item index="/telemetry">
            <el-icon><TrendCharts /></el-icon>
            <span>实时遥测与数据流</span>
          </el-menu-item>
          <el-menu-item index="/alarm">
            <el-icon><Warning /></el-icon>
            <span>告警与预测性维护</span>
          </el-menu-item>
          <el-menu-item index="/reports">
            <el-icon><Document /></el-icon>
            <span>感控合规报表</span>
          </el-menu-item>
          <el-menu-item index="/settings">
            <el-icon><Setting /></el-icon>
            <span>系统与机构配置</span>
          </el-menu-item>
        </el-menu>

        <div class="sidebar-footer">
          <span class="status-dot green"></span>
          <span>云端数据链路实时通畅</span>
        </div>
      </el-aside>

      <el-container class="main-container">
        <!-- 顶部全宽亮底黑蓝科技导航头 -->
        <el-header height="64px" class="header flex-between">
          <div class="header-left flex-align">
            <span class="clinic-tag">示范总院中心控制台</span>
          </div>

          <div class="header-right flex-align">
            <!-- 经典深浅主题转换按钮 -->
            <el-tooltip :content="userStore.isDarkTheme ? '切换为浅色明亮模式' : '切换为深色科技模式'" placement="bottom">
              <el-button circle class="theme-toggle-btn" @click="userStore.toggleTheme">
                <el-icon v-if="userStore.isDarkTheme"><Sunny /></el-icon>
                <el-icon v-else><Moon /></el-icon>
              </el-button>
            </el-tooltip>

            <!-- 系统实时打卡时间 -->
            <div class="system-time">
              <el-icon><Clock /></el-icon>
              <span>{{ currentTime }}</span>
            </div>

            <!-- 用户信息精美区域 (圆形头像 + 下拉菜单) -->
            <el-dropdown trigger="click" popper-class="user-dropdown-popper" @command="handleUserCommand">
              <div class="user-profile flex-align">
                <el-avatar
                  :size="36"
                  :src="userStore.user?.avatar"
                  class="user-avatar"
                >
                  {{ userAvatarInitial }}
                </el-avatar>
                <div class="user-info">
                  <span class="user-email">{{ userStore.user?.email || 'admin@qq.com' }}</span>
                  <span class="user-role">{{ userRoleLabel }}</span>
                </div>
              </div>
              <template #dropdown>
                <el-dropdown-menu class="user-dropdown-menu">
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>
                    <span>个人信息设置</span>
                  </el-dropdown-item>
                  <el-dropdown-item command="logout" divided class="logout-item">
                    <el-icon><SwitchButton /></el-icon>
                    <span>退出登录</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <!-- 主内容容器 -->
        <el-main class="content-area">
          <router-view />
        </el-main>
      </el-container>

      <!-- 个人信息中心对话框 -->
      <el-dialog v-model="showProfileDialog" title="个人信息中心" width="520px" destroy-on-close>
        <el-form label-position="top" class="profile-form">
          <el-form-item label="修改头像">
            <div class="avatar-edit-box">
              <el-avatar :size="64" :src="profileForm.avatar" class="large-avatar">
                {{ userAvatarInitial }}
              </el-avatar>
              <div class="upload-btn-wrap">
                <el-button type="primary" size="small" @click="triggerAvatarUpload">从本地选择图片</el-button>
                <input
                  type="file"
                  ref="avatarInputRef"
                  accept="image/*"
                  style="display: none"
                  @change="onAvatarFileSelected"
                />
                <p class="tip-text">支持 JPG、PNG 格式本地图片上传</p>
              </div>
            </div>
          </el-form-item>

          <el-form-item label="绑定电子邮箱">
            <el-input v-model="profileForm.email" disabled size="large" />
          </el-form-item>

          <el-form-item label="修改用户名 / 称谓">
            <el-input v-model="profileForm.realName" placeholder="请输入新的用户名" size="large" />
          </el-form-item>

          <el-divider content-position="left">修改登录密码</el-divider>

          <el-form-item label="原旧密码">
            <el-input
              v-model="pwdForm.oldPassword"
              type="password"
              show-password
              placeholder="需要先验证原旧密码"
              size="large"
            />
          </el-form-item>

          <el-form-item label="设置新密码">
            <el-input
              v-model="pwdForm.newPassword"
              type="password"
              show-password
              placeholder="请输入新的登录密码"
              size="large"
            />
          </el-form-item>
        </el-form>

        <template #footer>
          <div class="dialog-footer flex-between">
            <el-button type="danger" plain @click="handleDeleteAccount">注销当前账户</el-button>
            <div>
              <el-button @click="showProfileDialog = false">取消</el-button>
              <el-button type="primary" @click="saveProfile">保存个人信息</el-button>
            </div>
          </div>
        </template>
      </el-dialog>
    </template>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import logoSvg from './assets/logo.svg';
import { useUserStore } from '@/stores/userStore';
import { useDeviceStore } from '@/stores/deviceStore';
import {
  DataBoard,
  Filter,
  WindPower,
  TrendCharts,
  Warning,
  Document,
  Setting,
  Clock,
  User,
  SwitchButton,
  Sunny,
  Moon
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();
const userStore = useUserStore();
const deviceStore = useDeviceStore();

const currentTime = ref('');
let timer: any = null;

const showProfileDialog = ref(false);
const avatarInputRef = ref<HTMLInputElement | null>(null);

const profileForm = ref({
  email: '',
  realName: '',
  avatar: ''
});

const pwdForm = ref({
  oldPassword: '',
  newPassword: ''
});

const updateClock = () => {
  const now = new Date();
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const userAvatarInitial = computed(() => {
  const name = userStore.user?.realName || userStore.user?.email || 'A';
  return name.charAt(0).toUpperCase();
});

const userRoleLabel = computed(() => {
  if (userStore.user?.role === 'ADMIN') return '超级管理员';
  return '诊疗医师';
});

const handleUserCommand = (command: string) => {
  if (command === 'profile') {
    openProfileDialog();
  } else if (command === 'logout') {
    userStore.logout();
    ElMessage.success('已安全退出登录');
    router.push('/login');
  }
};

const openProfileDialog = () => {
  profileForm.value.email = userStore.user?.email || '';
  profileForm.value.realName = userStore.user?.realName || '';
  profileForm.value.avatar = userStore.user?.avatar || '';
  pwdForm.value.oldPassword = '';
  pwdForm.value.newPassword = '';
  showProfileDialog.value = true;
};

const triggerAvatarUpload = () => {
  avatarInputRef.value?.click();
};

const onAvatarFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;

  const file = target.files[0];
  if (file.size > 5 * 1024 * 1024) {
    return ElMessage.error('选择图片不能超过 5MB');
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target?.result as string;
    compressImage(base64, 300, 300, 0.85, (compressedBase64) => {
      profileForm.value.avatar = compressedBase64;
      ElMessage.success('头像文件选择成功');
    });
  };
  reader.readAsDataURL(file);
};

const compressImage = (base64Str: string, maxWidth: number, maxHeight: number, quality: number, callback: (result: string) => void) => {
  const img = new Image();
  img.src = base64Str;
  img.onload = () => {
    let width = img.width;
    let height = img.height;

    if (width > maxWidth || height > maxHeight) {
      if (width > height) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      } else {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(img, 0, 0, width, height);

    const compressed = canvas.toDataURL('image/jpeg', quality);
    callback(compressed);
  };
};

const saveProfile = async () => {
  try {
    if (pwdForm.value.oldPassword || pwdForm.value.newPassword) {
      if (!pwdForm.value.oldPassword || !pwdForm.value.newPassword) {
        return ElMessage.error('修改密码需要同时填写旧密码与新密码');
      }
      await userStore.changePassword(pwdForm.value.oldPassword, pwdForm.value.newPassword);
    }

    await userStore.updateProfile(profileForm.value.realName, profileForm.value.avatar);
    ElMessage.success('个人信息修改保存成功');
    showProfileDialog.value = false;
  } catch (err: any) {
    ElMessage.error(err.message || '保存个人信息失败');
  }
};

const handleDeleteAccount = () => {
  ElMessageBox.confirm(
    '注销账户将清除您的所有个人关联数据，该操作不可撤销，确认继续？',
    '确认注销账户',
    {
      confirmButtonText: '确认注销',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await userStore.deleteAccount();
      ElMessage.success('账户已成功注销');
      router.push('/login');
    } catch (e: any) {
      ElMessage.error(e.message || '注销失败');
    }
  }).catch(() => {});
};

onMounted(() => {
  updateClock();
  timer = setInterval(updateClock, 1000);
  if (userStore.isLoggedIn) {
    deviceStore.fetchDevices();
    deviceStore.fetchOverview();
  }
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.app-layout {
  width: 100%;
  min-height: 100vh;
  background-color: var(--bg-dark);
}

.sidebar {
  background-color: #0b1120 !important;
  border-right: 1px solid rgba(56, 189, 248, 0.12);
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: sticky;
  top: 0;
  z-index: 100;
}

:global(html.light-theme) .sidebar {
  background-color: #ffffff !important;
  border-right: 1px solid #e2e8f0 !important;
}

.logo-area {
  padding: 20px;
  gap: 12px;
  border-bottom: 1px solid rgba(56, 189, 248, 0.1);
}

:global(html.light-theme) .logo-area {
  border-bottom: 1px solid #f1f5f9;
}

.logo-icon-img {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  object-fit: contain;
  filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.4));
}

:global(html.light-theme) .logo-icon-img {
  filter: drop-shadow(0 2px 6px rgba(37, 99, 235, 0.2));
}

.logo-text h1 {
  font-size: 16px;
  color: var(--text-main);
  font-weight: 700;
}

.logo-text p {
  font-size: 10px;
  color: var(--accent-cyan);
}

:global(html.light-theme) .logo-text p {
  color: #2563eb;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
  padding-top: 12px;
}

:deep(.el-menu-item) {
  height: 48px;
  margin: 4px 12px;
  border-radius: 8px;
}

.sidebar-footer {
  padding: 16px 20px;
  font-size: 12px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 8px;
  border-top: 1px solid rgba(56, 189, 248, 0.1);
}

:global(html.light-theme) .sidebar-footer {
  border-top: 1px solid #f1f5f9;
  color: #64748b;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.green {
  background-color: var(--success-color);
  box-shadow: 0 0 8px var(--success-color);
}

.header {
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(56, 189, 248, 0.12);
  padding: 0 24px;
}

:global(html.light-theme) .header {
  background: linear-gradient(135deg, #2b529a 0%, #3b629b 100%) !important;
  border-bottom: 1px solid #254685 !important;
  color: #ffffff !important;
}

.clinic-tag {
  background: rgba(2, 132, 199, 0.15);
  color: var(--accent-cyan);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

:global(html.light-theme) .clinic-tag {
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.35);
}

.header-right {
  gap: 20px;
}

.theme-toggle-btn {
  background: rgba(30, 41, 59, 0.8) !important;
  border: 1px solid rgba(56, 189, 248, 0.3) !important;
  color: #38bdf8 !important;
}

:global(html.light-theme) .theme-toggle-btn {
  background: rgba(255, 255, 255, 0.15) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  color: #ffffff !important;
}

.theme-toggle-btn:hover {
  background: rgba(56, 189, 248, 0.2) !important;
}

.system-time {
  color: var(--text-secondary);
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

:global(html.light-theme) .system-time {
  color: #e2e8f0;
}

.user-profile {
  cursor: pointer;
  gap: 10px;
  padding: 4px 8px;
  border-radius: 20px;
  transition: background-color 0.2s;
}

.user-profile:hover {
  background: rgba(255, 255, 255, 0.05);
}

.user-avatar {
  background: linear-gradient(135deg, #0284c7 0%, #38bdf8 100%);
  color: #fff;
  font-weight: 700;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-email {
  font-size: 13px;
  color: #ffffff !important;
  font-weight: 600;
  line-height: 1.2;
}

.user-role {
  font-size: 11px;
  color: #38bdf8 !important;
}

:global(html.light-theme) .user-email {
  color: #ffffff !important;
}

:global(html.light-theme) .user-role {
  color: #93c5fd !important;
}

.content-area {
  padding: 24px;
}

.avatar-edit-box {
  display: flex;
  align-items: center;
  gap: 20px;
}

.large-avatar {
  background: linear-gradient(135deg, #0284c7 0%, #38bdf8 100%);
  color: #fff;
  font-size: 24px;
  font-weight: 700;
}

.upload-btn-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tip-text {
  font-size: 12px;
  color: #64748b;
}

.logout-item {
  color: #ef4444 !important;
}
</style>
