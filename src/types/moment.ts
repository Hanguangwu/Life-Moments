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
  like_count: number;
  comment_count: number;
  repost_count: number;
  created_at: string;
  updated_at: string;
  user_id?: string;
  user?: {
    id: string
    username?: string
    avatar_url?: string
  }
  liked?: boolean;
  reposted?: boolean;
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
  like_count?: number;
  comment_count?: number;
  repost_count?: number;
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