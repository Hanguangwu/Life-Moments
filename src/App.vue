<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from './stores/auth';
import { useProfileStore } from './stores/profile';
import {
  Document,
  Menu as IconMenu,
  Setting,
  User,
  HomeFilled,
  Bell,
  Message,
  Search,
} from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const profileStore = useProfileStore();
const collapsed = ref(false);
const showUserDropdown = ref(false);

// 计算属性：是否显示认证页面
const showAuthPage = computed(() => {
  return route.path === '/auth';
});

/**
 * 菜单项配置
 */
const menuItems = [
  {
    index: '/moments',
    title: '首页',
    icon: Document,
  },
  {
    index: '/following',
    title: '关注',
    icon: Bell,
  },
  {
    index: '/settings',
    title: '设置',
    icon: Setting,
  },
];

/**
 * 处理菜单选择
 */
const handleMenuSelect = (index: string) => {
  router.push(index);
};

/**
 * 切换侧边栏折叠状态
 */
const toggleCollapse = () => {
  collapsed.value = !collapsed.value;
};

/**
 * 处理用户退出登录
 */
const handleLogout = async () => {
  await authStore.signOut();
  // 重置个人资料状态
  profileStore.reset();
  router.push('/auth');
};

onMounted(async () => {
  // 初始化认证状态
  if (!authStore.initialized) {
    await authStore.initialize();
  }
  
  // 如果用户已登录，初始化个人资料
  if (authStore.isAuthenticated && !profileStore.initialized) {
    await profileStore.initialize();
  }
  
  // 路由重定向逻辑
  if (route.path === '/') {
    if (authStore.isAuthenticated) {
      router.push('/moments');
    } else {
      router.push('/auth');
    }
  }
});
</script>

<template>
  <div class="app-container">
    <!-- 认证页面 -->
    <template v-if="showAuthPage">
      <router-view />
    </template>

    <!-- 主应用界面 - Twitter风格 -->
    <template v-else>
      <div class="twitter-layout">
        <!-- 左侧导航栏 -->
        <div class="twitter-sidebar">
          <div class="twitter-logo">
            <el-icon class="logo-icon"><HomeFilled /></el-icon>
          </div>
          
          <div class="twitter-nav">
            <div 
              v-for="item in menuItems" 
              :key="item.index" 
              class="nav-item" 
              :class="{ active: route.path === item.index }"
              @click="handleMenuSelect(item.index)"
            >
              <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
              <span class="nav-text">{{ item.title }}</span>
            </div>
          </div>
          
          <div class="twitter-profile" @click="showUserDropdown = !showUserDropdown">
            <el-avatar 
              :size="40" 
              class="profile-avatar"
              :src="profileStore.avatarUrl || undefined"
              @error="() => false"
            >
              <el-icon><User /></el-icon>
            </el-avatar>
            <div class="profile-info">
              <span class="profile-name">{{ profileStore.username }}</span>
              <span class="profile-email">{{ authStore.user?.email }}</span>
            </div>
            
            <!-- 用户下拉菜单 -->
            <div v-if="showUserDropdown" class="user-dropdown">
              <div class="dropdown-item" @click="handleLogout">
                <span>退出登录</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 中间内容区域 -->
        <div class="twitter-main">
          <div class="twitter-header">
            <h2 class="header-title">首页</h2>
          </div>
          
          <div class="twitter-content">
            <router-view />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.app-container {
  height: 100vh;
  background-color: #ffffff;
}

/* Twitter风格布局 */
.twitter-layout {
  display: flex;
  height: 100vh;
  max-width: 1280px;
  margin: 0 auto;
}

/* 左侧导航栏 */
.twitter-sidebar {
  width: 275px;
  height: 100%;
  padding: 0 12px;
  border-right: 1px solid #eff3f4;
  display: flex;
  flex-direction: column;
}

.twitter-logo {
  padding: 12px;
  margin: 12px 0;
}

.logo-icon {
  font-size: 28px;
  color: #1da1f2;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.2s;
}

.logo-icon:hover {
  background-color: rgba(29, 161, 242, 0.1);
}

.twitter-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 9999px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.nav-item:hover {
  background-color: rgba(15, 20, 25, 0.1);
}

.nav-item.active {
  font-weight: 700;
}

.nav-icon {
  font-size: 24px;
  margin-right: 16px;
}

.nav-text {
  font-size: 20px;
}

.twitter-profile {
  display: flex;
  align-items: center;
  padding: 12px;
  margin: 12px 0;
  border-radius: 9999px;
  cursor: pointer;
  position: relative;
  transition: background-color 0.2s;
}

.twitter-profile:hover {
  background-color: rgba(15, 20, 25, 0.1);
}

.profile-avatar {
  margin-right: 12px;
}

.profile-info {
  display: flex;
  flex-direction: column;
}

.profile-name {
  font-weight: 700;
  font-size: 15px;
}

.profile-email {
  color: #536471;
  font-size: 13px;
}

.user-dropdown {
  position: absolute;
  bottom: 60px;
  left: 0;
  width: 200px;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 0 15px rgba(101, 119, 134, 0.2);
  z-index: 10;
}

.dropdown-item {
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background-color: rgba(15, 20, 25, 0.1);
}

/* 中间内容区域 */
.twitter-main {
  flex: 1;
  border-right: 1px solid #eff3f4;
  max-width: 600px;
  height: 100%;
  overflow-y: auto;
}

.twitter-header {
  padding: 0 16px;
  height: 53px;
  display: flex;
  align-items: center;
  position: sticky;
  top: 0;
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #eff3f4;
  z-index: 3;
}

.header-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}

.twitter-content {
  height: calc(100% - 53px);
}

/* 认证页面样式 */
.auth-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1da1f2 0%, #1a91da 100%);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .twitter-sidebar {
    width: 88px;
  }
  
  .nav-text,
  .profile-info {
    display: none;
  }
  
  .nav-icon {
    margin-right: 0;
  }
  
  .nav-item,
  .twitter-profile {
    justify-content: center;
  }
  
  .profile-avatar {
    margin-right: 0;
  }
}

@media (max-width: 688px) {
  .twitter-main {
    max-width: none;
  }
}
</style>

<style>
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  background-color: #f5f7fa;
  color: #303133;
  line-height: 1.6;
}

#app {
  height: 100vh;
  overflow: hidden;
}

/* Element Plus 组件样式覆盖 */
.el-menu {
  border-right: none !important;
}

.el-aside {
  overflow: visible !important;
}

.el-header {
  padding: 0 !important;
}

.el-main {
  padding: 0 !important;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 卡片样式 */
.card {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from {
  transform: translateX(-100%);
}

.slide-leave-to {
  transform: translateX(100%);
}
</style>