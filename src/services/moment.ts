/**
 * 生活片段相关的Supabase服务
 */
import { supabase, TABLES, type SupabaseMoment } from '../lib/supabase'
import type { Moment, CreateMomentRequest, UpdateMomentRequest } from '../types/moment'
import { CloudflareR2Service } from './cloudflare-r2'

export class SupabaseMomentService {
  /**
   * 获取当前用户的所有生活片段
   */
  static async getAll(): Promise<Moment[]> {
    const { data, error } = await supabase
      .from(TABLES.MOMENTS)
      .select('*')
      .order('date', { ascending: false })
    
    if (error) {
      throw new Error(`获取生活片段失败: ${error.message}`)
    }
    
    return data?.map(this.transformFromSupabase) || []
  }
  
  /**
   * 根据ID获取生活片段
   */
  static async getById(id: string): Promise<Moment | null> {
    const { data, error } = await supabase
      .from(TABLES.MOMENTS)
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null // 未找到记录
      }
      throw new Error(`获取生活片段失败: ${error.message}`)
    }
    
    return data ? this.transformFromSupabase(data) : null
  }
  
  /**
   * 创建新的生活片段
   */
  static async create(request: CreateMomentRequest): Promise<Moment> {
    try {
      // 上传图片到R2
      let imageUrls: string[] = []
      let imageTimestamps: string[] = []
      
      if (request.images && request.images.length > 0) {
        const uploadResult = await CloudflareR2Service.uploadImages(request.images)
        imageUrls = uploadResult.urls
        imageTimestamps = uploadResult.timestamps
      }
      
      // 获取当前用户ID
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('用户未登录')
      }

      // 准备数据库数据
      const momentData: Omit<SupabaseMoment, 'id' | 'created_at' | 'updated_at'> = {
        user_id: user.id,
        title: request.title,
        content: request.content,
        date: request.date,
        images: imageUrls,
        image_timestamps: imageTimestamps,
        tags: request.tags || [],
        like_count: request.like_count || 0,
        comment_count: request.comment_count || 0,
        repost_count: request.repost_count || 0,
      }
      
      // 插入数据库
      const { data, error } = await supabase
        .from(TABLES.MOMENTS)
        .insert([momentData])
        .select()
        .single()
      
      if (error) {
        // 如果数据库插入失败，删除已上传的图片
        if (imageTimestamps.length > 0) {
          try {
            await CloudflareR2Service.deleteImages(imageTimestamps)
          } catch (deleteError) {
            console.error('删除上传的图片失败:', deleteError)
          }
        }
        throw new Error(`创建生活片段失败: ${error.message}`)
      }
      
      return this.transformFromSupabase(data)
    } catch (error) {
      console.error('创建生活片段失败:', error)
      throw error
    }
  }
  
  /**
   * 更新生活片段
   */
  static async update(id: string, request: UpdateMomentRequest): Promise<boolean> {
    try {
      // 获取现有记录
      const existingMoment = await this.getById(id)
      if (!existingMoment) {
        throw new Error('生活片段不存在')
      }
      
      // 处理新图片上传
      let newImageUrls: string[] = existingMoment.images
      let newImageTimestamps: string[] = existingMoment.image_timestamps
      
      if (request.images && request.images.length > 0) {
        const uploadResult = await CloudflareR2Service.uploadImages(request.images)
        newImageUrls = [...newImageUrls, ...uploadResult.urls]
        newImageTimestamps = [...newImageTimestamps, ...uploadResult.timestamps]
      }
      
      // 准备更新数据
      const updateData: Partial<SupabaseMoment> = {
        updated_at: new Date().toISOString()
      }
      
      if (request.title !== undefined) updateData.title = request.title
      if (request.content !== undefined) updateData.content = request.content
      if (request.date !== undefined) updateData.date = request.date
      if (request.tags !== undefined) updateData.tags = request.tags
      
      // 更新图片信息
      updateData.images = newImageUrls
      updateData.image_timestamps = newImageTimestamps
      
      // 更新数据库
      const { error } = await supabase
        .from(TABLES.MOMENTS)
        .update(updateData)
        .eq('id', id)
      
      if (error) {
        throw new Error(`更新生活片段失败: ${error.message}`)
      }
      
      return true
    } catch (error) {
      console.error('更新生活片段失败:', error)
      throw error
    }
  }
  
  /**
   * 删除生活片段
   */
  static async delete(id: string): Promise<boolean> {
    try {
      // 获取要删除的记录
      const moment = await this.getById(id)
      if (!moment) {
        throw new Error('生活片段不存在')
      }
      
      // 删除数据库记录
      const { error } = await supabase
        .from(TABLES.MOMENTS)
        .delete()
        .eq('id', id)
      
      if (error) {
        throw new Error(`删除生活片段失败: ${error.message}`)
      }
      
      // 删除R2中的图片
      if (moment.image_timestamps.length > 0) {
        try {
          await CloudflareR2Service.deleteImages(moment.image_timestamps)
        } catch (deleteError) {
          console.error('删除R2图片失败:', deleteError)
          // 不抛出错误，因为数据库记录已经删除
        }
      }
      
      return true
    } catch (error) {
      console.error('删除生活片段失败:', error)
      throw error
    }
  }
  
  /**
   * 删除生活片段中的特定图片
   */
  static async deleteImage(momentId: string, imageIndex: number): Promise<boolean> {
    try {
      const moment = await this.getById(momentId)
      if (!moment) {
        throw new Error('生活片段不存在')
      }
      
      if (imageIndex < 0 || imageIndex >= moment.images.length) {
        throw new Error('图片索引无效')
      }
      
      // 获取要删除的图片时间戳
      const timestampToDelete = moment.image_timestamps[imageIndex]
      
      // 从数组中移除图片
      const newImages = moment.images.filter((_, index) => index !== imageIndex)
      const newTimestamps = moment.image_timestamps.filter((_, index) => index !== imageIndex)
      
      // 更新数据库
      const { error } = await supabase
        .from(TABLES.MOMENTS)
        .update({
          images: newImages,
          image_timestamps: newTimestamps,
          updated_at: new Date().toISOString()
        })
        .eq('id', momentId)
      
      if (error) {
        throw new Error(`删除图片失败: ${error.message}`)
      }
      
      // 删除R2中的图片
      try {
        await CloudflareR2Service.deleteImage(timestampToDelete)
      } catch (deleteError) {
        console.error('删除R2图片失败:', deleteError)
        // 不抛出错误，因为数据库已经更新
      }
      
      return true
    } catch (error) {
      console.error('删除图片失败:', error)
      throw error
    }
  }
  
  /**
   * 根据日期范围获取生活片段
   */
  static async getByDateRange(startDate: string, endDate: string): Promise<Moment[]> {
    const { data, error } = await supabase
      .from(TABLES.MOMENTS)
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
    
    if (error) {
      throw new Error(`获取生活片段失败: ${error.message}`)
    }
    
    return data?.map(this.transformFromSupabase) || []
  }
  
  /**
   * 根据标签搜索生活片段
   */
  static async searchByTags(tags: string[]): Promise<Moment[]> {
    const { data, error } = await supabase
      .from(TABLES.MOMENTS)
      .select('*')
      .overlaps('tags', tags)
      .order('date', { ascending: false })
    
    if (error) {
      throw new Error(`搜索生活片段失败: ${error.message}`)
    }
    
    return data?.map(this.transformFromSupabase) || []
  }
  
  /**
   * 转换Supabase数据格式到应用数据格式
   */
  private static transformFromSupabase(data: SupabaseMoment): Moment {
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      date: data.date,
      images: data.images,
      image_timestamps: data.image_timestamps,
      tags: data.tags,
      created_at: data.created_at,
      updated_at: data.updated_at,
      like_count: data.like_count,
      comment_count: data.comment_count,
      repost_count: data.repost_count,
    }
  }
}