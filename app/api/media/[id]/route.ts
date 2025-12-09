import { NextRequest, NextResponse } from 'next/server';
import { getGeneration } from '@/lib/db';
import { readMediaFile, isLocalFile } from '@/lib/media-storage';

// 媒体文件服务端点
// 支持多种存储方式：
// 1. 本地文件 (file:xxx.png)
// 2. 外部 URL (http/https)
// 3. Base64 data URL (data:image/png;base64,xxx)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const generation = await getGeneration(id);
    
    if (!generation) {
      return new NextResponse('Not Found', { status: 404 });
    }
    
    const resultUrl = generation.resultUrl;
    
    if (!resultUrl) {
      return new NextResponse('No Content', { status: 204 });
    }
    
    // 1. 本地文件存储 (file:xxx.png)
    if (isLocalFile(resultUrl)) {
      const file = readMediaFile(resultUrl);
      if (!file) {
        return new NextResponse('File not found', { status: 404 });
      }
      return createMediaResponse(file.buffer, file.mimeType);
    }
    
    // 2. 外部 URL，代理请求
    if (resultUrl.startsWith('http://') || resultUrl.startsWith('https://')) {
      return await proxyExternalUrl(resultUrl, generation.type);
    }
    
    // 3. Base64 data URL
    const match = resultUrl.match(/^data:([^;]+);base64,(.+)$/);
    
    if (!match) {
      return new NextResponse('Invalid media format', { status: 400 });
    }
    
    const mimeType = match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');
    
    return createMediaResponse(buffer, mimeType);
  } catch (error) {
    console.error('[Media API] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// 代理外部URL
async function proxyExternalUrl(url: string, type: string): Promise<NextResponse> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      console.error('[Media API] Proxy fetch failed:', response.status, url);
      return new NextResponse('Failed to fetch media', { status: 502 });
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // 获取 content-type，如果没有则根据类型推断
    let contentType = response.headers.get('content-type');
    if (!contentType) {
      if (type.includes('video')) {
        contentType = 'video/mp4';
      } else {
        contentType = 'image/png';
      }
    }
    
    return createMediaResponse(buffer, contentType);
  } catch (error) {
    console.error('[Media API] Proxy error:', error);
    return new NextResponse('Proxy error', { status: 502 });
  }
}

// 创建媒体响应
function createMediaResponse(buffer: Buffer, contentType: string): NextResponse {
  const cacheControl = 'public, max-age=31536000, immutable'; // 1年缓存
  
  const headers: HeadersInit = {
    'Content-Type': contentType,
    'Content-Length': buffer.length.toString(),
    'Cache-Control': cacheControl,
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': '*',
  };
  
  // 转换为 Uint8Array 以兼容 NextResponse
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers,
  });
}
