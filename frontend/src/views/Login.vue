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

        <el-button
          type="primary"
          size="large"
          class="submit-btn"
          @click="handlePasswordLogin"
        >
          验证并登录
        </el-button>
      </el-form>
    </div>
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

const loginForm = ref({
  email: '',
  password: ''
});

const formatError = (e: any): string => {
  if (!e) return '请求错误';
  if (typeof e === 'string') return e;
  if (e.message && typeof e.message === 'string') return e.message;
  return '系统处理异常，请重试';
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

@media (max-width: 767.98px) {
  .login-card {
    width: 94% !important;
    padding: 20px 16px !important;
  }
  .login-header h2 {
    font-size: 17px;
  }
}

.code-box {
  display: flex;
  gap: 12px;
  width: 100%;
}
</style>
