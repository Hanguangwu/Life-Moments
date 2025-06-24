<template>
  <div class="settings-page">
    <div class="settings-header">
      <h2>设置</h2>
      <p>配置您的个人信息和应用偏好设置</p>
    </div>

    <!-- 个人资料设置 -->
    <el-card class="settings-section" shadow="hover">
      <template #header>
        <div class="section-header">
          <el-icon><User /></el-icon>
          <span>个人资料</span>
        </div>
      </template>
      
      <el-form label-width="120px">
        <el-form-item label="头像">
          <div class="avatar-container">
            <el-avatar 
              :size="100" 
              :src="profileStore.avatarUrl || defaultAvatar" 
              @error="() => false"
            />
            <el-upload
              class="avatar-uploader"
              :show-file-list="false"
              :before-upload="beforeAvatarUpload"
              :http-request="uploadAvatar"
            >
              <el-button type="primary" :loading="profileStore.loading">
                更换头像
              </el-button>
            </el-upload>
          </div>
        </el-form-item>
        
        <el-form-item label="用户名">
          <el-input 
            v-model="usernameInput" 
            placeholder="请输入用户名"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="邮箱">
          <span>{{ profileStore.profile?.email || authStore.user?.email || '未设置' }}</span>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="updateProfile"
            :loading="profileStore.loading"
          >
            保存个人资料
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 界面设置 -->
    <el-card class="settings-section" shadow="hover">
      <template #header>
        <div class="section-header">
          <el-icon><Monitor /></el-icon>
          <span>界面设置</span>
        </div>
      </template>
      
      <el-form label-width="120px">
        <el-form-item label="主题模式">
          <el-radio-group v-model="uiConfig.theme" @change="saveUiConfig">
            <el-radio value="light">浅色模式</el-radio>
            <el-radio value="dark">深色模式</el-radio>
            <el-radio value="auto">跟随系统</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="语言">
          <el-select v-model="uiConfig.language" @change="saveUiConfig">
            <el-option label="简体中文" value="zh-CN" />
            <el-option label="English" value="en-US" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="侧边栏">
          <el-switch 
            v-model="uiConfig.sidebarCollapsed" 
            @change="saveUiConfig"
            active-text="默认折叠"
            inactive-text="默认展开"
          />
        </el-form-item>
        
        <el-form-item label="动画效果">
          <el-switch 
            v-model="uiConfig.animations" 
            @change="saveUiConfig"
            active-text="开启"
            inactive-text="关闭"
          />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 关于信息 -->
    <el-card class="settings-section" shadow="hover">
      <template #header>
        <div class="section-header">
          <el-icon><InfoFilled /></el-icon>
          <span>关于</span>
        </div>
      </template>
      
      <el-form label-width="120px">
        <el-form-item label="应用名称">
          <span>Life Moments</span>
        </el-form-item>
        
        <el-form-item label="版本">
          <span>{{ appInfo.version }}</span>
        </el-form-item>
        
        <el-form-item label="技术栈">
          <div class="tech-stack">
            <el-tag size="small" style="margin-right: 8px;">Vue 3</el-tag>
            <el-tag size="small" style="margin-right: 8px;">TypeScript</el-tag>
            <el-tag size="small" style="margin-right: 8px;">Supabase</el-tag>
            <el-tag size="small" style="margin-right: 8px;">Element Plus</el-tag>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import {
  Monitor,
  InfoFilled,
  User
} from '@element-plus/icons-vue';
import { useAuthStore } from '../stores/auth';
import { useProfileStore } from '../stores/profile';

// 引入store
const authStore = useAuthStore();
const profileStore = useProfileStore();

// 默认头像
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

// 用户名输入
const usernameInput = ref('');

// 响应式数据
const uiConfig = reactive({
  theme: 'light',
  language: 'zh-CN',
  sidebarCollapsed: false,
  animations: true,
});

// 应用信息
const appInfo = reactive({
  version: '1.0.0',
});

/**
 * 保存界面配置
 */
const saveUiConfig = async () => {
  try {
    localStorage.setItem('ui_config', JSON.stringify(uiConfig));
    ElMessage.success('界面设置已保存');
  } catch (error) {
    ElMessage.error('保存设置失败');
  }
};

/**
 * 头像上传前的验证
 */
const beforeAvatarUpload = (file: File) => {
  const isImage = file.type.startsWith('image/');
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isImage) {
    ElMessage.error('头像必须是图片格式!');
    return false;
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!');
    return false;
  }
  return true;
};

/**
 * 自定义上传头像方法
 */
const uploadAvatar = async (options: any) => {
  const file = options.file;
  if (!file) return;
  
  try {
    await profileStore.updateProfile({
      avatar: file
    });
  } catch (error) {
    console.error('上传头像失败:', error);
  }
};

/**
 * 更新用户资料
 */
const updateProfile = async () => {
  if (!usernameInput.value.trim()) {
    ElMessage.warning('用户名不能为空');
    return;
  }
  
  try {
    await profileStore.updateProfile({
      username: usernameInput.value.trim()
    });
  } catch (error) {
    console.error('更新用户资料失败:', error);
  }
};

/**
 * 加载配置
 */
const loadConfigs = () => {
  try {
    const uiConfigStr = localStorage.getItem('ui_config');
    if (uiConfigStr) {
      Object.assign(uiConfig, JSON.parse(uiConfigStr));
    }
    
    // 设置用户名输入框的初始值
    usernameInput.value = profileStore.username;
  } catch (error) {
    console.error('加载配置失败:', error);
  }
};

// 组件挂载时加载配置和数据
onMounted(async () => {
  // 确保用户已登录
  if (authStore.isAuthenticated) {
    await profileStore.initialize();
  }
  
  loadConfigs();
});
</script>

<style scoped>
.settings-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.settings-header {
  margin-bottom: 24px;
}

.settings-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 24px;
}

.settings-header p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.settings-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #303133;
}

.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

:deep(.el-form-item__label) {
  color: #606266;
  font-weight: 500;
}

:deep(.el-card__header) {
  background-color: #fafafa;
  border-bottom: 1px solid #ebeef5;
}

@media (max-width: 768px) {
  .settings-page {
    padding: 16px;
  }
  
  .avatar-container {
    flex-direction: column;
    align-items: center;
  }
}
</style>