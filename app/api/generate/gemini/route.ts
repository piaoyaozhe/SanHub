import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateWithGemini } from '@/lib/gemini';
import { saveGeneration, updateUserBalance, getUserById, updateGeneration, getSystemConfig } from '@/lib/db';
import { saveMediaAsync } from '@/lib/media-storage';
import type { GeminiGenerateRequest } from '@/types';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function fetchImageAsBase64(
  imageUrl: string,
  origin: string
): Promise<{ mimeType: string; data: string }> {
  const resolvedUrl = imageUrl.startsWith('/')
    ? new URL(imageUrl, origin).toString()
    : imageUrl;
  const response = await fetch(resolvedUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });
  if (!response.ok) {
    throw new Error(`参考图下载失败 (${response.status})`);
  }
  const contentType = response.headers.get('content-type') || 'image/png';
  const arrayBuffer = await response.arrayBuffer();
  const data = Buffer.from(arrayBuffer).toString('base64');
  return { mimeType: contentType, data };
}

// 后台处理任务
async function processGenerationTask(
  generationId: string,
  userId: string,
  body: GeminiGenerateRequest
) {
  try {
    console.log(`[Task ${generationId}] 开始处理 Gemini 生成任务`);
    
    await updateGeneration(generationId, { status: 'processing' });

    const result = await generateWithGemini(body);

    // 优先上传到 PicUI 图床，否则保存为本地文件
    const savedUrl = await saveMediaAsync(generationId, result.url);
    
    console.log(`[Task ${generationId}] 生成成功:`, savedUrl);

    await updateUserBalance(userId, -result.cost);

    await updateGeneration(generationId, {
      status: 'completed',
      resultUrl: savedUrl,
    });

    console.log(`[Task ${generationId}] 任务完成`);
  } catch (error) {
    console.error(`[Task ${generationId}] 任务失败:`, error);
    
    await updateGeneration(generationId, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : '生成失败',
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const body: GeminiGenerateRequest = await request.json();
    const origin = new URL(request.url).origin;
    const normalizedBody: GeminiGenerateRequest = {
      ...body,
      images: Array.isArray(body.images) ? [...body.images] : [],
    };

    if (body.referenceImageUrl) {
      const ref = await fetchImageAsBase64(body.referenceImageUrl, origin);
      normalizedBody.images?.push({ mimeType: ref.mimeType, data: ref.data });
    }

    if (!normalizedBody.prompt && (!normalizedBody.images || normalizedBody.images.length === 0)) {
      return NextResponse.json(
        { error: '请输入提示词或上传参考图片' },
        { status: 400 }
      );
    }

    const user = await getUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 401 });
    }

    const config = await getSystemConfig();
    const estimatedCost = normalizedBody.model.includes('pro')
      ? config.pricing.geminiPro
      : config.pricing.geminiNano;

    if (user.balance < estimatedCost) {
      return NextResponse.json(
        { error: `余额不足，需要至少 ${estimatedCost} 积分` },
        { status: 402 }
      );
    }

    const generation = await saveGeneration({
      userId: user.id,
      type: 'gemini-image',
      prompt: normalizedBody.prompt,
      params: {
        model: normalizedBody.model,
        aspectRatio: normalizedBody.aspectRatio,
        imageSize: normalizedBody.imageSize,
      },
      resultUrl: '',
      cost: estimatedCost,
      status: 'pending',
    });

    processGenerationTask(generation.id, user.id, normalizedBody).catch((err) => {
      console.error('[API] Gemini 后台任务启动失败:', err);
    });

    return NextResponse.json({
      success: true,
      data: {
        id: generation.id,
        status: 'pending',
        message: '任务已创建，正在后台处理中',
      },
    });
  } catch (error) {
    console.error('[API] Gemini generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成失败' },
      { status: 500 }
    );
  }
}
