<template>
  <div class="recommended-users bg-white rounded-lg shadow-md p-4 border border-gray-200">
    <h3 class="text-lg font-semibold mb-3">推荐关注</h3>
    
    <!-- 加载状态 -->
    <div v-if="loadingRecommendedUsers" class="flex justify-center my-4">
      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
    
    <!-- 推荐用户列表 -->
    <div v-else-if="recommendedUsers.length > 0" class="space-y-4">
      <div 
        v-for="user in recommendedUsers" 
        :key="user.id"
        class="flex items-center justify-between"
      >
        <div class="flex items-center">
          <img 
            :src="user.avatar_url || '/default-avatar.png'" 
            :alt="user.username || '用户'"
            class="w-10 h-10 rounded-full object-cover mr-3"
          >
          <div>
            <div class="font-medium">{{ user.username || '匿名用户' }}</div>
            <div class="text-xs text-gray-500">
              {{ user.follower_count || 0 }} 粉丝
            </div>
          </div>
        </div>
        
        <el-button 
          size="small" 
          type="primary" 
          plain
          @click="followUser(user)"
          :loading="followingUserId === user.id"
        >
          关注
        </el-button>
      </div>
    </div>
    
    <!-- 无推荐用户 -->
    <div v-else class="text-center text-gray-500 py-4">
      暂无推荐用户
    </div>
    
    <!-- 查看更多按钮 -->
    <div v-if="recommendedUsers.length > 0" class="mt-4 text-center">
      <el-button link type="primary" @click="$emit('view-more')">
        查看更多
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSocialStore } from '../stores/social'
import { ElMessage } from 'element-plus'

// 定义属性
const props = defineProps({
  limit: {
    type: Number,
    default: 5
  }
})

// 定义事件
const emit = defineEmits(['view-more'])

// Store
const socialStore = useSocialStore()
const { recommendedUsers, loadingRecommendedUsers } = socialStore

// 关注状态
const followingUserId = ref('')

// 初始化
socialStore.fetchRecommendedUsers(props.limit)

// 关注用户
async function followUser(user: any) {
  followingUserId.value = user.id
  
  try {
    const success = await socialStore.followUser(user.id)
    
    if (success) {
      ElMessage.success(`已关注 ${user.username || '用户'}`)
    }
  } finally {
    followingUserId.value = ''
  }
}
</script>

<style scoped>
.recommended-users {
  position: sticky;
  top: 1rem;
}
</style>