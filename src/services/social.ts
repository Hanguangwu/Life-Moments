/**
 * 社交功能服务
 */
import { supabase, TABLES, type SupabaseLike, type SupabaseComment, type SupabaseRepost, type SupabaseFollow } from '../lib/supabase'

/**
 * 点赞类型
 */
export interface Like {
  id: string
  user_id: string
  moment_id: string
  created_at: string
}

/**
 * 评论类型
 */
export interface Comment {
  id: string
  user_id: string
  moment_id: string
  content: string
  created_at: string
  updated_at: string
  user?: {
    id: string
    username?: string
    avatar_url?: string
  }
}

/**
 * 创建评论请求
 */
export interface CreateCommentRequest {
  moment_id: string
  content: string
}

/**
 * 转发类型
 */
export interface Repost {
  id: string
  user_id: string
  moment_id: string
  content: string | null
  created_at: string
  updated_at: string
  user?: {
    id: string
    username?: string
    avatar_url?: string
  }
}

/**
 * 创建转发请求
 */
export interface CreateRepostRequest {
  moment_id: string
  content?: string
}

/**
 * 关注类型
 */
export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

/**
 * 社交功能服务类
 */
export class SupabaseSocialService {
  /**
   * 点赞生活片段
   */
  static async likeMoment(momentId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('用户未登录')
    }
    
    // 检查是否已点赞
    const { data: existingLike } = await supabase
      .from(TABLES.LIKES)
      .select('id')
      .eq('user_id', user.id)
      .eq('moment_id', momentId)
      .maybeSingle()
    
    if (existingLike) {
      throw new Error('已经点赞过该生活片段')
    }
    
    // 创建点赞记录
    const { error } = await supabase
      .from(TABLES.LIKES)
      .insert({
        user_id: user.id,
        moment_id: momentId
      })
    
    if (error) {
      throw new Error(`点赞失败: ${error.message}`)
    }
    
    // 更新点赞计数
    await supabase.rpc('increment_like_count', { moment_id: momentId })
  }
  
  /**
   * 取消点赞生活片段
   */
  static async unlikeMoment(momentId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('用户未登录')
    }
    
    // 删除点赞记录
    const { error } = await supabase
      .from(TABLES.LIKES)
      .delete()
      .eq('user_id', user.id)
      .eq('moment_id', momentId)
    
    if (error) {
      throw new Error(`取消点赞失败: ${error.message}`)
    }
    
    // 更新点赞计数
    await supabase.rpc('decrement_like_count', { moment_id: momentId })
  }
  
  /**
   * 检查用户是否已点赞生活片段
   */
  static async hasLiked(momentId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return false
    }
    
    const { data } = await supabase
      .from(TABLES.LIKES)
      .select('id')
      .eq('user_id', user.id)
      .eq('moment_id', momentId)
      .maybeSingle()
    
    return !!data
  }
  
  /**
   * 获取生活片段的点赞列表
   */
  static async getMomentLikes(momentId: string): Promise<Like[]> {
    const { data, error } = await supabase
      .from(TABLES.LIKES)
      .select('*')
      .eq('moment_id', momentId)
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(`获取点赞列表失败: ${error.message}`)
    }
    
    return data.map(this.transformLikeFromSupabase)
  }
  
  /**
   * 创建评论
   */
  static async createComment(request: CreateCommentRequest): Promise<Comment> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('用户未登录')
    }
    
    // 创建评论记录
    const { data, error } = await supabase
      .from(TABLES.COMMENTS)
      .insert({
        user_id: user.id,
        moment_id: request.moment_id,
        content: request.content
      })
      .select()
      .single()
    
    if (error) {
      throw new Error(`创建评论失败: ${error.message}`)
    }
    
    // 更新评论计数
    await supabase.rpc('increment_comment_count', { moment_id: request.moment_id })
    
    return this.transformCommentFromSupabase(data)
  }
  
  /**
   * 删除评论
   */
  static async deleteComment(commentId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('用户未登录')
    }
    
    // 获取评论信息
    const { data: comment } = await supabase
      .from(TABLES.COMMENTS)
      .select('moment_id')
      .eq('id', commentId)
      .single()
    
    if (!comment) {
      throw new Error('评论不存在')
    }
    
    // 删除评论记录
    const { error } = await supabase
      .from(TABLES.COMMENTS)
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id)
    
    if (error) {
      throw new Error(`删除评论失败: ${error.message}`)
    }
    
    // 更新评论计数
    await supabase.rpc('decrement_comment_count', { moment_id: comment.moment_id })
  }
  
  /**
   * 获取生活片段的评论列表
   */
  static async getMomentComments(momentId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from(TABLES.COMMENTS)
      .select(`
        *,
        profiles:user_id (id, username, avatar_url)
      `)
      .eq('moment_id', momentId)
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(`获取评论列表失败: ${error.message}`)
    }
    
    return data.map(this.transformCommentFromSupabase)
  }
  
  /**
   * 创建转发
   */
  static async createRepost(request: CreateRepostRequest): Promise<Repost> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('用户未登录')
    }
    
    // 检查是否已转发
    const { data: existingRepost } = await supabase
      .from(TABLES.REPOSTS)
      .select('id')
      .eq('user_id', user.id)
      .eq('moment_id', request.moment_id)
      .maybeSingle()
    
    if (existingRepost) {
      throw new Error('已经转发过该生活片段')
    }
    
    // 创建转发记录
    const { data, error } = await supabase
      .from(TABLES.REPOSTS)
      .insert({
        user_id: user.id,
        moment_id: request.moment_id,
        content: request.content || null
      })
      .select()
      .single()
    
    if (error) {
      throw new Error(`创建转发失败: ${error.message}`)
    }
    
    // 更新转发计数
    await supabase.rpc('increment_repost_count', { moment_id: request.moment_id })
    
    return this.transformRepostFromSupabase(data)
  }
  
  /**
   * 删除转发
   */
  static async deleteRepost(repostId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('用户未登录')
    }
    
    // 获取转发信息
    const { data: repost } = await supabase
      .from(TABLES.REPOSTS)
      .select('moment_id')
      .eq('id', repostId)
      .single()
    
    if (!repost) {
      throw new Error('转发不存在')
    }
    
    // 删除转发记录
    const { error } = await supabase
      .from(TABLES.REPOSTS)
      .delete()
      .eq('id', repostId)
      .eq('user_id', user.id)
    
    if (error) {
      throw new Error(`删除转发失败: ${error.message}`)
    }
    
    // 更新转发计数
    await supabase.rpc('decrement_repost_count', { moment_id: repost.moment_id })
  }
  
  /**
   * 检查用户是否已转发生活片段
   */
  static async hasReposted(momentId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return false
    }
    
    const { data } = await supabase
      .from(TABLES.REPOSTS)
      .select('id')
      .eq('user_id', user.id)
      .eq('moment_id', momentId)
      .maybeSingle()
    
    return !!data
  }
  
  /**
   * 获取生活片段的转发列表
   */
  static async getMomentReposts(momentId: string): Promise<Repost[]> {
    const { data, error } = await supabase
      .from(TABLES.REPOSTS)
      .select(`
        *,
        profiles:user_id (id, username, avatar_url)
      `)
      .eq('moment_id', momentId)
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(`获取转发列表失败: ${error.message}`)
    }
    
    return data.map(this.transformRepostFromSupabase)
  }
  
  /**
   * 关注用户
   */
  static async followUser(userId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('用户未登录')
    }
    
    if (user.id === userId) {
      throw new Error('不能关注自己')
    }
    
    // 检查是否已关注
    const { data: existingFollow } = await supabase
      .from(TABLES.FOLLOWS)
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .maybeSingle()
    
    if (existingFollow) {
      throw new Error('已经关注过该用户')
    }
    
    // 创建关注记录
    const { error } = await supabase
      .from(TABLES.FOLLOWS)
      .insert({
        follower_id: user.id,
        following_id: userId
      })
    
    if (error) {
      throw new Error(`关注用户失败: ${error.message}`)
    }
    
    // 更新关注计数
    await supabase.rpc('increment_follower_count', { user_id: userId })
    await supabase.rpc('increment_following_count', { user_id: user.id })
  }
  
  /**
   * 取消关注用户
   */
  static async unfollowUser(userId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('用户未登录')
    }
    
    // 删除关注记录
    const { error } = await supabase
      .from(TABLES.FOLLOWS)
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', userId)
    
    if (error) {
      throw new Error(`取消关注失败: ${error.message}`)
    }
    
    // 更新关注计数
    await supabase.rpc('decrement_follower_count', { user_id: userId })
    await supabase.rpc('decrement_following_count', { user_id: user.id })
  }
  
  /**
   * 检查用户是否已关注另一用户
   */
  static async hasFollowed(userId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return false
    }
    
    const { data } = await supabase
      .from(TABLES.FOLLOWS)
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .maybeSingle()
    
    return !!data
  }
  
  /**
   * 获取用户的关注列表
   */
  static async getFollowings(userId: string): Promise<Follow[]> {
    const { data, error } = await supabase
      .from(TABLES.FOLLOWS)
      .select('*')
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(`获取关注列表失败: ${error.message}`)
    }
    
    return data.map(this.transformFollowFromSupabase)
  }
  
  /**
   * 获取用户的粉丝列表
   */
  static async getFollowers(userId: string): Promise<Follow[]> {
    const { data, error } = await supabase
      .from(TABLES.FOLLOWS)
      .select('*')
      .eq('following_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(`获取粉丝列表失败: ${error.message}`)
    }
    
    return data.map(this.transformFollowFromSupabase)
  }
  
  /**
   * 获取推荐用户列表（基于物品的协同过滤算法）
   * 推荐逻辑：找出与当前用户有共同关注的用户，推荐他们关注的其他用户
   */
  static async getRecommendedUsers(limit: number = 5): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('用户未登录')
    }
    
    // 获取当前用户的关注列表
    const { data: followings } = await supabase
      .from(TABLES.FOLLOWS)
      .select('following_id')
      .eq('follower_id', user.id)
    
    if (!followings || followings.length === 0) {
      // 如果用户没有关注任何人，返回最近注册的用户
      const { data: recentUsers, error } = await supabase
        .from(TABLES.PROFILES)
        .select('id, username, avatar_url, follower_count, following_count')
        .neq('id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) {
        throw new Error(`获取推荐用户失败: ${error.message}`)
      }
      
      return recentUsers
    }
    
    // 用户已关注的ID列表
    const followingIds = followings.map(f => f.following_id)
    
    // 查找与当前用户有共同关注的用户
    const { data: similarUsers } = await supabase
      .from(TABLES.FOLLOWS)
      .select('follower_id')
      .in('following_id', followingIds)
      .neq('follower_id', user.id)
    
    if (!similarUsers || similarUsers.length === 0) {
      // 如果没有相似用户，返回最近活跃的用户
      const { data: activeUsers, error } = await supabase
        .from(TABLES.PROFILES)
        .select('id, username, avatar_url, follower_count, following_count')
        .neq('id', user.id)
        .not('id', 'in', `(${followingIds.map(id => `'${id}'`).join(',')})`)
        .order('updated_at', { ascending: false })
        .limit(limit)
      
      if (error) {
        throw new Error(`获取推荐用户失败: ${error.message}`)
      }
      
      return activeUsers
    }
    
    // 获取相似用户关注的、但当前用户未关注的用户
    const similarUserIds = [...new Set(similarUsers.map(u => u.follower_id))]
    
    const { data: recommendedUsers, error } = await supabase
      .from(TABLES.FOLLOWS)
      .select(`
        following_id,
        profiles:following_id (id, username, avatar_url, follower_count, following_count)
      `)
      .in('follower_id', similarUserIds)
      .not('following_id', 'in', `(${[...followingIds, user.id].map(id => `'${id}'`).join(',')})`)
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(`获取推荐用户失败: ${error.message}`)
    }
    
    // 统计被推荐次数，作为推荐权重
    const userCounts: Record<string, number> = {}
    recommendedUsers.forEach(item => {
      const userId = item.following_id
      userCounts[userId] = (userCounts[userId] || 0) + 1
    })
    
    // 去重并按推荐权重排序
    const uniqueUsers = [...new Map(recommendedUsers.map(item => [
      item.following_id,
      {
        ...item.profiles,
        weight: userCounts[item.following_id]
      }
    ])).values()]
    
    // 按权重排序并限制数量
    return uniqueUsers
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit)
  }
  
  /**
   * 获取关注用户的生活片段
   */
  static async getFollowingMoments(): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('用户未登录')
    }
    
    // 获取当前用户的关注列表
    const { data: followings } = await supabase
      .from(TABLES.FOLLOWS)
      .select('following_id')
      .eq('follower_id', user.id)
    
    if (!followings || followings.length === 0) {
      return []
    }
    
    // 用户已关注的ID列表
    const followingIds = followings.map(f => f.following_id)
    
    // 获取关注用户的生活片段
    const { data, error } = await supabase
      .from(TABLES.MOMENTS)
      .select(`
        *,
        profiles:user_id (id, username, avatar_url)
      `)
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(`获取关注用户生活片段失败: ${error.message}`)
    }
    
    // 检查当前用户是否已点赞和转发这些生活片段
    const moments = await Promise.all(data.map(async (moment) => {
      const liked = await this.hasLiked(moment.id)
      const reposted = await this.hasReposted(moment.id)
      
      return {
        ...moment,
        user: moment.profiles,
        liked,
        reposted
      }
    }))
    
    return moments
  }
  
  /**
   * 转换Supabase点赞数据格式到应用数据格式
   */
  private static transformLikeFromSupabase(data: SupabaseLike): Like {
    return {
      id: data.id,
      user_id: data.user_id,
      moment_id: data.moment_id,
      created_at: data.created_at
    }
  }
  
  /**
   * 转换Supabase评论数据格式到应用数据格式
   */
  private static transformCommentFromSupabase(data: any): Comment {
    return {
      id: data.id,
      user_id: data.user_id,
      moment_id: data.moment_id,
      content: data.content,
      created_at: data.created_at,
      updated_at: data.updated_at,
      user: data.profiles ? {
        id: data.profiles.id,
        username: data.profiles.username,
        avatar_url: data.profiles.avatar_url
      } : undefined
    }
  }
  
  /**
   * 转换Supabase转发数据格式到应用数据格式
   */
  private static transformRepostFromSupabase(data: any): Repost {
    return {
      id: data.id,
      user_id: data.user_id,
      moment_id: data.moment_id,
      content: data.content,
      created_at: data.created_at,
      updated_at: data.updated_at,
      user: data.profiles ? {
        id: data.profiles.id,
        username: data.profiles.username,
        avatar_url: data.profiles.avatar_url
      } : undefined
    }
  }
  
  /**
   * 转换Supabase关注数据格式到应用数据格式
   */
  private static transformFollowFromSupabase(data: SupabaseFollow): Follow {
    return {
      id: data.id,
      follower_id: data.follower_id,
      following_id: data.following_id,
      created_at: data.created_at
    }
  }
}