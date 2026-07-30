<template>
  <div class="login-container">
    <div class="glass-card login-card">
      <div class="login-header">
        <div class="logo-circle"></div>
        <h2>智护牙境 - 智能管控平台登录</h2>
      </div>

      <el-tabs v-model="activeTab" class="login-tabs" stretch>
        <!-- 1. 已注册用户——账号密码登录 -->
        <el-tab-pane label="已注册账号登录" name="login">
          <el-form label-position="top" class="login-form">
            <el-form-item label="电子邮箱地址">
              <el-input
                v-model="loginForm.email"
                placeholder="请输入您的邮箱"
                size="large"
                autocomplete="off"
              >
                <template #prefix>
                  <el-icon><Message /></el-icon>
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
              密码验证并登录
            </el-button>
          </el-form>
        </el-tab-pane>

        <!-- 2. 未注册用户——验证码 + 设置新密码注册 -->
        <el-tab-pane label="新用户邮箱注册" name="register">
          <el-form label-position="top" class="login-form">
            <el-form-item label="设置注册电子邮箱">
              <el-input
                v-model="regForm.email"
                placeholder="请输入您的工作电子邮箱"
                size="large"
                autocomplete="off"
              >
                <template #prefix>
                  <el-icon><Message /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="邮箱动态验证码">
              <div class="code-box">
                <el-input
                  v-model="regForm.code"
                  placeholder="请输入6位验证码"
                  size="large"
                  autocomplete="off"
                >
                  <template #prefix>
                    <el-icon><Key /></el-icon>
                  </template>
                </el-input>
                <el-button
                  type="primary"
                  size="large"
                  :disabled="userStore.countdown > 0"
                  @click="handleSendRegCode"
                >
                  {{ userStore.countdown > 0 ? `${userStore.countdown}s` : '发送验证码' }}
                </el-button>
              </div>
            </el-form-item>

            <el-form-item label="设置新账号密码">
              <el-input
                v-model="regForm.password"
                type="password"
                show-password
                placeholder="请设置您的登录密码"
                size="large"
                autocomplete="new-password"
              >
                <template #prefix>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-button
              type="success"
              size="large"
              class="submit-btn"
              @click="handleRegister"
            >
              完成注册并直接登录
            </el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 忘记密码重置弹窗 -->
    <el-dialog v-model="showForgetDialog" title="找回并重置登录密码" width="460px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="注册电子邮箱">
          <el-input v-model="forgetForm.email" placeholder="请输入绑定的注册电子邮箱" autocomplete="off" />
        </el-form-item>

        <el-form-item label="邮箱验证码">
          <div class="code-box">
            <el-input v-model="forgetForm.code" placeholder="请输入6位邮件验证码" autocomplete="off" />
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
import { useUserStore } from '@/stores/userStore';
import { Message, Lock, Key } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const router = useRouter();
const userStore = useUserStore();

const activeTab = ref('login');
const showForgetDialog = ref(false);

const loginForm = ref({
  email: '',
  password: ''
});

const regForm = ref({
  email: '',
  code: '',
  password: ''
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

const handleSendRegCode = async () => {
  if (!regForm.value.email) {
    return ElMessage.error('请先填写需要注册的电子邮箱地址');
  }
  try {
    await userStore.sendEmailCode(regForm.value.email);
    ElMessage.success(`验证码已成功发送至 ${regForm.value.email}`);
  } catch (e: any) {
    ElMessage.error(formatError(e));
  }
};

const handleSendForgetCode = async () => {
  if (!forgetForm.value.email) {
    return ElMessage.error('请先填写绑定的注册电子邮箱地址');
  }
  try {
    await userStore.sendEmailCode(forgetForm.value.email);
    ElMessage.success(`重置验证码已发送至 ${forgetForm.value.email}`);
  } catch (e: any) {
    ElMessage.error(formatError(e));
  }
};

const handlePasswordLogin = async () => {
  try {
    await userStore.loginWithPassword(loginForm.value.email, loginForm.value.password);
    ElMessage.success(`登录成功！欢迎回来: ${userStore.user?.realName}`);
    router.push('/');
  } catch (e: any) {
    ElMessage.error(formatError(e));
  }
};

const handleRegister = async () => {
  try {
    await userStore.registerWithCode(regForm.value.email, regForm.value.code, regForm.value.password);
    ElMessage.success('账号注册成功！已为您自动登录进入系统');
    router.push('/');
  } catch (e: any) {
    ElMessage.error(formatError(e));
  }
};

const handleResetPassword = async () => {
  if (!forgetForm.value.email || !forgetForm.value.code || !forgetForm.value.newPassword) {
    return ElMessage.error('请完整填写邮箱、验证码与重置的新密码');
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
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--bg-dark);
}

.login-card {
  width: 440px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.login-header {
  text-align: center;
}

.logo-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0284c7 0%, #38bdf8 100%);
  margin: 0 auto 12px;
}

.login-header h2 {
  font-size: 20px;
  color: var(--text-main);
  font-weight: 700;
}

.login-tabs {
  margin-top: 8px;
}

:deep(.el-tabs__item) {
  color: #cbd5e1 !important;
  font-size: 15px !important;
  font-weight: 500 !important;
}

:deep(.el-tabs__item:hover) {
  color: #38bdf8 !important;
}

:deep(.el-tabs__item.is-active) {
  color: #38bdf8 !important;
  font-weight: 700 !important;
}

:deep(.el-form-item__label) {
  color: #f8fafc !important;
  font-weight: 600 !important;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 12px;
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

.forget-btn:hover {
  color: #7dd3fc !important;
  text-decoration: underline;
}

.code-box {
  display: flex;
  gap: 12px;
  width: 100%;
}

.submit-btn {
  width: 100%;
  margin-top: 12px;
}
</style>
