/**
 * 生活片段状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Moment, CreateMomentRequest, UpdateMomentRequest } from '../types/moment'
import { SupabaseMomentService } from '../services/moment'

// 缓存键名
const CACHE_KEY = 'life-moments-data'

export const useMomentStore = defineStore('moment', () => {
  // 从缓存加载初始状态
  const loadCachedData = (): {
    moments: Moment[],
    currentFilter: 'all' | 'recent' | 'tagged',
    selectedTags: string[],
    dateRange: { start: string; end: string } | null
  } => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY)
      if (cachedData) {
        const parsed = JSON.parse(cachedData)
        console.log('从缓存加载数据:', parsed)
        return parsed
      }
    } catch (error) {
      console.error('从缓存加载数据失败:', error)
    }
    return {
      moments: [],
      currentFilter: 'all',
      selectedTags: [],
      dateRange: null
    }
  }
  
  // 初始化状态
  const cachedData = loadCachedData()
  
  // 状态
  const moments = ref<Moment[]>(cachedData.moments)
  const loading = ref(false)
  const currentFilter = ref<'all' | 'recent' | 'tagged'>(cachedData.currentFilter)
  const selectedTags = ref<string[]>(cachedData.selectedTags)
  const dateRange = ref<{ start: string; end: string } | null>(cachedData.dateRange)

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

  // 方法
  const fetchMoments = async (forceRefresh = false) => {
    // 如果已有缓存数据且不强制刷新，直接使用缓存数据
    if (moments.value.length > 0 && !forceRefresh) {
      console.log('使用缓存的生活片段数据:', moments.value.length)
      return
    }
    
    loading.value = true
    try {
      const data = await SupabaseMomentService.getAll()
      moments.value = data
      console.log('从服务器获取生活片段数据:', data.length)
      // 手动更新缓存
      updateCache()
    } catch (error) {
      console.error('获取生活片段失败:', error)
    } finally {
      loading.value = false
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
          moments.value[index] = updatedMoment
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
          moments.value[index] = updatedMoment
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

  // 监听数据变化，更新缓存
  watch(
    [moments, currentFilter, selectedTags, dateRange],
    () => {
      try {
        const dataToCache = {
          moments: moments.value,
          currentFilter: currentFilter.value,
          selectedTags: selectedTags.value,
          dateRange: dateRange.value
        }
        localStorage.setItem(CACHE_KEY, JSON.stringify(dataToCache))
        console.log('数据已缓存')
      } catch (error) {
        console.error('缓存数据失败:', error)
      }
    },
    { deep: true }
  )

  // 更新缓存的方法
  const updateCache = () => {
    try {
      const dataToCache = {
        moments: moments.value,
        currentFilter: currentFilter.value,
        selectedTags: selectedTags.value,
        dateRange: dateRange.value
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(dataToCache))
      console.log('数据已缓存')
    } catch (error) {
      console.error('缓存数据失败:', error)
    }
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
    updateCache
  }
})