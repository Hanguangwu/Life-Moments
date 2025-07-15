/**
 * 生活片段状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Moment, CreateMomentRequest, UpdateMomentRequest } from '../types/moment'
import { SupabaseMomentService } from '../services/moment'

export const useMomentStore = defineStore('moment', () => {
  
  // 状态初始化为空
  const moments = ref<Moment[]>([])  // 这里初始为空
  const loading = ref(false)
  const currentFilter = ref<'all' | 'recent' | 'tagged'>('all')
  const selectedTags = ref<string[]>([])
  const dateRange = ref<{ start: string; end: string } | null>(null)

  // 计算属性
  const filteredMoments = computed(() => {
    let filtered = moments.value

    // 按标签过滤
    if (selectedTags.value.length > 0) {
      filtered = filtered.filter(moment => 
        moment.tags.some(tag => selectedTags.value.includes(tag))
      )
    }

    // 按日期范围过滤
    if (dateRange.value) {
      filtered = filtered.filter(moment => 
        moment.date >= dateRange.value!.start && 
        moment.date <= dateRange.value!.end
      )
    }

    return filtered
  })

  const totalCount = computed(() => moments.value.length)

  const recentMoments = computed(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]
    
    return moments.value.filter(moment => 
      moment.date >= thirtyDaysAgoStr
    )
  })

  const allTags = computed(() => {
    const tagsSet = new Set<string>()
    moments.value.forEach(moment => {
      moment.tags.forEach(tag => tagsSet.add(tag))
    })
    return Array.from(tagsSet).sort()
  })
  
  const fetchMoments = async () => {
    loading.value = true
    try {
      if (!navigator.onLine && moments.value.length > 0) {
        loading.value = false
        return
      }
      const data = await SupabaseMomentService.getAll()
      moments.value = data
    } catch (error) {
      console.error('获取生活片段失败:', error)
    } finally {
      loading.value = false
      return filteredMoments
    }
  }

  const fetchMomentsByDateRange = async (start: string, end: string) => {
    loading.value = true
    try {
      moments.value = await SupabaseMomentService.getByDateRange(start, end)
      dateRange.value = { start, end }
    } catch (error) {
      console.error('按日期范围获取生活片段失败:', error)
    } finally {
      loading.value = false
    }
  }

  const fetchMomentsByTags = async (tags: string[]) => {
    if (tags.length === 0) {
      return await fetchMoments()
    }
    
    loading.value = true
    try {
      moments.value = await SupabaseMomentService.searchByTags(tags)
      selectedTags.value = tags
    } catch (error) {
      console.error('按标签获取生活片段失败:', error)
    } finally {
      loading.value = false
    }
  }

  const createMoment = async (request: CreateMomentRequest) => {
    loading.value = true
    try {
      const newMoment = await SupabaseMomentService.create(request)
      moments.value = [newMoment, ...moments.value]
      return newMoment
    } catch (error) {
      console.error('创建生活片段失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateMoment = async (id: string, request: UpdateMomentRequest) => {
    loading.value = true
    try {
      await SupabaseMomentService.update(id, request)
      // 更新本地状态
      const index = moments.value.findIndex(moment => moment.id === id)
      if (index !== -1) {
        const updatedMoment = await SupabaseMomentService.getById(id)
        if (updatedMoment) {
          moments.value.splice(index, 1, updatedMoment)
        }
      }
      return true
    } catch (error) {
      console.error('更新生活片段失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const deleteMoment = async (id: string) => {
    loading.value = true
    try {
      await SupabaseMomentService.delete(id)
      // 更新本地状态
      moments.value = moments.value.filter(moment => moment.id !== id)
      return true
    } catch (error) {
      console.error('删除生活片段失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const deleteImage = async (momentId: string, imageIndex: number) => {
    loading.value = true
    try {
      await SupabaseMomentService.deleteImage(momentId, imageIndex)
      // 更新本地状态
      const index = moments.value.findIndex(moment => moment.id === momentId)
      if (index !== -1) {
        const updatedMoment = await SupabaseMomentService.getById(momentId)
        if (updatedMoment) {
          moments.value.splice(index, 1, updatedMoment)  // 这里也改成splice
        }
      }
      return true
    } catch (error) {
      console.error('删除图片失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const setFilter = (filter: 'all' | 'recent' | 'tagged') => {
    currentFilter.value = filter
    if (filter === 'all') {
      selectedTags.value = []
      dateRange.value = null
      fetchMoments()
    } else if (filter === 'recent') {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const today = new Date()
      
      const start = thirtyDaysAgo.toISOString().split('T')[0]
      const end = today.toISOString().split('T')[0]
      
      fetchMomentsByDateRange(start, end)
    }
  }

  const clearFilters = () => {
    currentFilter.value = 'all'
    selectedTags.value = []
    dateRange.value = null
    fetchMoments()
  }

  return {
    // 状态
    moments,
    loading,
    currentFilter,
    selectedTags,
    dateRange,
    
    // 计算属性
    filteredMoments,
    totalCount,
    recentMoments,
    allTags,
    
    // 方法
    fetchMoments,
    fetchMomentsByDateRange,
    fetchMomentsByTags,
    createMoment,
    updateMoment,
    deleteMoment,
    deleteImage,
    setFilter,
    clearFilters,
  }
})