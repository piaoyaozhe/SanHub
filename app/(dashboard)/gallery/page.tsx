'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Eye, 
  Download, 
  Star, 
  Loader2,
  X,
  Copy,
  Check,
  Flame,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/toaster';

// 移到组件外部，避免重复创建
function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

interface GalleryPicture {
  id: number;
  museImageId: number;
  title: string;
  prompt: string;
  negativePrompt: string;
  imageUrl: string;
  width: number;
  height: number;
  author: {
    name: string;
    avatar: string;
  };
  stats: {
    views: number;
    downloads: number;
    stars: number;
    alreadyStar: boolean;
  };
  createdAt: number;
}

export default function GalleryPage() {
  const [pictures, setPictures] = useState<GalleryPicture[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [selectedPicture, setSelectedPicture] = useState<GalleryPicture | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [sortBy, setSortBy] = useState<'hot' | 'new'>('new');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const pageSize = 30;
  const loadingRef = useRef(false); // 使用 ref 避免依赖问题

  const fetchPictures = useCallback(async (page: number, append = false, sort: 'hot' | 'new' = 'new') => {
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    setLoading(true);
    try {
      // hot = default (热门), new = gmt_created (最新)
      const sortValue = sort === 'hot' ? 'default' : 'gmt_created';
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageSize,
          pageNumber: page,
          sort: sortValue,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '获取作品列表失败');
      }

      const newPictures = data.data.pictures || [];
      
      if (append) {
        setPictures(prev => [...prev, ...newPictures]);
      } else {
        setPictures(newPictures);
      }

      setHasMore(newPictures.length === pageSize);
    } catch (error) {
      console.error('Failed to fetch gallery:', error);
      toast({
        title: '加载失败',
        description: error instanceof Error ? error.message : '获取作品列表失败',
        variant: 'destructive',
      });
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  // 初始加载和排序切换
  useEffect(() => {
    setPageNumber(1);
    setPictures([]);
    setHasMore(true);
    fetchPictures(1, false, sortBy);
  }, [sortBy]);

  // 无限滚动
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = pageNumber + 1;
          setPageNumber(nextPage);
          fetchPictures(nextPage, true, sortBy);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, pageNumber, sortBy, fetchPictures]);

  const copyPrompt = useCallback(async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(true);
      toast({ title: '已复制提示词' });
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      toast({ title: '复制失败', variant: 'destructive' });
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">作品广场</h1>
          <p className="text-muted-foreground mt-1">
            探索社区创作的精彩 AI 图像作品
          </p>
        </div>
        
        {/* 排序切换 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortBy('hot')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
              sortBy === 'hot'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Flame className="w-4 h-4" />
            最热
          </button>
          <button
            onClick={() => setSortBy('new')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
              sortBy === 'new'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Clock className="w-4 h-4" />
            最新
          </button>
        </div>
      </div>

      {/* 瀑布流布局 */}
      <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
        {pictures.map((pic) => (
          <div
            key={pic.id}
            className="break-inside-avoid cursor-pointer group"
            onClick={() => setSelectedPicture(pic)}
          >
            <div className="relative rounded-xl overflow-hidden bg-secondary/50">
              <img
                src={pic.imageUrl}
                alt={pic.title || pic.prompt}
                className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                style={{
                  aspectRatio: `${pic.width}/${pic.height}`,
                }}
              />
              {/* 悬浮信息 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={pic.author.avatar}
                      alt={pic.author.name}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-white text-sm font-medium truncate">
                      {pic.author.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-white/80 text-xs">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatNumber(pic.stats.views)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {formatNumber(pic.stats.downloads)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {formatNumber(pic.stats.stars)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 加载更多触发器 */}
      <div ref={loadMoreRef} className="flex justify-center py-8">
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>加载中...</span>
          </div>
        )}
        {!hasMore && pictures.length > 0 && (
          <p className="text-muted-foreground">已加载全部作品</p>
        )}
      </div>

      {/* 图片详情弹窗 */}
      {selectedPicture && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedPicture(null)}
        >
          <div
            className="bg-card rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 图片区域 */}
            <div className="flex-1 bg-black flex items-center justify-center min-h-[300px] md:min-h-0">
              <img
                src={selectedPicture.imageUrl}
                alt={selectedPicture.title || selectedPicture.prompt}
                className="max-w-full max-h-[60vh] md:max-h-[90vh] object-contain"
              />
            </div>

            {/* 信息区域 */}
            <div className="w-full md:w-80 p-4 flex flex-col overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <img
                    src={selectedPicture.author.avatar}
                    alt={selectedPicture.author.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="font-medium">{selectedPicture.author.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedPicture(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {selectedPicture.title && (
                <h3 className="font-semibold text-lg mb-2">{selectedPicture.title}</h3>
              )}

              {/* 统计信息 */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {formatNumber(selectedPicture.stats.views)}
                </span>
                <span className="flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  {formatNumber(selectedPicture.stats.downloads)}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  {formatNumber(selectedPicture.stats.stars)}
                </span>
              </div>

              {/* 尺寸信息 */}
              <div className="text-sm text-muted-foreground mb-4">
                尺寸: {selectedPicture.width} × {selectedPicture.height}
              </div>

              {/* 提示词 */}
              {selectedPicture.prompt && (
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">提示词</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyPrompt(selectedPicture.prompt)}
                      className="h-7 px-2"
                    >
                      {copiedPrompt ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 text-sm max-h-48 overflow-y-auto">
                    {selectedPicture.prompt}
                  </div>
                </div>
              )}

              {/* 负面提示词 */}
              {selectedPicture.negativePrompt && (
                <div className="mt-4">
                  <span className="text-sm font-medium text-muted-foreground">负面提示词</span>
                  <div className="bg-secondary/50 rounded-lg p-3 text-sm mt-2 max-h-24 overflow-y-auto text-muted-foreground">
                    {selectedPicture.negativePrompt}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
