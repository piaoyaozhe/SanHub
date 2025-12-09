import { NextRequest, NextResponse } from 'next/server';
import { cache, CacheKeys, CacheTTL } from '@/lib/cache';
import { checkRateLimit, RateLimitConfig } from '@/lib/rate-limit';

// 作品广场 API - 代理 ModelScope 接口
export async function POST(request: NextRequest) {
  try {
    // 限流检查
    const rateLimit = checkRateLimit(request, RateLimitConfig.API, 'gallery');
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: '请求过于频繁，请稍后再试' },
        { status: 429, headers: rateLimit.headers }
      );
    }

    const body = await request.json();
    
    const {
      pageSize = 30,
      pageNumber = 1,
      query = '',
      sort = 'gmt_created',
      modelName = 'Tongyi-MAI/Z-Image-Turbo',
    } = body;

    // 检查缓存
    const cacheKey = `${CacheKeys.GALLERY}${modelName}:${pageNumber}:${pageSize}:${sort}:${query}`;
    const cached = cache.get<{ data: unknown }>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { headers: rateLimit.headers });
    }

    const payload = {
      PageSize: pageSize,
      PageNumber: pageNumber,
      Query: query,
      Sort: sort,
      SingleCriterion: [
        {
          category: 'model_name',
          DateType: 'string',
          predicate: 'equal',
          StringValue: modelName,
        },
      ],
    };

    const fetchResponse = await fetch('https://www.modelscope.cn/api/v1/dolphin/aigcPictures', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify(payload),
    });

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      console.error('[Gallery API] ModelScope error:', fetchResponse.status, errorText);
      return NextResponse.json(
        { error: '获取作品列表失败', details: errorText },
        { status: fetchResponse.status }
      );
    }

    const data = await fetchResponse.json();
    
    if (data.Code !== 200) {
      return NextResponse.json(
        { error: data.Message || '获取作品列表失败' },
        { status: 400 }
      );
    }

    // 转换数据格式
    const pictures = data.Data?.AigcPictures || [];
    const result = {
      pictures: pictures.map((pic: any) => ({
        id: pic.PictureId,
        museImageId: pic.MuseImageID,
        title: pic.Title || '',
        prompt: pic.Prompt || '',
        negativePrompt: pic.NegativePrompt || '',
        imageUrl: pic.DisplayURL || pic.URL,
        width: pic.Width,
        height: pic.Height,
        author: {
          name: pic.NickName || pic.CreatedBy,
          avatar: pic.Avatar,
        },
        stats: {
          views: pic.ViewCount || 0,
          downloads: pic.DownloadCount || 0,
          stars: pic.StarCount || 0,
          alreadyStar: pic.AlreadyStar || false,
        },
        createdAt: pic.CreatedAt,
      })),
      total: data.Data?.Total || pictures.length,
      pageNumber,
      pageSize,
    };

    const jsonResponse = { data: result };
    
    // 缓存结果
    cache.set(cacheKey, jsonResponse, CacheTTL.GALLERY);
    
    return NextResponse.json(jsonResponse, { headers: rateLimit.headers });
  } catch (error) {
    console.error('[Gallery API] Error:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
