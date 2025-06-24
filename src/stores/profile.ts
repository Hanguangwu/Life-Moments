/**
 * 用户Profile状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { SupabaseProfileService, type Profile, type UpdateProfileRequest } from '../services/profile'

/**
 * Profile Store
 */
export const useProfileStore = defineStore('profile', () => {
  // 状态
  const profile = ref<Profile | null>(null)
  const loading = ref(false)
  const initialized = ref(false)
  
  // 计算属性
  const username = computed(() => profile.value?.username || '用户')
  const avatarUrl = computed(() => profile.value?.avatar_url || '')
  
  /**
   * 初始化Profile状态
   */
  const initialize = async () => {
    if (initialized.value) return
    
    try {
      loading.value = true
      const data = await SupabaseProfileService.getCurrentProfile()
      profile.value = data
      initialized.value = true
    } catch (error: any) {
      console.error('初始化Profile失败:', error)
      ElMessage.error(error.message || '获取用户信息失败')
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 更新用户Profile
   */
  const updateProfile = async (request: UpdateProfileRequest) => {
    try {
      loading.value = true
      
      const updatedProfile = await SupabaseProfileService.updateProfile(request)
      profile.value = updatedProfile
      
      ElMessage.success('个人资料更新成功')
      return { success: true, data: updatedProfile }
    } catch (error: any) {
      console.error('更新Profile失败:', error)
      ElMessage.error(error.message || '更新个人资料失败')
      return { success: false, error }
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 重置状态
   */
  const reset = () => {
    profile.value = null
    initialized.value = false
  }
  
  return {
    // 状态
    profile,
    loading,
    initialized,
    
    // 计算属性
    username,
    avatarUrl,
    
    // 方法
    initialize,
    updateProfile,
    reset
  }
})