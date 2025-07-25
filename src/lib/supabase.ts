/**
 * Supabase客户端配置
 */
import { createClient } from '@supabase/supabase-js'

// 从环境变量获取Supabase配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Supabase客户端实例
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * 数据库表名常量
 */
export const TABLES = {
  TODOS: 'todos',
  IDEAS: 'ideas',
  PROFILES: 'profiles',
  ACHIEVEMENTS: 'achievements',
  MOMENTS: 'moments',
  LIKES: 'likes',
  COMMENTS: 'comments',
  REPOSTS: 'reposts',
  FOLLOWS: 'follows'
} as const

/**
 * Supabase数据类型定义
 */
export interface SupabaseTodo {
  id: string
  user_id: string
  title: string
  description: string | null
  completed: boolean
  priority: number
  due_date: string | null
  created_at: string
  updated_at: string
  tags: string[]
  category: string
}

export interface SupabaseIdea {
  id: string
  user_id: string
  title: string
  content: string
  created_at: string
  updated_at: string
  tags: string[]
  is_favorite: boolean
  category: string
}

export interface SupabaseProfile {
  id: string
  email: string
  username?: string
  avatar_url?: string
  created_at: string
  updated_at: string
  following_count: number
  follower_count: number
}

export interface SupabaseAchievement {
  id: string
  user_id: string
  title: string
  content: string
  date: string
  images: string[]
  image_timestamps: string[]
  tags: string[]
  created_at: string
  updated_at: string
}

export interface SupabaseMoment {
  id: string
  user_id: string
  title: string
  content: string
  date: string
  images: string[]
  image_timestamps: string[]
  tags: string[]
  like_count: number
  comment_count: number
  repost_count: number
  created_at: string
  updated_at: string
}

export interface SupabaseLike {
  id: string
  user_id: string
  moment_id: string
  created_at: string
}

export interface SupabaseComment {
  id: string
  user_id: string
  moment_id: string
  content: string
  created_at: string
  updated_at: string
}

export interface SupabaseRepost {
  id: string
  user_id: string
  moment_id: string
  content: string | null
  created_at: string
  updated_at: string
}

export interface SupabaseFollow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}