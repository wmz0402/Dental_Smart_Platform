<template>
  <div class="login-container">
    <div class="glass-card login-card">
      <div class="login-header">
        <img :src="logoSvg" class="login-logo-img" alt="Logo" />
        <h2>智护牙境 - 智能管控平台登录</h2>
        <p class="login-subtitle">口腔智能感控与设备运维管控中心</p>
      </div>

      <!-- 纯净登录表单 -->
      <el-form label-position="top" class="login-form">
        <el-form-item label="登录账号用户名">
          <el-input
            v-model="loginForm.email"
            placeholder="请输入账号 (如 admin)"
            size="large"
            autocomplete="off"
          >
            <template #prefix>
              <el-icon><UserIcon /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="登录密码">
          <el-input
            v-model="loginForm.password"
            type="password"
            show-password
            placeholder="请输入登录密码"
            size="large"
            autocomplete="new-password"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <div class="forget-link-row">
          <el-button type="primary" link class="forget-btn" @click="showForgetDialog = true">
            忘记密码？
          </el-button>
        </div>

        <el-button
          type="primary"
          size="large"
          class="submit-btn"
          @click="handlePasswordLogin"
        >
          验证并登录
        </el-button>

        <!-- 三个内置角色演示账号快捷选择区块 -->
        <div class="demo-roles-section">
          <div class="demo-roles-title">快捷体验内置角色账号</div>
          <div class="demo-roles-grid">
            <div
              class="role-badge-card"
              :class="{ active: loginForm.email === 'admin' }"
              @click="quickSelectRole('admin', 'SUPER_ADMIN')"
            >
              <span class="role-badge-name">超级管理员</span>
              <span class="role-badge-code">SUPER_ADMIN</span>
            </div>

            <div
              class="role-badge-card"
              :class="{ active: loginForm.email === 'demo_system_admin' }"
              @click="quickSelectRole('demo_system_admin', 'SYSTEM_ADMIN')"
            >
              <span class="role-badge-name">系统管理员</span>
              <span class="role-badge-code">SYSTEM_ADMIN</span>
            </div>

            <div
              class="role-badge-card"
              :class="{ active: loginForm.email === 'demo_operator' }"
              @click="quickSelectRole('demo_operator', 'OPERATOR')"
            >
              <span class="role-badge-name">运维人员</span>
              <span class="role-badge-code">OPERATOR</span>
            </div>
          </div>
        </div>
      </el-form>
    </div>

    <!-- 忘记密码重置弹窗 -->
    <el-dialog v-model="showForgetDialog" title="找回并重置登录密码" width="460px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="内置登录账号">
          <el-input v-model="forgetForm.email" placeholder="请输入绑定的登录账号 (如 admin)" autocomplete="off" />
        </el-form-item>

        <el-form-item label="邮箱验证码">
          <div class="code-box">
            <el-input v-model="forgetForm.code" placeholder="请输入 6 位验证码" autocomplete="off" />
            <el-button
              type="primary"
              :disabled="userStore.countdown > 0"
              @click="handleSendForgetCode"
            >
              {{ userStore.countdown > 0 ? `${userStore.countdown}s` : '发送验证码' }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="重置新密码">
          <el-input
            v-model="forgetForm.newPassword"
            type="password"
            show-password
            placeholder="请输入您要设置的新密码"
            autocomplete="new-password"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForgetDialog = false">取消</el-button>
        <el-button type="primary" @click="handleResetPassword">确认重置新密码</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import logoSvg from '../assets/logo.svg';
import { useUserStore } from '@/stores/userStore';
import { User as UserIcon, Lock } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const router = useRouter();
const userStore = useUserStore();

const showForgetDialog = ref(false);

const loginForm = ref({
  email: 'admin',
  password: 'admin'
});

const forgetForm = ref({
  email: '',
  code: '',
  newPassword: ''
});

const formatError = (e: any): string => {
  if (!e) return '请求错误';
  if (typeof e === 'string') return e;
  if (e.message && typeof e.message === 'string') return e.message;
  return '系统处理异常，请重试';
};

const quickSelectRole = (username: string, roleName: string) => {
  loginForm.value.email = username;
  loginForm.value.password = 'admin';
  ElMessage.success(`已切换填充【${roleName}】账号: ${username}`);
};

const handleSendForgetCode = async () => {
  if (!forgetForm.value.email) {
    return ElMessage.error('请先填写绑定的登录账号');
  }
  try {
    await userStore.sendEmailCode(forgetForm.value.email);
    ElMessage.success(`重置验证码已发送至相关邮箱`);
  } catch (e: any) {
    ElMessage.error(formatError(e));
  }
};

const handlePasswordLogin = async () => {
  if (!loginForm.value.email || !loginForm.value.password) {
    return ElMessage.error('请输入登录账号与密码');
  }

  try {
    await userStore.loginWithPassword(loginForm.value.email, loginForm.value.password);
    ElMessage.success(`登录成功！欢迎回来: ${userStore.user?.realName}`);
    router.push('/');
  } catch (e: any) {
    ElMessage.error(formatError(e));
  }
};

const handleResetPassword = async () => {
  if (!forgetForm.value.email || !forgetForm.value.code || !forgetForm.value.newPassword) {
    return ElMessage.error('请完整填写账号、验证码与重置的新密码');
  }

  try {
    await userStore.resetPassword(forgetForm.value.email, forgetForm.value.code, forgetForm.value.newPassword);
    ElMessage.success('密码重置成功，已为您自动填充到登录框');
    loginForm.value.email = forgetForm.value.email;
    loginForm.value.password = forgetForm.value.newPassword;
    showForgetDialog.value = false;
  } catch (e: any) {
    ElMessage.error(formatError(e));
  }
};
</script>

<style scoped>
.login-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: radial-gradient(circle at 50% 30%, #0f172a 0%, #090d16 100%);
  padding: 20px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
}

html.light-theme .login-container {
  background: radial-gradient(circle at 50% 30%, #ffffff 0%, #f1f5f9 100%);
}

.login-container::before {
  content: '';
  position: absolute;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(56, 189, 248, 0) 70%);
  top: 15%;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}

.login-card {
  width: 440px;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
  gap: 20px;
  z-index: 10;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5) !important;
}

html.light-theme .login-card {
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08) !important;
}

.login-header {
  text-align: center;
}

.login-logo-img {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  margin: 0 auto 12px;
  object-fit: contain;
  filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.5));
}

.login-header h2 {
  font-size: 20px;
  color: var(--text-main);
  font-weight: 700;
}

.login-subtitle {
  font-size: 12px;
  color: #38bdf8;
  margin-top: 4px;
}

:global(html.light-theme) .login-subtitle {
  color: #0284c7 !important;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 8px;
}

:deep(.el-form-item__label) {
  color: #f8fafc !important;
  font-weight: 600 !important;
}

html.light-theme :deep(.el-form-item__label) {
  color: #1e293b !important;
}

.forget-link-row {
  display: flex;
  justify-content: flex-end;
  margin-top: -8px;
}

.forget-btn {
  color: #38bdf8 !important;
  font-size: 13px !important;
}

html.light-theme .forget-btn {
  color: #2563eb !important;
}

.submit-btn {
  width: 100%;
  margin-top: 8px;
}

/* 3 个内置角色选择区 */
.demo-roles-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px dashed rgba(56, 189, 248, 0.2);
}

html.light-theme .demo-roles-section {
  border-top: 1px dashed #cbd5e1;
}

.demo-roles-title {
  font-size: 12px;
  color: #94a3b8;
  text-align: center;
  margin-bottom: 12px;
}

.demo-roles-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.role-badge-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 8px;
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

html.light-theme .role-badge-card {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
}

.role-badge-card:hover,
.role-badge-card.active {
  background: rgba(56, 189, 248, 0.15);
  border-color: #38bdf8;
  transform: translateY(-2px);
}

html.light-theme .role-badge-card:hover,
html.light-theme .role-badge-card.active {
  background: #eff6ff;
  border-color: #2563eb;
}

.role-badge-name {
  font-size: 12px;
  font-weight: 600;
  color: #f1f5f9;
}

html.light-theme .role-badge-name {
  color: #0f172a;
}

.role-badge-code {
  font-size: 9px;
  color: #38bdf8;
  font-family: monospace;
}

html.light-theme .role-badge-code {
  color: #0284c7;
}

.code-box {
  display: flex;
  gap: 12px;
  width: 100%;
}
</style>
