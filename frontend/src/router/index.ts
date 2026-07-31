import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../views/Dashboard.vue';
import WaterDevice from '../views/WaterDevice.vue';
import AirDevice from '../views/AirDevice.vue';
import Telemetry from '../views/Telemetry.vue';
import Alarm from '../views/Alarm.vue';
import Reports from '../views/Reports.vue';
import Settings from '../views/Settings.vue';
import Login from '../views/Login.vue';
import UserManagement from '../views/UserManagement.vue';
import RoleManagement from '../views/RoleManagement.vue';
import LoginLogs from '../views/LoginLogs.vue';
import OperationLogs from '../views/OperationLogs.vue';
import { useUserStore } from '../stores/userStore';
import { useDeviceStore } from '../stores/deviceStore';

const routes = [
  { path: '/login', name: 'Login', component: Login },
  { path: '/', name: 'Dashboard', component: Dashboard },
  { path: '/water', alias: ['/water-device'], name: 'WaterDevice', component: WaterDevice },
  { path: '/air', alias: ['/air-device'], name: 'AirDevice', component: AirDevice },
  { path: '/telemetry', name: 'Telemetry', component: Telemetry },
  { path: '/alarm', name: 'Alarm', component: Alarm },
  { path: '/reports', name: 'Reports', component: Reports },
  { path: '/settings', name: 'Settings', component: Settings },
  { path: '/system/users', name: 'UserManagement', component: UserManagement },
  { path: '/system/roles', name: 'RoleManagement', component: RoleManagement },
  { path: '/system/login-logs', name: 'LoginLogs', component: LoginLogs },
  { path: '/system/op-logs', name: 'OperationLogs', component: OperationLogs }
];

export const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  const deviceStore = useDeviceStore();

  if (to.name !== 'Login' && !userStore.isLoggedIn) {
    next({ name: 'Login' });
  } else if (to.name === 'Login' && userStore.isLoggedIn) {
    next({ name: 'Dashboard' });
  } else {
    if (to.name !== 'Login' && from.name) {
      deviceStore.loading = true;
    }
    next();
  }
});

router.afterEach((to) => {
  // 设置 2.5s 安全超时保底，防止特殊无数据响应页面无限加载
  const deviceStore = useDeviceStore();
  if (to.name !== 'Login') {
    setTimeout(() => {
      if (deviceStore.loading) {
        deviceStore.loading = false;
      }
    }, 2500);
  }
});
