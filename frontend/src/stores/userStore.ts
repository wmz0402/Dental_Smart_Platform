import { defineStore } from 'pinia';
import axios from 'axios';

export type UserRole = 'ADMIN' | 'OPERATOR';

export interface UserInfo {
  email: string;
  role: UserRole;
  realName: string;
  avatar?: string;
  token: string;
}

export interface UserState {
  user: UserInfo | null;
  isDarkTheme: boolean;
  verifyCodeSent: boolean;
  countdown: number;
  timer: any;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: (JSON.parse(localStorage.getItem('dental_user') || 'null') as UserInfo | null) || {
      email: 'admin@qq.com',
      role: 'ADMIN',
      realName: '超级管理员',
      avatar: '',
      token: 'demo-admin-token'
    },
    isDarkTheme: localStorage.getItem('dental_theme') !== 'light',
    verifyCodeSent: false,
    countdown: 0,
    timer: null
  }),

  getters: {
    isAdmin: (state) => state.user?.role === 'ADMIN',
    isLoggedIn: (state) => !!state.user
  },

  actions: {
    toggleTheme() {
      this.isDarkTheme = !this.isDarkTheme;
      localStorage.setItem('dental_theme', this.isDarkTheme ? 'dark' : 'light');
      this.applyTheme();
    },

    applyTheme() {
      if (this.isDarkTheme) {
        document.documentElement.classList.remove('light-theme');
      } else {
        document.documentElement.classList.add('light-theme');
      }
    },

    async sendEmailCode(email: string) {
      if (!email || !email.includes('@')) {
        throw new Error('请输入有效的电子邮箱地址');
      }
      
      try {
        await axios.post('/api/auth/send-code', { email });
      } catch (e: any) {
        const msg = e.response?.data?.error || '发送验证码失败，请检查邮箱';
        throw new Error(msg);
      }

      this.verifyCodeSent = true;
      this.countdown = 60;
      if (this.timer) clearInterval(this.timer);
      this.timer = setInterval(() => {
        if (this.countdown > 0) {
          this.countdown--;
        } else {
          clearInterval(this.timer);
          this.verifyCodeSent = false;
        }
      }, 1000);
    },

    async loginWithPassword(email: string, password: string) {
      if (!email || !password) {
        throw new Error('邮箱与密码不能为空');
      }

      try {
        const res = await axios.post('/api/auth/login', { email, password });
        this.user = res.data.user;
        localStorage.setItem('dental_user', JSON.stringify(res.data.user));
      } catch (e: any) {
        const errMsg = e.response?.data?.error || '登录失败，请检查邮箱与密码';
        throw new Error(errMsg);
      }
    },

    async registerWithCode(email: string, code: string, password: string) {
      if (!email || !code || !password) {
        throw new Error('邮箱、验证码及新密码均不能为空');
      }

      try {
        const res = await axios.post('/api/auth/register', { email, code, password });
        this.user = res.data.user;
        localStorage.setItem('dental_user', JSON.stringify(res.data.user));
      } catch (e: any) {
        const errMsg = e.response?.data?.error || '注册失败，请检查验证码';
        throw new Error(errMsg);
      }
    },

    async changePassword(oldPassword: string, newPassword: string) {
      if (!this.user) return;
      try {
        await axios.post('/api/auth/change-password', {
          email: this.user.email,
          oldPassword,
          newPassword
        });
      } catch (e: any) {
        throw new Error(e.response?.data?.error || '修改密码失败');
      }
    },

    async resetPassword(email: string, code: string, newPassword: string) {
      try {
        await axios.post('/api/auth/reset-password', { email, code, newPassword });
      } catch (e: any) {
        throw new Error(e.response?.data?.error || '重置密码失败');
      }
    },

    async updateProfile(realName: string, avatar?: string) {
      if (!this.user) return;
      try {
        const res = await axios.post('/api/auth/update-profile', {
          email: this.user.email,
          realName,
          avatar
        });
        this.user.realName = res.data.user.realName;
        this.user.avatar = res.data.user.avatar;
        localStorage.setItem('dental_user', JSON.stringify(this.user));
      } catch (e: any) {
        throw new Error(e.response?.data?.error || '更新失败');
      }
    },

    async deleteAccount() {
      if (!this.user) return;
      try {
        await axios.post('/api/auth/delete-account', { email: this.user.email });
        this.logout();
      } catch (e: any) {
        throw new Error(e.response?.data?.error || '注销账户失败');
      }
    },

    logout() {
      this.user = null;
      localStorage.removeItem('dental_user');
    }
  }
});
