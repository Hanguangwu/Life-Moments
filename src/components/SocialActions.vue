<template>
  <div class="social-actions flex justify-between text-gray-500 border-t pt-3">
    <!-- 点赞 -->
    <button 
      class="flex items-center gap-1 hover:text-blue-500 transition-colors"
      :class="{ 'text-blue-500': moment.liked }"
      @click="toggleLike"
    >
      <i class="fas" :class="moment.liked ? 'fa-heart' : 'fa-heart'"></i>
      <span>{{ moment.like_count || 0 }}</span>
    </button>
    
    <!-- 评论 -->
    <button 
      class="flex items-center gap-1 hover:text-blue-500 transition-colors"
      @click="openCommentDialog"
    >
      <i class="fas fa-comment"></i>
      <span>{{ moment.comment_count || 0 }}</span>
    </button>
    
    <!-- 转发 -->
    <button 
      class="flex items-center gap-1 hover:text-blue-500 transition-colors"
      :class="{ 'text-blue-500': moment.reposted }"
      @click="openRepostDialog"
    >
      <i class="fas fa-retweet"></i>
      <span>{{ moment.repost_count || 0 }}</span>
    </button>
    
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
                
                <!-- 删除按钮 (仅显示自己的评论) -->
                <div v-if="isCurrentUserComment(comment)" class="flex justify-end mt-1">
                  <el-button type="danger" size="small" text @click="deleteComment(comment.id)">
                    删除
                  </el-button>
                </div>
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
      <div class="mb-4 p-3 bg-gray-50 rounded">
        <div class="font-medium">{{ moment.title }}</div>
        <p class="text-sm text-gray-600 line-clamp-2">{{ moment.content }}</p>
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
import { ref, onMounted } from 'vue'
import { useSocialStore } from '../stores/social'
import { useProfileStore } from '../stores/profile'
import { ElMessage } from 'element-plus'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

// 定义属性
const props = defineProps({
  moment: {
    type: Object,
    required: true
  }
})

// Store
const socialStore = useSocialStore()
const profileStore = useProfileStore()
const { comments, loadingComments } = socialStore

// 评论对话框状态
const showCommentDialog = ref(false)
const commentContent = ref('')

// 转发对话框状态
const showRepostDialog = ref(false)
const repostContent = ref('')

// 初始化
onMounted(async () => {
  // 检查点赞和转发状态
  if (props.moment && !props.moment.liked) {
    props.moment.liked = await socialStore.hasLiked(props.moment.id)
  }
  
  if (props.moment && !props.moment.reposted) {
    props.moment.reposted = await socialStore.hasReposted(props.moment.id)
  }
})

// 格式化日期
function formatDate(dateString: string) {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: zhCN })
  } catch (e) {
    return dateString
  }
}

// 切换点赞状态
async function toggleLike() {
  if (props.moment.liked) {
    const success = await socialStore.unlikeMoment(props.moment.id)
    if (success) {
      ElMessage.success('已取消点赞')
    }
  } else {
    const success = await socialStore.likeMoment(props.moment.id)
    if (success) {
      ElMessage.success('点赞成功')
    }
  }
}

// 打开评论对话框
async function openCommentDialog() {
  showCommentDialog.value = true
  commentContent.value = ''
  await socialStore.fetchComments(props.moment.id)
}

// 提交评论
async function submitComment() {
  if (!commentContent.value.trim()) return
  
  const comment = await socialStore.createComment(
    props.moment.id,
    commentContent.value.trim()
  )
  
  if (comment) {
    commentContent.value = ''
    ElMessage.success('评论发布成功')
  }
}

// 删除评论
async function deleteComment(commentId: string) {
  const success = await socialStore.deleteComment(commentId, props.moment.id)
  
  if (success) {
    ElMessage.success('评论已删除')
  }
}

// 判断是否是当前用户的评论
function isCurrentUserComment(comment: any) {
  return comment.user_id === profileStore.profile?.id
}

// 打开转发对话框
function openRepostDialog() {
  showRepostDialog.value = true
  repostContent.value = ''
}

// 提交转发
async function submitRepost() {
  const repost = await socialStore.createRepost(
    props.moment.id,
    repostContent.value.trim() || undefined
  )
  
  if (repost) {
    showRepostDialog.value = false
    ElMessage.success('转发成功')
  }
}
</script>