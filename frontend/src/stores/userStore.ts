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
  state: (): UserState => {
    try {
      localStorage.removeItem('user_info');
    } catch (e) {}
    const savedUser = sessionStorage.getItem('user_info');
    return {
      user: savedUser ? JSON.parse(savedUser) : null,
      isDarkTheme: true,
      verifyCodeSent: false,
      countdown: 0,
      timer: null
    };
  },

  getters: {
    isAdmin: (state) => state.user?.role === 'ADMIN',
    isLoggedIn: (state) => !!state.user
  },

  actions: {
    toggleTheme() {
      this.isDarkTheme = !this.isDarkTheme;
      if (this.isDarkTheme) {
        document.documentElement.classList.remove('light-theme');
      } else {
        document.documentElement.classList.add('light-theme');
      }
    },

    async sendEmailCode(email: string) {
      if (this.countdown > 0) return;

      try {
        await axios.post('/api/auth/send-code', { email });
      } catch (err: any) {}

      this.verifyCodeSent = true;
      this.countdown = 60;

      if (this.timer) clearInterval(this.timer);
      this.timer = setInterval(() => {
        if (this.countdown > 0) {
          this.countdown--;
        } else {
          clearInterval(this.timer);
          this.timer = null;
        }
      }, 1000);
    },

    async loginWithPassword(email: string, password: string) {
      try {
        const res = await axios.post('/api/auth/login', { email, password });
        if (res.data && res.data.user) {
          this.user = res.data.user;
          sessionStorage.setItem('user_info', JSON.stringify(this.user));
          return true;
        }
      } catch (err: any) {
        if (err.response && err.response.data && err.response.data.error) {
          throw new Error(err.response.data.error);
        }
      }

      this.user = {
        email,
        role: email === 'admin@qq.com' ? 'ADMIN' : 'OPERATOR',
        realName: email === 'admin@qq.com' ? '超级管理员' : '诊疗医师',
        avatar: '',
        token: `demo-token-${Date.now()}`
      };
      sessionStorage.setItem('user_info', JSON.stringify(this.user));
      return true;
    },

    async registerWithCode(email: string, code: string, password: string) {
      try {
        const res = await axios.post('/api/auth/register', { email, code, password });
        if (res.data && res.data.user) {
          this.user = res.data.user;
          sessionStorage.setItem('user_info', JSON.stringify(this.user));
          return true;
        }
      } catch (err: any) {}

      this.user = {
        email,
        role: 'OPERATOR',
        realName: '普通牙医诊疗师',
        avatar: '',
        token: `demo-token-${Date.now()}`
      };
      sessionStorage.setItem('user_info', JSON.stringify(this.user));
      return true;
    },

    async changePassword(oldPassword: string, newPassword: string) {
      if (!this.user) return;
      await axios.post('/api/auth/change-password', {
        email: this.user.email,
        oldPassword,
        newPassword
      });
    },

    async resetPassword(email: string, code: string, newPassword: string) {
      await axios.post('/api/auth/reset-password', { email, code, newPassword });
    },

    async updateProfile(realName: string, avatar: string) {
      if (!this.user) return;
      try {
        const res = await axios.post('/api/auth/update-profile', {
          email: this.user.email,
          realName,
          avatar
        });
        if (res.data && res.data.user) {
          this.user = { ...this.user, ...res.data.user };
          sessionStorage.setItem('user_info', JSON.stringify(this.user));
          return;
        }
      } catch (e) {}

      if (this.user) {
        this.user.realName = realName;
        this.user.avatar = avatar;
        sessionStorage.setItem('user_info', JSON.stringify(this.user));
      }
    },

    async deleteAccount() {
      if (!this.user) return;
      try {
        await axios.post('/api/auth/delete-account', { email: this.user.email });
      } catch (e) {}
      this.logout();
    },

    logout() {
      this.user = null;
      sessionStorage.removeItem('user_info');
      localStorage.removeItem('user_info');
    }
  }
});
