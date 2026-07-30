<template>
  <div class="app-layout" :class="{ 'light-mode': !userStore.isDarkTheme }">
    <!-- 侧边导航栏 (非登录页显示) -->
    <aside v-if="route.path !== '/login'" class="sidebar">
      <div class="logo-box">
        <div class="logo-icon"></div>
        <div class="logo-text">
          <h2>智护牙境</h2>
          <span>口腔智能感控平台</span>
        </div>
      </div>

      <el-menu
        :default-active="route.path"
        router
        class="nav-menu"
      >
        <el-menu-item index="/">
          <el-icon><Monitor /></el-icon>
          <span>全局监控概览</span>
        </el-menu-item>
        <el-menu-item index="/water">
          <el-icon><ColdDrink /></el-icon>
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

      <div class="system-status">
        <div class="status-indicator" :class="{ online: store.wsConnected }"></div>
        <span>{{ store.wsConnected ? '实时通信链路已连接' : '网络链路重连中...' }}</span>
      </div>
    </aside>

    <!-- 主体区域 -->
    <div class="main-wrapper">
      <header v-if="route.path !== '/login'" class="top-header">
        <div class="header-left">
          <span class="location-tag">示范总院中心控制台</span>
        </div>

        <div class="header-right">
          <!-- 深浅主题切换按钮 -->
          <el-button
            circle
            size="default"
            @click="userStore.toggleTheme"
            :title="userStore.isDarkTheme ? '切换为明亮模式' : '切换为暗黑模式'"
          >
            <el-icon><Sunny v-if="userStore.isDarkTheme" /><Moon v-else /></el-icon>
          </el-button>

          <div class="time-display">{{ currentTime }}</div>

          <!-- 用户下拉选择: 圆形头像 + 下方邮箱排版 -->
          <el-dropdown @command="handleUserCommand" trigger="click">
            <div class="user-profile-trigger">
              <div class="avatar-box">
                <img v-if="userStore.user?.avatar" :src="userStore.user.avatar" class="avatar-img" alt="头像" />
                <div v-else class="avatar-default">
                  {{ (userStore.user?.email || 'U').charAt(0).toUpperCase() }}
                </div>
              </div>
              <div class="user-info-column">
                <span class="user-email-text">{{ userStore.user?.email }}</span>
                <span class="user-role-text">{{ userStore.user?.realName }}</span>
              </div>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  <span>个人信息设置</span>
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  <span>退出登录</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="content-body">
        <router-view />
      </main>
    </div>

    <!-- 个人信息设置对话框 -->
    <el-dialog v-model="showProfileDialog" title="个人信息中心设置" width="560px" destroy-on-close>
      <el-tabs v-model="activeProfileTab">
        <!-- 标签1：基本资料与头像更换 -->
        <el-tab-pane label="基本资料与头像" name="info">
          <div class="profile-info-pane">
            <div class="avatar-upload-area">
              <div class="avatar-preview">
                <img v-if="profileForm.avatar" :src="profileForm.avatar" class="preview-img" />
                <div v-else class="preview-default">
                  {{ (userStore.user?.email || 'U').charAt(0).toUpperCase() }}
                </div>
              </div>
              <div class="upload-btn-box">
                <input
                  type="file"
                  ref="fileInputRef"
                  accept="image/*"
                  style="display: none;"
                  @change="handleAvatarFileSelect"
                />
                <el-button type="primary" size="small" @click="triggerFileInput">
                  上传本地头像图片
                </el-button>
                <span class="tip-text">支持 PNG, JPG 等通用格式图片</span>
              </div>
            </div>

            <el-form label-position="top">
              <el-form-item label="电子邮箱 (账号)">
                <el-input :model-value="userStore.user?.email" disabled />
              </el-form-item>
              <el-form-item label="身份权限">
                <el-tag :type="userStore.isAdmin ? 'danger' : 'info'" effect="dark">
                  {{ userStore.isAdmin ? '超级管理员' : '普通用户' }}
                </el-tag>
              </el-form-item>
              <el-form-item label="用户真实姓名 / 称谓">
                <el-input v-model="profileForm.realName" placeholder="请输入姓名或称谓" />
              </el-form-item>
            </el-form>

            <el-button type="primary" style="width: 100%; margin-top: 12px;" @click="saveProfileInfo">
              保存资料修改
            </el-button>
          </div>
        </el-tab-pane>

        <!-- 标签2：凭旧密码修改新密码 -->
        <el-tab-pane label="修改登录密码" name="pwd">
          <el-form label-position="top" style="margin-top: 12px;">
            <el-form-item label="请输入当前原旧密码">
              <el-input v-model="pwdForm.oldPassword" type="password" show-password placeholder="原旧密码" />
            </el-form-item>
            <el-form-item label="请输入新密码">
              <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="设置新密码" />
            </el-form-item>
            <el-form-item label="请再次确认新密码">
              <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="再次输入新密码" />
            </el-form-item>
            <el-button type="warning" style="width: 100%; margin-top: 12px;" @click="submitChangePassword">
              确认修改密码
            </el-button>
          </el-form>
        </el-tab-pane>

        <!-- 标签3：注销账户 -->
        <el-tab-pane label="注销账户" name="delete">
          <div class="delete-pane">
            <el-alert
              title="账户注销警示：注销账户后该邮箱将无法登录，请谨慎操作。"
              type="danger"
              show-icon
              :closable="false"
            />
            <p class="delete-desc">点击下方按钮将彻底清除该账号在系统中的数据并安全退出。</p>
            <el-button type="danger" style="width: 100%; margin-top: 16px;" @click="submitDeleteAccount">
              确认注销当前账户
            </el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDeviceStore } from '@/stores/deviceStore';
import { useUserStore } from '@/stores/userStore';
import {
  Monitor,
  ColdDrink,
  WindPower,
  TrendCharts,
  Warning,
  Document,
  Setting,
  Sunny,
  Moon,
  User,
  SwitchButton
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const route = useRoute();
const router = useRouter();
const store = useDeviceStore();
const userStore = useUserStore();

const currentTime = ref('');
let timer: any = null;

const showProfileDialog = ref(false);
const activeProfileTab = ref('info');
const fileInputRef = ref<HTMLInputElement | null>(null);

const profileForm = ref({
  realName: '',
  avatar: ''
});

const pwdForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const updateTime = () => {
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

const handleUserCommand = (cmd: string) => {
  if (cmd === 'profile') {
    profileForm.value.realName = userStore.user?.realName || '';
    profileForm.value.avatar = userStore.user?.avatar || '';
    showProfileDialog.value = true;
  } else if (cmd === 'logout') {
    userStore.logout();
    router.push('/login');
    ElMessage.warning('已成功退出登录');
  }
};

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const handleAvatarFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        const img = new Image();
        img.onload = () => {
          // 使用 Canvas 将大尺寸图片缩放裁剪为标准的 300x300 高清比例，大幅缩减体积
          const canvas = document.createElement('canvas');
          const maxDim = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.85);
            profileForm.value.avatar = optimizedBase64;
            ElMessage.success('本地图片裁剪处理完毕，请点击保存完成更新');
          }
        };
        img.src = evt.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  }
};

const saveProfileInfo = async () => {
  try {
    await userStore.updateProfile(profileForm.value.realName, profileForm.value.avatar);
    ElMessage.success('个人资料及头像更新成功');
    showProfileDialog.value = false;
  } catch (e: any) {
    ElMessage.error(e.message || '更新失败');
  }
};

const submitChangePassword = async () => {
  if (!pwdForm.value.oldPassword || !pwdForm.value.newPassword) {
    return ElMessage.error('请完整输入旧密码与新密码');
  }
  if (pwdForm.value.newPassword !== pwdForm.value.confirmPassword) {
    return ElMessage.error('两次输入的密码不一致');
  }

  try {
    await userStore.changePassword(pwdForm.value.oldPassword, pwdForm.value.newPassword);
    ElMessage.success('密码修改成功，请使用新密码进行下次登录');
    pwdForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
    showProfileDialog.value = false;
  } catch (e: any) {
    ElMessage.error(e.message || '修改失败');
  }
};

const submitDeleteAccount = () => {
  ElMessageBox.confirm('确定要注销当前账户吗？此操作无法撤销。', '确认注销', {
    confirmButtonText: '确定注销',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await userStore.deleteAccount();
      ElMessage.warning('账户已成功注销');
      router.push('/login');
    } catch (e: any) {
      ElMessage.error(e.message || '注销失败');
    }
  }).catch(() => {});
};

onMounted(() => {
  userStore.applyTheme();
  updateTime();
  timer = setInterval(updateTime, 1000);
  store.fetchOverview();
  store.initWebSocket();
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.app-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: var(--bg-dark);
}

.sidebar {
  width: 250px;
  background: var(--bg-dark);
  border-right: 1px solid var(--card-border);
  display: flex;
  flex-direction: column;
  padding: 20px 0;
}

.logo-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px 24px 20px;
  border-bottom: 1px solid var(--card-border);
}

.logo-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, #0284c7 0%, #38bdf8 100%);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
}

.logo-text h2 {
  font-size: 18px;
  color: var(--text-main);
  font-weight: 700;
  letter-spacing: 0.5px;
}

.logo-text span {
  font-size: 11px;
  color: var(--text-muted);
}

.nav-menu {
  flex: 1;
  margin-top: 16px;
}

.system-status {
  padding: 16px 20px;
  border-top: 1px solid var(--card-border);
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--text-muted);
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #ef4444;
}

.status-indicator.online {
  background-color: #10b981;
  box-shadow: 0 0 8px #10b981;
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-header {
  height: 64px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--card-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 28px;
}

.location-tag {
  background: rgba(56, 189, 248, 0.1);
  color: var(--primary-color);
  border: 1px solid rgba(56, 189, 248, 0.2);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.time-display {
  font-family: monospace;
  color: var(--text-muted);
  font-size: 14px;
}

/* 圆形头像 + 下方/右侧精致排版触发区域 */
.user-profile-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px;
  border-radius: 24px;
  transition: background-color 0.2s ease;
}

.user-profile-trigger:hover {
  background-color: rgba(56, 189, 248, 0.1);
}

.avatar-box {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-default {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0284c7 0%, #38bdf8 100%);
  color: #ffffff;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-info-column {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.2;
}

.user-email-text {
  font-size: 13px;
  color: var(--text-main);
  font-weight: 600;
}

.user-role-text {
  font-size: 11px;
  color: var(--primary-color);
  margin-top: 2px;
}

.content-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

/* 个人中心弹窗内部样式 */
.profile-info-pane {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.avatar-upload-area {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px;
  background: var(--bg-dark);
  border-radius: 8px;
  border: 1px solid var(--card-border);
}

.avatar-preview {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--primary-color);
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-default {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0284c7 0%, #38bdf8 100%);
  color: #ffffff;
  font-size: 24px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-btn-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tip-text {
  font-size: 11px;
  color: var(--text-muted);
}

.delete-pane {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.delete-desc {
  font-size: 13px;
  color: var(--text-muted);
}
</style>
