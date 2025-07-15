<template>
  <div class="following-view">
    <h1 class="text-2xl font-bold mb-4">关注动态</h1>
    
    <!-- 加载状态 -->
    <div v-if="loadingFollowingMoments" class="flex justify-center my-8">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
    
    <!-- 无关注内容提示 -->
    <div v-else-if="!hasFollowingMoments" class="text-center my-8 p-6 bg-gray-50 rounded-lg">
      <div class="text-gray-500 mb-4">
        <i class="fas fa-user-friends text-4xl mb-2"></i>
        <p class="text-lg">您还没有关注任何用户或关注的用户没有发布内容</p>
      </div>
      <router-link to="/" class="text-blue-500 hover:underline">
        去发现更多用户 <i class="fas fa-arrow-right ml-1"></i>
      </router-link>
    </div>
    
    <!-- 关注用户的生活片段列表 -->
    <div v-else class="space-y-6">
      <div v-for="moment in followingMoments" :key="moment.id" class="bg-white rounded-lg shadow-md p-4 border border-gray-200">
        <!-- 用户信息 -->
        <div class="flex items-center mb-3">
          <img 
            :src="moment.user?.avatar_url || '/default-avatar.png'" 
            :alt="moment.user?.username || '用户'"
            class="w-10 h-10 rounded-full object-cover mr-3"
          >
          <div>
            <div class="font-medium">{{ moment.user?.username || '匿名用户' }}</div>
            <div class="text-xs text-gray-500">{{ formatDate(moment.created_at) }}</div>
          </div>
        </div>
        
        <!-- 内容 -->
        <div class="mb-3">
          <h3 class="text-lg font-semibold mb-1">{{ moment.title }}</h3>
          <p class="text-gray-700 whitespace-pre-line">{{ moment.content }}</p>
        </div>
        
        <!-- 图片 -->
        <div v-if="moment.images && moment.images.length > 0" class="mb-3">
          <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div 
              v-for="(image, index) in moment.images" 
              :key="index"
              class="relative aspect-square overflow-hidden rounded-md cursor-pointer"
              @click="openImageViewer(moment.images, index)"
            >
              <img 
                :src="image" 
                :alt="`图片 ${index + 1}`"
                class="w-full h-full object-cover"
              >
            </div>
          </div>
        </div>
        
        <!-- 标签 -->
        <div v-if="moment.tags && moment.tags.length > 0" class="flex flex-wrap gap-1 mb-3">
          <span 
            v-for="tag in moment.tags" 
            :key="tag"
            class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
          >
            #{{ tag }}
          </span>
        </div>
        
        <!-- 互动按钮 -->
        <div class="flex justify-between text-gray-500 border-t pt-3">
          <!-- 点赞 -->
          <button 
            class="flex items-center gap-1 hover:text-blue-500 transition-colors"
            :class="{ 'text-blue-500': moment.liked }"
            @click="toggleLike(moment)"
          >
            <i class="fas" :class="moment.liked ? 'fa-heart' : 'fa-heart'"></i>
            <span>{{ moment.like_count || 0 }}</span>
          </button>
          
          <!-- 评论 -->
          <button 
            class="flex items-center gap-1 hover:text-blue-500 transition-colors"
            @click="openCommentDialog(moment)"
          >
            <i class="fas fa-comment"></i>
            <span>{{ moment.comment_count || 0 }}</span>
          </button>
          
          <!-- 转发 -->
          <button 
            class="flex items-center gap-1 hover:text-blue-500 transition-colors"
            :class="{ 'text-blue-500': moment.reposted }"
            @click="openRepostDialog(moment)"
          >
            <i class="fas fa-retweet"></i>
            <span>{{ moment.repost_count || 0 }}</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 图片查看器 -->
    <div v-if="showImageViewer" class="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <button @click="closeImageViewer" class="absolute top-4 right-4 text-white text-2xl">
        <i class="fas fa-times"></i>
      </button>
      <button 
        v-if="currentImageIndex > 0" 
        @click="prevImage" 
        class="absolute left-4 text-white text-4xl"
      >
        <i class="fas fa-chevron-left"></i>
      </button>
      <img 
        :src="currentImages[currentImageIndex]" 
        class="max-h-[90vh] max-w-[90vw] object-contain"
      >
      <button 
        v-if="currentImageIndex < currentImages.length - 1" 
        @click="nextImage" 
        class="absolute right-4 text-white text-4xl"
      >
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
    
    <!-- 评论对话框 -->
    <el-dialog
      v-model="showCommentDialog"
      title="评论"
      width="500px"
    >
      <div v-if="loadingComments" class="flex justify-center my-4">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
      
      <div v-else>
        <!-- 评论表单 -->
        <div class="mb-4">
          <el-input
            v-model="commentContent"
            type="textarea"
            :rows="3"
            placeholder="写下你的评论..."
            maxlength="500"
            show-word-limit
          />
          <div class="flex justify-end mt-2">
            <el-button type="primary" @click="submitComment" :disabled="!commentContent.trim()">
              发布评论
            </el-button>
          </div>
        </div>
        
        <!-- 评论列表 -->
        <div class="space-y-4 max-h-[400px] overflow-y-auto">
          <div v-if="comments.length === 0" class="text-center text-gray-500 py-4">
            暂无评论，快来发表第一条评论吧！
          </div>
          
          <div v-for="comment in comments" :key="comment.id" class="border-b pb-3">
            <div class="flex items-start">
              <img 
                :src="comment.user?.avatar_url || '/default-avatar.png'" 
                :alt="comment.user?.username || '用户'"
                class="w-8 h-8 rounded-full object-cover mr-2 mt-1"
              >
              <div class="flex-1">
                <div class="flex justify-between">
                  <div class="font-medium">{{ comment.user?.username || '匿名用户' }}</div>
                  <div class="text-xs text-gray-500">{{ formatDate(comment.created_at) }}</div>
                </div>
                <p class="text-gray-700 mt-1">{{ comment.content }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
    
    <!-- 转发对话框 -->
    <el-dialog
      v-model="showRepostDialog"
      title="转发"
      width="500px"
    >
      <div v-if="currentMoment" class="mb-4 p-3 bg-gray-50 rounded">
        <div class="font-medium">{{ currentMoment.title }}</div>
        <p class="text-sm text-gray-600 line-clamp-2">{{ currentMoment.content }}</p>
      </div>
      
      <el-input
        v-model="repostContent"
        type="textarea"
        :rows="3"
        placeholder="添加你的评论（可选）"
        maxlength="500"
        show-word-limit
      />
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="showRepostDialog = false">取消</el-button>
          <el-button type="primary" @click="submitRepost">转发</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useSocialStore } from '../stores/social'
import { ElMessage } from 'element-plus'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

// Store
const socialStore = useSocialStore()
const { 
  followingMoments, 
  loadingFollowingMoments,
  hasFollowingMoments,
  comments,
  loadingComments
} = socialStore

// 图片查看器状态
const showImageViewer = ref(false)
const currentImages = ref<string[]>([])
const currentImageIndex = ref(0)

// 评论对话框状态
const showCommentDialog = ref(false)
const commentContent = ref('')
const currentMoment = ref<any>(null)

// 转发对话框状态
const showRepostDialog = ref(false)
const repostContent = ref('')

// 初始化
onMounted(async () => {
  await socialStore.fetchFollowingMoments(true)
})

// 格式化日期
function formatDate(dateString: string) {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: zhCN })
  } catch (e) {
    return dateString
  }
}

// 打开图片查看器
function openImageViewer(images: string[], index: number) {
  currentImages.value = images
  currentImageIndex.value = index
  showImageViewer.value = true
}

// 关闭图片查看器
function closeImageViewer() {
  showImageViewer.value = false
}

// 上一张图片
function prevImage() {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
  }
}

// 下一张图片
function nextImage() {
  if (currentImageIndex.value < currentImages.value.length - 1) {
    currentImageIndex.value++
  }
}

// 切换点赞状态
async function toggleLike(moment: any) {
  if (moment.liked) {
    const success = await socialStore.unlikeMoment(moment.id)
    if (success) {
      ElMessage.success('已取消点赞')
    }
  } else {
    const success = await socialStore.likeMoment(moment.id)
    if (success) {
      ElMessage.success('点赞成功')
    }
  }
}

// 打开评论对话框
async function openCommentDialog(moment: any) {
  currentMoment.value = moment
  showCommentDialog.value = true
  commentContent.value = ''
  await socialStore.fetchComments(moment.id)
}

// 提交评论
async function submitComment() {
  if (!commentContent.value.trim() || !currentMoment.value) return
  
  const comment = await socialStore.createComment(
    currentMoment.value.id,
    commentContent.value.trim()
  )
  
  if (comment) {
    commentContent.value = ''
    ElMessage.success('评论发布成功')
  }
}

// 打开转发对话框
function openRepostDialog(moment: any) {
  currentMoment.value = moment
  showRepostDialog.value = true
  repostContent.value = ''
}

// 提交转发
async function submitRepost() {
  if (!currentMoment.value) return
  
  const repost = await socialStore.createRepost(
    currentMoment.value.id,
    repostContent.value.trim() || undefined
  )
  
  if (repost) {
    showRepostDialog.value = false
    ElMessage.success('转发成功')
  }
}
</script>

<style scoped>
.following-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}
</style>