/**
 * 社交功能Store
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { SupabaseSocialService, type Comment, type Repost } from '../services/social'

export const useSocialStore = defineStore('social', () => {
  // 状态
  const followingMoments = ref<any[]>([])
  const loadingFollowingMoments = ref(false)
  const recommendedUsers = ref<any[]>([])
  const loadingRecommendedUsers = ref(false)
  const comments = ref<Comment[]>([])
  const loadingComments = ref(false)
  const reposts = ref<Repost[]>([])
  const loadingReposts = ref(false)
  
  // 计算属性
  const hasFollowingMoments = computed(() => followingMoments.value.length > 0)
  
  // 获取关注用户的生活片段
  async function fetchFollowingMoments(forceRefresh = false) {
    if (loadingFollowingMoments.value) return
    
    // 如果已有数据且不强制刷新，则直接返回
    if (!forceRefresh && followingMoments.value.length > 0) {
      return
    }
    
    loadingFollowingMoments.value = true
    
    try {
      const moments = await SupabaseSocialService.getFollowingMoments()
      followingMoments.value = moments
    } catch (error) {
      console.error('获取关注用户生活片段失败:', error)
    } finally {
      loadingFollowingMoments.value = false
    }
  }
  
  // 获取推荐用户
  async function fetchRecommendedUsers(limit = 5) {
    if (loadingRecommendedUsers.value) return
    
    loadingRecommendedUsers.value = true
    
    try {
      const users = await SupabaseSocialService.getRecommendedUsers(limit)
      recommendedUsers.value = users
    } catch (error) {
      console.error('获取推荐用户失败:', error)
    } finally {
      loadingRecommendedUsers.value = false
    }
  }
  
  // 检查是否已点赞生活片段
  async function hasLiked(momentId: string) {
    try {
      return await SupabaseSocialService.hasLiked(momentId)
    } catch (error) {
      console.error('检查点赞状态失败:', error)
      return false
    }
  }
  
  // 检查是否已转发生活片段
  async function hasReposted(momentId: string) {
    try {
      return await SupabaseSocialService.hasReposted(momentId)
    } catch (error) {
      console.error('检查转发状态失败:', error)
      return false
    }
  }
  
  // 点赞生活片段
  async function likeMoment(momentId: string) {
    try {
      await SupabaseSocialService.likeMoment(momentId)
      
      // 更新状态
      updateMomentLikeStatus(momentId, true)
      
      return true
    } catch (error) {
      console.error('点赞失败:', error)
      return false
    }
  }
  
  // 取消点赞
  async function unlikeMoment(momentId: string) {
    try {
      await SupabaseSocialService.unlikeMoment(momentId)
      
      // 更新状态
      updateMomentLikeStatus(momentId, false)
      
      return true
    } catch (error) {
      console.error('取消点赞失败:', error)
      return false
    }
  }
  
  // 更新生活片段点赞状态
  function updateMomentLikeStatus(momentId: string, liked: boolean) {
    // 更新关注用户的生活片段列表中的点赞状态
    const moment = followingMoments.value.find(m => m.id === momentId)
    if (moment) {
      moment.liked = liked
      moment.like_count = liked ? (moment.like_count || 0) + 1 : Math.max(0, (moment.like_count || 0) - 1)
    }
  }
  
  // 获取评论列表
  async function fetchComments(momentId: string) {
    if (loadingComments.value) return
    
    loadingComments.value = true
    
    try {
      const result = await SupabaseSocialService.getMomentComments(momentId)
      comments.value = result
      return result
    } catch (error) {
      console.error('获取评论失败:', error)
      return []
    } finally {
      loadingComments.value = false
    }
  }
  
  // 创建评论
  async function createComment(momentId: string, content: string) {
    try {
      const comment = await SupabaseSocialService.createComment({
        moment_id: momentId,
        content
      })
      
      // 更新评论列表
      comments.value = [comment, ...comments.value]
      
      // 更新生活片段评论计数
      updateMomentCommentCount(momentId, true)
      
      return comment
    } catch (error) {
      console.error('创建评论失败:', error)
      return null
    }
  }
  
  // 删除评论
  async function deleteComment(commentId: string, momentId: string) {
    try {
      await SupabaseSocialService.deleteComment(commentId)
      
      // 更新评论列表
      comments.value = comments.value.filter(c => c.id !== commentId)
      
      // 更新生活片段评论计数
      updateMomentCommentCount(momentId, false)
      
      return true
    } catch (error) {
      console.error('删除评论失败:', error)
      return false
    }
  }
  
  // 更新生活片段评论计数
  function updateMomentCommentCount(momentId: string, increment: boolean) {
    // 更新关注用户的生活片段列表中的评论计数
    const moment = followingMoments.value.find(m => m.id === momentId)
    if (moment) {
      moment.comment_count = increment ? (moment.comment_count || 0) + 1 : Math.max(0, (moment.comment_count || 0) - 1)
    }
  }
  
  // 获取转发列表
  async function fetchReposts(momentId: string) {
    if (loadingReposts.value) return
    
    loadingReposts.value = true
    
    try {
      const result = await SupabaseSocialService.getMomentReposts(momentId)
      reposts.value = result
      return result
    } catch (error) {
      console.error('获取转发失败:', error)
      return []
    } finally {
      loadingReposts.value = false
    }
  }
  
  // 创建转发
  async function createRepost(momentId: string, content?: string) {
    try {
      const repost = await SupabaseSocialService.createRepost({
        moment_id: momentId,
        content
      })
      
      // 更新转发列表
      reposts.value = [repost, ...reposts.value]
      
      // 更新生活片段转发状态和计数
      updateMomentRepostStatus(momentId, true)
      
      return repost
    } catch (error) {
      console.error('创建转发失败:', error)
      return null
    }
  }
  
  // 删除转发
  async function deleteRepost(repostId: string, momentId: string) {
    try {
      await SupabaseSocialService.deleteRepost(repostId)
      
      // 更新转发列表
      reposts.value = reposts.value.filter(r => r.id !== repostId)
      
      // 更新生活片段转发状态和计数
      updateMomentRepostStatus(momentId, false)
      
      return true
    } catch (error) {
      console.error('删除转发失败:', error)
      return false
    }
  }
  
  // 更新生活片段转发状态和计数
  function updateMomentRepostStatus(momentId: string, reposted: boolean) {
    // 更新关注用户的生活片段列表中的转发状态和计数
    const moment = followingMoments.value.find(m => m.id === momentId)
    if (moment) {
      moment.reposted = reposted
      moment.repost_count = reposted ? (moment.repost_count || 0) + 1 : Math.max(0, (moment.repost_count || 0) - 1)
    }
  }
  
  // 关注用户
  async function followUser(userId: string) {
    try {
      await SupabaseSocialService.followUser(userId)
      
      // 更新推荐用户列表
      const userIndex = recommendedUsers.value.findIndex(u => u.id === userId)
      if (userIndex !== -1) {
        recommendedUsers.value.splice(userIndex, 1)
      }
      
      // 刷新关注用户的生活片段
      await fetchFollowingMoments(true)
      
      return true
    } catch (error) {
      console.error('关注用户失败:', error)
      return false
    }
  }
  
  // 取消关注用户
  async function unfollowUser(userId: string) {
    try {
      await SupabaseSocialService.unfollowUser(userId)
      
      // 从关注用户的生活片段列表中移除该用户的生活片段
      followingMoments.value = followingMoments.value.filter(m => m.user?.id !== userId)
      
      return true
    } catch (error) {
      console.error('取消关注用户失败:', error)
      return false
    }
  }
  
  // 检查是否已关注用户
  async function checkFollowStatus(userId: string) {
    try {
      return await SupabaseSocialService.hasFollowed(userId)
    } catch (error) {
      console.error('检查关注状态失败:', error)
      return false
    }
  }
  
  return {
    // 状态
    followingMoments,
    loadingFollowingMoments,
    recommendedUsers,
    loadingRecommendedUsers,
    comments,
    loadingComments,
    reposts,
    loadingReposts,
    
    // 计算属性
    hasFollowingMoments,
    
    // 方法
    fetchFollowingMoments,
    fetchRecommendedUsers,
    likeMoment,
    unlikeMoment,
    hasLiked,
    hasReposted,
    fetchComments,
    createComment,
    deleteComment,
    fetchReposts,
    createRepost,
    deleteRepost,
    followUser,
    unfollowUser,
    checkFollowStatus
  }
})