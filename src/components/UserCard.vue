<template>
  <div class="user-card bg-white rounded-lg shadow-md p-4 border border-gray-200">
    <!-- 用户头像和基本信息 -->
    <div class="flex items-center mb-3">
      <img 
        :src="user.avatar_url || '/default-avatar.png'" 
        :alt="user.username || '用户'"
        class="w-16 h-16 rounded-full object-cover mr-4"
      >
      <div>
        <div class="text-lg font-semibold">{{ user.username || '匿名用户' }}</div>
        <div class="text-sm text-gray-500">{{ formatDate(user.created_at) }}加入</div>
      </div>
    </div>
    
    <!-- 关注统计 -->
    <div class="flex justify-around mb-4 text-center">
      <div>
        <div class="font-semibold">{{ user.follower_count || 0 }}</div>
        <div class="text-xs text-gray-500">粉丝</div>
      </div>
      <div>
        <div class="font-semibold">{{ user.following_count || 0 }}</div>
        <div class="text-xs text-gray-500">关注</div>
      </div>
    </div>
    
    <!-- 关注按钮 -->
    <div v-if="user.id !== currentUserId" class="flex justify-center">
      <el-button 
        type="primary" 
        :plain="!isFollowing"
        @click="toggleFollow"
        :loading="loading"
      >
        {{ isFollowing ? '取消关注' : '关注' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSocialStore } from '../stores/social'
import { useProfileStore } from '../stores/profile'
import { ElMessage } from 'element-plus'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

// 定义属性
const props = defineProps({
  user: {
    type: Object,
    required: true
  }
})

// Store
const socialStore = useSocialStore()
const profileStore = useProfileStore()

// 状态
const isFollowing = ref(false)
const loading = ref(false)
const currentUserId = profileStore.profile?.id

// 初始化
onMounted(async () => {
  if (props.user.id && props.user.id !== currentUserId) {
    isFollowing.value = await socialStore.checkFollowStatus(props.user.id)
  }
})

// 格式化日期
function formatDate(dateString: string) {
  try {
    return format(new Date(dateString), 'yyyy年MM月', { locale: zhCN })
  } catch (e) {
    return ''
  }
}

// 切换关注状态
async function toggleFollow() {
  if (!props.user.id) return
  
  loading.value = true
  
  try {
    if (isFollowing.value) {
      const success = await socialStore.unfollowUser(props.user.id)
      if (success) {
        isFollowing.value = false
        ElMessage.success(`已取消关注 ${props.user.username || '用户'}`)
      }
    } else {
      const success = await socialStore.followUser(props.user.id)
      if (success) {
        isFollowing.value = true
        ElMessage.success(`已关注 ${props.user.username || '用户'}`)
      }
    }
  } finally {
    loading.value = false
  }
}
</script>