<template>
  <div class="twitter-container">
    <div class="flex">
      <!-- 左侧主内容区域 -->
      <div class="flex-1 pr-4">
        <!-- 发布区域 -->
        <div class="compose-area">
          <div class="compose-header">
            <div class="compose-tabs">
              <div 
                class="compose-tab" 
                :class="{ active: activeTab === 'for-you' }"
                @click="setActiveTab('for-you')"
              >
                为你
              </div>
              <div 
                class="compose-tab" 
                :class="{ active: activeTab === 'following' }"
                @click="setActiveTab('following')"
              >
                关注
              </div>
            </div>
            <div class="filter-icon" @click="showFilterDropdown = !showFilterDropdown">
              <el-icon><Setting /></el-icon>
              
              <!-- 筛选下拉菜单 -->
              <div v-if="showFilterDropdown" class="filter-dropdown">
                <div class="filter-header">筛选生活片段</div>
                
                <div class="filter-section">
                  <div class="filter-label">按标签筛选</div>
                  <el-select
                    v-model="selectedTags"
                    multiple
                    filterable
                    allow-create
                    default-first-option
                    placeholder="选择或输入标签"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="tag in availableTags"
                      :key="tag"
                      :label="tag"
                      :value="tag"
                    />
                  </el-select>
                </div>
                
                <div class="filter-section">
                  <div class="filter-label">按日期范围筛选</div>
                  <el-date-picker
                    v-model="localDateRange"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </div>
                
                <div class="filter-actions">
                  <el-button @click="clearFilters">清除筛选</el-button>
                  <el-button type="primary" @click="applyFilters">应用</el-button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="compose-content" @click="showCreateDialog = true">
            <div class="compose-avatar">
              <el-avatar :size="48" :src="profileStore.avatarUrl">
                <el-icon><User /></el-icon>
              </el-avatar>
            </div>
            <div class="compose-input">
              <div class="compose-placeholder">发生了什么？</div>
            </div>
          </div>
        </div>
        
        <!-- 统计信息 -->
        <div class="stats-bar">
          <div class="stat-item">
            <div class="stat-number">{{ totalCount }}</div>
            <div class="stat-label">总记录</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ recentMoments.length }}</div>
            <div class="stat-label">最近30天</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ moments.length }}</div>
            <div class="stat-label">当前显示</div>
          </div>
        </div>

        <!-- 生活片段列表 -->
        <div class="tweet-list" v-loading="loading">
          <div v-if="moments.length === 0" class="empty-state">
            <el-empty description="暂无生活片段" />
            <el-button type="primary" @click="showCreateDialog = true">创建第一条生活片段</el-button>
          </div>
          
          <div v-else>
            <div
              v-for="moment in moments"
              :key="moment.id"
              class="tweet"
            >
              <div class="tweet-avatar">
                <el-avatar :size="48">
                  <el-icon><User /></el-icon>
                </el-avatar>
              </div>
              
              <div class="tweet-content">
                <div class="tweet-header">
                  <div class="tweet-user">
                    <span class="tweet-name">{{ authStore.user?.email?.split('@')[0] }}</span>
                    <span class="tweet-username">@{{ authStore.user?.email?.split('@')[0] }}</span>
                  </div>
                  <div class="tweet-time">{{ formatDateTime(moment.created_at) }}</div>
                  <div class="tweet-actions">
                    <el-dropdown trigger="click">
                      <el-icon class="more-icon"><MoreFilled /></el-icon>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item @click="editMoment(moment)">
                            <el-icon><Edit /></el-icon> 编辑
                          </el-dropdown-item>
                          <el-dropdown-item @click="deleteMoment(moment.id!)">
                            <el-icon><Delete /></el-icon> 删除
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </div>
                
                <div class="tweet-title">{{ moment.title }}</div>
                
                <div class="tweet-text">{{ moment.content }}</div>
                
                <!-- 图片展示 -->
                <div v-if="moment.images.length > 0" class="tweet-images">
                  <div class="image-grid" :class="'grid-' + moment.images.length">
                    <div
                      v-for="(image, index) in moment.images"
                      :key="index"
                      class="image-item"
                    >
                      <el-image
                        :src="image"
                        :preview-src-list="moment.images"
                        :initial-index="index"
                        fit="cover"
                        class="tweet-image"
                      />
                      <div class="image-overlay">
                        <el-button
                          size="small"
                          type="danger"
                          circle
                          @click="deleteImage(moment.id!, index)"
                        >
                          <el-icon><Delete /></el-icon>
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 标签和日期 -->
                <div class="tweet-meta">
                  <div class="tweet-date">
                    <el-icon><Calendar /></el-icon>
                    {{ formatDate(moment.date) }}
                  </div>
                  
                  <div v-if="moment.tags.length > 0" class="tweet-tags">
                    <el-tag
                      v-for="tag in moment.tags"
                      :key="tag"
                      size="small"
                      class="tag-item"
                      effect="plain"
                    >
                      #{{ tag }}
                    </el-tag>
                  </div>
                </div>
                
                <!-- 社交互动按钮 -->
                <social-actions 
                  :moment="moment" 
                  @comment="openCommentDialog(moment)" 
                  @repost="openRepostDialog(moment)" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 右侧边栏 -->
      <div class="sidebar w-80">
        <recommended-users @view-more="showMoreRecommendedUsers" />
      </div>
    </div>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingMoment ? '编辑生活片段' : '新增生活片段'"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题" />
        </el-form-item>
        
        <el-form-item label="日期" prop="date">
          <el-date-picker
            v-model="form.date"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="4"
            placeholder="请输入生活片段内容"
          />
        </el-form-item>
        
        <el-form-item label="标签">
          <el-tag
            v-for="tag in dynamicTags"
            :key="tag"
            closable
            :disable-transitions="false"
            @close="handleTagClose(tag)"
          >
            {{ tag }}
          </el-tag>
          <el-input
            v-if="inputTagVisible"
            ref="tagInputRef"
            v-model="inputTagValue"
            class="tag-input"
            size="small"
            @keyup.enter="handleTagConfirm"
            @blur="handleTagConfirm"
          />
          <el-button v-else class="button-new-tag" size="small" @click="showTagInput">
            + 新标签
          </el-button>
        </el-form-item>
        
        <el-form-item label="图片">
          <el-upload
            action=""
            list-type="picture-card"
            :auto-upload="false"
            :file-list="fileList"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :limit="5"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div class="el-upload__tip">支持jpg、png、gif格式，单个文件不超过5MB</div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">
            {{ editingMoment ? '更新' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="showDeleteDialog"
      title="确认删除"
      width="400px"
    >
      <p>确定要删除这条生活片段吗？此操作不可恢复。</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDeleteDialog = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete" :loading="deleting">
            确认删除
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 评论对话框 -->
    <el-dialog
      v-model="showCommentDialog"
      title="评论"
      width="500px"
      v-if="currentMoment"
    >
      <div v-if="!currentMoment" class="empty-state">
        <el-empty description="加载中..." />
      </div>
      <social-actions
        v-else
        :moment="currentMoment"
        :show-comment-dialog="true"
        @close="showCommentDialog = false"
      />
    </el-dialog>
    
    <!-- 转发对话框 -->
    <el-dialog
      v-model="showRepostDialog"
      title="转发"
      width="500px"
      v-if="currentMoment"
    >
      <div v-if="!currentMoment" class="empty-state">
        <el-empty description="加载中..." />
      </div>
      <social-actions
        v-else
        :moment="currentMoment"
        :show-repost-dialog="true"
        @close="showRepostDialog = false"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, UploadUserFile } from 'element-plus'
import { useMomentStore } from '../stores/moment'
import { useAuthStore } from '../stores/auth'
import { useProfileStore } from '../stores/profile'
import type { Moment, CreateMomentRequest, UpdateMomentRequest } from '../types/moment'
import { Search, Plus, Edit, Delete, Calendar, Setting, User, Picture, PriceTag, MoreFilled } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia';
import SocialActions from '../components/SocialActions.vue'
import RecommendedUsers from '../components/RecommendedUsers.vue'

// 状态管理
const momentStore = useMomentStore()
const authStore = useAuthStore()
const profileStore = useProfileStore()
const {
  fetchMoments,
  fetchMomentsByDateRange,
  fetchMomentsByTags,
  createMoment,
  updateMoment,
  deleteMoment: storeDeletMoment,
  deleteImage: storeDeleteImage,
  setFilter,
  clearFilters: storeClearFilters
} = momentStore
const {
  moments,
  loading,
  currentFilter,
  selectedTags,
  dateRange,
  filteredMoments,
  totalMoments,
  totalCount,
  recentMoments,
  allTags
} = storeToRefs(momentStore)

// 标签页相关
const activeTab = ref('for-you')
const setActiveTab = (tab: string) => {
  activeTab.value = tab
  if (tab === 'following') {
    // 可以在这里添加导航到关注页面的逻辑
    ElMessage.info('关注功能即将上线')
  }
}

// 社交互动相关
const currentMoment = ref<Moment | null>(null)
const showCommentDialog = ref(false)
const showRepostDialog = ref(false)

// 筛选相关
const showFilterDropdown = ref(false)

// 表单相关
const formRef = ref<FormInstance>()
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const editingMoment = ref<Moment | null>(null)
const momentToDeleteId = ref<string>('')
const fileList = ref<UploadUserFile[]>([])

// 表单数据
const form = ref({
  title: '',
  content: '',
  date: new Date().toISOString().split('T')[0],
  tags: [] as string[],
  images: [] as File[]
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度应在2到100个字符之间', trigger: 'blur' }
  ],
  date: [
    { required: true, message: '请选择日期', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' },
    { min: 2, max: 2000, message: '内容长度应在2到2000个字符之间', trigger: 'blur' }
  ]
}

// 标签相关
const dynamicTags = ref<string[]>([])
const inputTagVisible = ref(false)
const inputTagValue = ref('')
const tagInputRef = ref<HTMLInputElement>()

// 日期范围
const localDateRange = ref<[string, string] | null>(null)

// 生命周期钩子
onMounted(async () => {
  // 强制刷新数据，确保每次组件挂载时都从服务器获取最新数据
  await fetchMoments()
})

// 方法
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const year = date.getFullYear() + 552 // 圣元年份
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `圣元${year}年${month}月${day}日`
}

const formatDateTime = (dateTimeStr: string) => {
  const date = new Date(dateTimeStr)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const handleFilterChange = (value: 'all' | 'recent' | 'tagged') => {
  setFilter(value)
}

const applyFilters = async () => {
  if (localDateRange.value) {
    const [start, end] = localDateRange.value
    await fetchMomentsByDateRange(start, end)
  } else if (selectedTags.value.length > 0) {
    await fetchMomentsByTags(selectedTags.value)
  } else {
    await fetchMoments()
  }
  showFilterDropdown.value = false
}

const clearFilters = () => {
  localDateRange.value = null
  storeClearFilters()
  showFilterDropdown.value = false
}

const resetForm = () => {
  formRef.value?.resetFields()
  form.value = {
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    tags: [],
    images: []
  }
  dynamicTags.value = []
  fileList.value = []
  editingMoment.value = null
}

const editMoment = (moment: Moment) => {
  editingMoment.value = moment
  form.value.title = moment.title
  form.value.content = moment.content
  form.value.date = moment.date
  dynamicTags.value = [...moment.tags]
  form.value.tags = [...moment.tags]
  fileList.value = []
  showCreateDialog.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        form.value.tags = dynamicTags.value
        
        if (editingMoment.value) {
          // 更新生活片段
          const updateRequest: UpdateMomentRequest = {
            title: form.value.title,
            content: form.value.content,
            date: form.value.date,
            tags: form.value.tags
          }
          
          // 只有当有新文件时才包含images字段
          if (form.value.images.length > 0) {
            updateRequest.images = form.value.images
          }
          
          await updateMoment(editingMoment.value.id!, updateRequest)
          ElMessage.success('生活片段更新成功')
        } else {
          // 创建新生活片段
          const createRequest: CreateMomentRequest = {
            title: form.value.title,
            content: form.value.content,
            date: form.value.date,
            tags: form.value.tags,
            images: form.value.images
          }
          
          await createMoment(createRequest)
          ElMessage.success('生活片段创建成功')
        }
        
        // 强制刷新数据，确保新创建或更新的内容显示在页面上
        await fetchMoments()
        
        showCreateDialog.value = false
        resetForm()
      } catch (error) {
        console.error('提交表单失败:', error)
        ElMessage.error(`操作失败: ${error instanceof Error ? error.message : '未知错误'}`)
      } finally {
        submitting.value = false
      }
    }
  })
}

const deleteMoment = (id: string) => {
  momentToDeleteId.value = id
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (!momentToDeleteId.value) return
  
  deleting.value = true
  try {
    await storeDeletMoment(momentToDeleteId.value)
    // 强制刷新数据，确保删除后的内容不再显示在页面上
    await fetchMoments()
    ElMessage.success('生活片段删除成功')
    showDeleteDialog.value = false
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`)
  } finally {
    deleting.value = false
  }
}

const deleteImage = async (momentId: string, imageIndex: number) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这张图片吗？此操作不可恢复。',
      '确认删除',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await storeDeleteImage(momentId, imageIndex)
    ElMessage.success('图片删除成功')
    
    // 强制刷新数据，确保删除图片后的内容更新显示在页面上
    await fetchMoments()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除图片失败:', error)
      ElMessage.error(`删除图片失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
}

// 打开评论对话框
const openCommentDialog = (moment: Moment) => {
  currentMoment.value = moment
  showCommentDialog.value = true
}

// 打开转发对话框
const openRepostDialog = (moment: Moment) => {
  currentMoment.value = moment
  showRepostDialog.value = true
}

// 查看更多推荐用户
const showMoreRecommendedUsers = () => {
  ElMessage.info('查看更多推荐用户功能即将上线')
}

// 标签相关方法
const handleTagClose = (tag: string) => {
  dynamicTags.value.splice(dynamicTags.value.indexOf(tag), 1)
}

const showTagInput = () => {
  inputTagVisible.value = true
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

const handleTagConfirm = () => {
  if (inputTagValue.value) {
    if (!dynamicTags.value.includes(inputTagValue.value)) {
      dynamicTags.value.push(inputTagValue.value)
    }
  }
  inputTagVisible.value = false
  inputTagValue.value = ''
}

// 文件上传相关方法
const handleFileChange = (uploadFile: UploadUserFile) => {
  const file = uploadFile.raw
  if (!file) return
  
  // 验证文件类型和大小
  const isImage = /\.(jpe?g|png|gif)$/i.test(file.name)
  const isLt5M = file.size / 1024 / 1024 < 5
  
  if (!isImage) {
    ElMessage.error('只能上传jpg、jpeg、png、gif格式的图片!')
    const index = fileList.value.indexOf(uploadFile)
    if (index !== -1) {
      fileList.value.splice(index, 1)
    }
    return
  }
  
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过5MB!')
    const index = fileList.value.indexOf(uploadFile)
    if (index !== -1) {
      fileList.value.splice(index, 1)
    }
    return
  }
  
  // 添加到表单数据
  form.value.images.push(file as File)
}

const handleFileRemove = (uploadFile: UploadUserFile) => {
  const file = uploadFile.raw
  if (!file) return
  
  const index = form.value.images.findIndex(f => f === file)
  if (index !== -1) {
    form.value.images.splice(index, 1)
  }
}
</script>

<style scoped>
.twitter-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

/* 侧边栏样式 */
.sidebar {
  position: sticky;
  top: 16px;
  height: fit-content;
}

/* 发布区域样式 */
.compose-area {
  border-bottom: 1px solid #eee;
  padding: 0 16px;
}

.compose-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 53px;
  position: relative;
}

.compose-tabs {
  display: flex;
  width: 100%;
}

.compose-tab {
  flex: 1;
  text-align: center;
  padding: 16px 0;
  font-weight: bold;
  color: #536471;
  cursor: pointer;
  position: relative;
}

.compose-tab.active {
  color: #000;
}

.compose-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 56px;
  height: 4px;
  background-color: #1d9bf0;
  border-radius: 9999px;
}

.filter-icon {
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  position: relative;
}

.filter-icon:hover {
  background-color: rgba(29, 155, 240, 0.1);
}

.filter-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 300px;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 0 15px rgba(101, 119, 134, 0.2);
  z-index: 10;
  padding: 16px;
}

.filter-header {
  font-weight: bold;
  font-size: 20px;
  margin-bottom: 16px;
}

.filter-section {
  margin-bottom: 16px;
}

.filter-label {
  font-weight: bold;
  margin-bottom: 8px;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.compose-content {
  display: flex;
  padding: 12px 0;
  cursor: pointer;
}

.compose-avatar {
  margin-right: 12px;
}

.compose-input {
  flex: 1;
}

.compose-placeholder {
  color: #536471;
  font-size: 20px;
  margin-bottom: 32px;
}

.compose-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.compose-icons {
  display: flex;
  gap: 16px;
  color: #1d9bf0;
}

.compose-button {
  background-color: #1d9bf0;
  border-color: #1d9bf0;
  border-radius: 9999px;
  padding: 0 16px;
  height: 36px;
}

/* 统计信息样式 */
.stats-bar {
  display: flex;
  justify-content: space-around;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-weight: bold;
  font-size: 18px;
  color: #000;
}

.stat-label {
  font-size: 13px;
  color: #536471;
}

/* 推文列表样式 */
.tweet-list {
  padding-bottom: 72px;
}

.empty-state {
  padding: 32px 16px;
  text-align: center;
}

.tweet {
  display: flex;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}

.tweet:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.tweet-avatar {
  margin-right: 12px;
}

.tweet-content {
  flex: 1;
}

.tweet-header {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  position: relative;
}

.tweet-user {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-right: auto;
}

.tweet-name {
  font-weight: bold;
  margin-right: 4px;
}

.tweet-username {
  color: #536471;
}

.tweet-time {
  color: #536471;
  font-size: 14px;
  margin-right: 8px;
}

.tweet-actions {
  position: relative;
}

.more-icon {
  cursor: pointer;
  color: #536471;
}

.tweet-title {
  font-weight: bold;
  margin-bottom: 4px;
}

.tweet-text {
  margin-bottom: 12px;
  white-space: pre-line;
}

/* 图片样式 */
.tweet-images {
  margin-bottom: 12px;
}

.image-grid {
  display: grid;
  gap: 2px;
  border-radius: 16px;
  overflow: hidden;
}

.grid-1 {
  grid-template-columns: 1fr;
}

.grid-2 {
  grid-template-columns: 1fr 1fr;
}

.grid-3 {
  grid-template-columns: 1fr 1fr;
}

.grid-3 .image-item:first-child {
  grid-column: span 2;
}

.grid-4 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.image-item {
  position: relative;
  aspect-ratio: 16/9;
}

.tweet-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-item:hover .image-overlay {
  opacity: 1;
}

/* 元数据样式 */
.tweet-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #536471;
  font-size: 14px;
}

.tweet-date {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tweet-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  margin: 0;
  color: #1d9bf0;
  border-color: transparent;
  background-color: transparent;
  padding: 0;
}

/* 表单样式 */
.form-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.tag-input {
  width: 90px;
  margin-left: 10px;
  vertical-align: bottom;
}

.button-new-tag {
  margin-left: 10px;
  height: 32px;
  line-height: 30px;
  padding-top: 0;
  padding-bottom: 0;
}

.upload-demo {
  margin-top: 15px;
}

.image-preview {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.preview-item {
  position: relative;
  width: 100px;
  height: 100px;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.preview-delete {
  position: absolute;
  top: 5px;
  right: 5px;
}
</style>