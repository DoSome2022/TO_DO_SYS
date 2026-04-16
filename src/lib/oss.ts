// server/lib/oss.ts
import OSS from 'ali-oss';

// 初始化 OSS Client
export const ossClient = new OSS({
  region: process.env.ALI_OSS_REGION!, // 例如: 'oss-cn-hangzhou'
  accessKeyId: process.env.ALI_OSS_ACCESS_KEY_ID!,
  accessKeySecret: process.env.ALI_OSS_ACCESS_KEY_SECRET!,
  bucket: process.env.ALI_OSS_BUCKET!,
});
