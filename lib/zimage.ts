import { getSystemConfig } from './db';
import type { ZImageGenerateRequest, GenerateResult } from '@/types';

// ========================================
// Z-Image API 封装 (ModelScope & Gitee)
// ========================================

// ModelScope API 响应（同步返回图片URL）
interface ModelScopeImageResponse {
  images: Array<{
    url: string;
  }>;
  request_id: string;
}

// Gitee API 响应（同步返回base64）
interface GiteeImageResponse {
  data: Array<{
    b64_json: string;
    type: string;
  }>;
  created: number;
}

// Key 轮询索引
let giteeKeyIndex = 0;

// 获取下一个 Gitee API Key
function getNextGiteeApiKey(keys: string): string {
  const keyList = keys.split(',').map(k => k.trim()).filter(k => k);
  if (keyList.length === 0) {
    throw new Error('Gitee API Key 未配置');
  }
  const key = keyList[giteeKeyIndex % keyList.length];
  giteeKeyIndex++;
  return key;
}

// 下载图片并转换为 base64
async function downloadImageAsBase64(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  
  if (!response.ok) {
    throw new Error(`下载图片失败 (${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');
  
  // 获取 content-type
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  
  return `data:${contentType};base64,${base64}`;
}

// ========================================
// Gitee 渠道生成（同步返回）
// ========================================

async function generateWithGitee(
  request: ZImageGenerateRequest,
  config: Awaited<ReturnType<typeof getSystemConfig>>
): Promise<GenerateResult> {
  const apiKeys = config.giteeApiKey || process.env.GITEE_API_KEY || '';
  if (!apiKeys) {
    throw new Error('Gitee API Key 未配置，请在管理后台配置 API 密钥');
  }

  const apiKey = getNextGiteeApiKey(apiKeys);
  const baseUrl = (config.giteeBaseUrl || process.env.GITEE_BASE_URL || 'https://ai.gitee.com/').replace(/\/$/, '') + '/';

  const url = `${baseUrl}v1/images/generations`;
  
  const payload = {
    prompt: request.prompt,
    model: request.model || 'z-image-turbo',
    ...(request.size && { size: request.size }),
    ...(request.numInferenceSteps && { num_inference_steps: request.numInferenceSteps }),
  };

  console.log('[Gitee] 开始生成:', { model: payload.model, size: request.size });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errMsg = errorText;
    try {
      const errJson = JSON.parse(errorText);
      errMsg = errJson.error?.message || errJson.message || errorText;
    } catch {
      // ignore
    }
    throw new Error(`Gitee API 错误 (${response.status}): ${errMsg}`);
  }

  const data: GiteeImageResponse = await response.json();
  
  if (!data.data || data.data.length === 0 || !data.data[0].b64_json) {
    throw new Error('Gitee API 返回成功但未包含图片数据');
  }

  const imageData = data.data[0];
  const mimeType = imageData.type || 'image/png';
  const base64Image = `data:${mimeType};base64,${imageData.b64_json}`;
  const cost = config.pricing?.giteeImage || 30;
  
  console.log('[Gitee] 生成完成:', { cost });

  return {
    type: 'gitee-image',
    url: base64Image,
    cost,
  };
}

// ========================================
// ModelScope 渠道生成（同步返回图片URL）
// ========================================

async function generateWithModelScope(
  request: ZImageGenerateRequest,
  config: Awaited<ReturnType<typeof getSystemConfig>>
): Promise<GenerateResult> {
  const apiKey = config.zimageApiKey || process.env.ZIMAGE_API_KEY;
  if (!apiKey) {
    throw new Error('Z-Image API Key 未配置，请在管理后台配置 API 密钥');
  }

  const baseUrl = (config.zimageBaseUrl || process.env.ZIMAGE_BASE_URL || 'https://api-inference.modelscope.cn/').replace(/\/$/, '') + '/';

  console.log('[ModelScope] 开始生成:', { model: request.model, size: request.size });

  const url = `${baseUrl}v1/images/generations`;
  
  const payload = {
    model: request.model || 'Tongyi-MAI/Z-Image-Turbo',
    prompt: request.prompt,
    ...(request.size && { size: request.size }),
    ...(request.loras && { loras: request.loras }),
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errMsg = errorText;
    try {
      const errJson = JSON.parse(errorText);
      errMsg = errJson.error?.message || errJson.message || errorText;
    } catch {
      // ignore
    }
    throw new Error(`ModelScope API 错误 (${response.status}): ${errMsg}`);
  }

  const data: ModelScopeImageResponse = await response.json();
  
  if (!data.images || data.images.length === 0 || !data.images[0].url) {
    throw new Error('ModelScope API 返回成功但未包含图片');
  }

  const imageUrl = data.images[0].url;
  
  // 下载图片并转换为 base64
  const base64Image = await downloadImageAsBase64(imageUrl);
  const cost = config.pricing?.zimageImage || 30;
  
  console.log('[ModelScope] 生成完成:', { cost });

  return {
    type: 'zimage-image',
    url: base64Image,
    cost,
  };
}

// ========================================
// 统一入口
// ========================================

export async function generateWithZImage(
  request: ZImageGenerateRequest
): Promise<GenerateResult> {
  const config = await getSystemConfig();
  const channel = request.channel || 'modelscope';

  if (channel === 'gitee') {
    return generateWithGitee(request, config);
  } else {
    return generateWithModelScope(request, config);
  }
}
