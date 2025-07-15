/**
 * 用户Profile服务
 */
import { supabase, TABLES, type SupabaseProfile } from '../lib/supabase'
import { CloudflareR2Service } from './cloudflare-r2'

/**
 * 用户Profile类型
 */
export interface Profile {
  id: string
  email: string
  username?: string
  avatar_url?: string
  follower_count?: number
  following_count?: number
  created_at: string
  updated_at: string
}

/**
 * 更新Profile请求
 */
export interface UpdateProfileRequest {
  username?: string
  avatar?: File
}

/**
 * 用户Profile服务类
 */
export class SupabaseProfileService {
  /**
   * 获取当前用户的Profile
   */
  static async getCurrentProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('用户未登录')
    }
    
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null // 未找到记录
      }
      throw new Error(`获取用户Profile失败: ${error.message}`)
    }
    
    return data ? this.transformFromSupabase(data) : null
  }
  
  /**
   * 更新用户Profile
   */
  static async updateProfile(request: UpdateProfileRequest): Promise<Profile> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('用户未登录')
    }
    
    const updateData: Partial<SupabaseProfile> = {}
    
    // 更新用户名
    if (request.username !== undefined) {
      updateData.username = request.username
    }
    
    // 上传头像
    if (request.avatar) {
      const timestamp = new Date().getTime().toString()
      const { url } = await CloudflareR2Service.uploadImage(request.avatar, timestamp)
      updateData.avatar_url = url
    }
    
    // 更新数据库
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()
    
    if (error) {
      throw new Error(`更新用户Profile失败: ${error.message}`)
    }
    
    return this.transformFromSupabase(data)
  }
  
  /**
   * 转换Supabase数据格式到应用数据格式
   */
  private static transformFromSupabase(data: SupabaseProfile): Profile {
    return {
      id: data.id,
      email: data.email,
      username: data.username,
      avatar_url: data.avatar_url,
      follower_count: data.follower_count || 0,
      following_count: data.following_count || 0,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  }
}