import { getSystemConfig } from './db';
import type { GeminiGenerateRequest, GenerateResult } from '@/types';

// ========================================
// Gemini API 封装
// ========================================

// 获取成本
function getCost(
  model: string,
  pricing: { geminiNano: number; geminiPro: number }
): number {
  if (model.includes('pro')) {
    return pricing.geminiPro;
  }
  return pricing.geminiNano;
}

// 生成图像
export async function generateWithGemini(
  request: GeminiGenerateRequest
): Promise<GenerateResult> {
  const config = await getSystemConfig();

  if (!config.geminiApiKey) {
    throw new Error('Gemini API Key 未配置');
  }

  const baseUrl = config.geminiBaseUrl.replace(/\/$/, '');
  const apiUrl = `${baseUrl}/v1beta/models/${request.model}:generateContent?key=${config.geminiApiKey}`;

  // 构建请求内容
  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

  // 放入参考图
  if (request.images && request.images.length > 0) {
    request.images.forEach((img) => {
      parts.push({
        inlineData: {
          mimeType: img.mimeType || 'image/jpeg',
          data: img.data,
        },
      });
    });
  }

  // 放入提示词
  if (request.prompt) {
    parts.push({ text: request.prompt });
  }

  // 构建生成配置
  const generationConfig: {
    imageConfig: { aspectRatio: string; imageSize?: string };
  } = {
    imageConfig: {
      aspectRatio: request.aspectRatio || '1:1',
    },
  };

  // Pro 模型支持 imageSize
  if (request.model === 'gemini-3-pro-image-preview' && request.imageSize) {
    generationConfig.imageConfig.imageSize = request.imageSize;
  }

  const payload = {
    contents: [{ parts }],
    generationConfig,
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errJson = JSON.parse(errorText);
      throw new Error(errJson.error?.message || errorText);
    } catch (e) {
      if (e instanceof Error && e.message !== errorText) {
        throw e;
      }
      throw new Error(`Gemini API 错误 (${response.status}): ${errorText}`);
    }
  }

  const data = await response.json();

  // 提取生成的图片
  const generatedImages: string[] = [];

  if (
    data.candidates &&
    data.candidates[0]?.content?.parts
  ) {
    for (const part of data.candidates[0].content.parts) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        generatedImages.push(`data:${mime};base64,${part.inlineData.data}`);
      }
    }
  }

  if (generatedImages.length === 0) {
    const textPart = data.candidates?.[0]?.content?.parts?.find(
      (p: { text?: string }) => p.text
    );
    if (textPart?.text) {
      throw new Error(`生成失败: ${textPart.text}`);
    }
    throw new Error('API 返回成功但未包含图片数据');
  }

  const cost = getCost(request.model, config.pricing);

  return {
    type: 'gemini-image',
    url: generatedImages[0], // 返回第一张图
    cost,
  };
}
