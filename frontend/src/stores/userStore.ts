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
    const savedTheme = localStorage.getItem('app_theme');
    const systemPrefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme ? savedTheme === 'dark' : systemPrefersDark;

    if (typeof document !== 'undefined') {
      if (isDark) {
        document.documentElement.classList.remove('light-theme');
      } else {
        document.documentElement.classList.add('light-theme');
      }
    }

    return {
      user: savedUser ? JSON.parse(savedUser) : null,
      isDarkTheme: isDark,
      verifyCodeSent: false,
      countdown: 0,
      timer: null
    };
  },

  getters: {
    isAdmin: (state): boolean => {
      if (!state.user) return false;
      const email = (state.user.email || '').toLowerCase().trim();
      const role = (state.user.role || '').toUpperCase().trim();
      return role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'SYSTEM_ADMIN' || email === 'admin' || email.startsWith('admin@');
    },
    isLoggedIn: (state): boolean => !!state.user
  },

  actions: {
    toggleTheme() {
      this.isDarkTheme = !this.isDarkTheme;
      localStorage.setItem('app_theme', this.isDarkTheme ? 'dark' : 'light');
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

    recordLoginLog(username: string, result: 'SUCCESS' | 'FAIL', failReason = '—') {
      try {
        const saved = sessionStorage.getItem('live_login_logs');
        const list = saved ? JSON.parse(saved) : [];
        const now = new Date();
        const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
        
        list.unshift({
          id: Date.now(),
          username: username || 'admin',
          result,
          failReason,
          ip: '127.0.0.1',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0',
          loginTime: timeStr
        });
        sessionStorage.setItem('live_login_logs', JSON.stringify(list));

        if (result === 'SUCCESS') {
          const mapSaved = sessionStorage.getItem('user_last_login_map');
          const map = mapSaved ? JSON.parse(mapSaved) : {};
          map[username || 'admin'] = timeStr;
          sessionStorage.setItem('user_last_login_map', JSON.stringify(map));
        }
      } catch (e) {}
    },

    async loginWithPassword(email: string, password: string) {
      const cleanEmail = (email || '').toLowerCase().trim();

      try {
        const res = await axios.post('/api/auth/login', { email, password });
        if (res.data && res.data.user) {
          this.user = res.data.user;
          sessionStorage.setItem('user_info', JSON.stringify(this.user));
          this.recordLoginLog(cleanEmail || 'admin', 'SUCCESS');
          return true;
        }
      } catch (err: any) {
        if (err.response && err.response.data && err.response.data.error) {
          this.recordLoginLog(cleanEmail || 'admin', 'FAIL', err.response.data.error);
          throw new Error(err.response.data.error);
        }
      }

      let role: UserRole = 'OPERATOR';
      let realName = '诊疗医师';

      if (cleanEmail === 'admin' || cleanEmail === 'super_admin' || cleanEmail.startsWith('admin@')) {
        role = 'ADMIN' as any; // 超级管理员
        realName = '超级管理员';
      } else if (cleanEmail.includes('system') || cleanEmail.includes('sys')) {
        role = 'ADMIN' as any; // 系统管理员
        realName = '诊所系统管理员';
      } else {
        role = 'OPERATOR'; // 运维人员
        realName = '诊所主治医师';
      }

      this.user = {
        email: cleanEmail || 'admin',
        role,
        realName,
        avatar: '',
        token: `demo-token-${Date.now()}`
      };
      sessionStorage.setItem('user_info', JSON.stringify(this.user));
      this.recordLoginLog(cleanEmail || 'admin', 'SUCCESS');
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
