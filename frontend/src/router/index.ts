import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../views/Dashboard.vue';
import WaterDevice from '../views/WaterDevice.vue';
import AirDevice from '../views/AirDevice.vue';
import Telemetry from '../views/Telemetry.vue';
import Alarm from '../views/Alarm.vue';
import Reports from '../views/Reports.vue';
import Settings from '../views/Settings.vue';
import Login from '../views/Login.vue';
import { useUserStore } from '../stores/userStore';

const routes = [
  { path: '/login', name: 'Login', component: Login },
  { path: '/', name: 'Dashboard', component: Dashboard },
  { path: '/water', alias: ['/water-device'], name: 'WaterDevice', component: WaterDevice },
  { path: '/air', alias: ['/air-device'], name: 'AirDevice', component: AirDevice },
  { path: '/telemetry', name: 'Telemetry', component: Telemetry },
  { path: '/alarm', name: 'Alarm', component: Alarm },
  { path: '/reports', name: 'Reports', component: Reports },
  { path: '/settings', name: 'Settings', component: Settings }
];

export const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  if (to.name !== 'Login' && !userStore.isLoggedIn) {
    next({ name: 'Login' });
  } else {
    next();
  }
});
