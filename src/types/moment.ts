/**
 * 生活片段相关类型定义
 */

/**
 * 生活片段接口定义
 */
export interface Moment {
  id?: string;
  title: string;
  content: string;
  date: string;
  images: string[]; // 图片URL数组
  image_timestamps: string[]; // 图片时间戳数组，用于删除时定位R2中的文件
  tags: string[];
  created_at: string;
  updated_at: string;
}

/**
 * 创建生活片段请求接口
 */
export interface CreateMomentRequest {
  title: string;
  content: string;
  date: string;
  images?: File[]; // 上传的图片文件
  tags?: string[];
}

/**
 * 更新生活片段请求接口
 */
export interface UpdateMomentRequest {
  title?: string;
  content?: string;
  date?: string;
  images?: File[]; // 新上传的图片文件
  tags?: string[];
}