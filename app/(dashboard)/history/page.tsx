'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { History, Download, Maximize2, X, Loader2, Play, Image, Video, Palette, Trash2, Check, Square, CheckSquare, Edit3, Copy } from 'lucide-react';
import { toast } from '@/components/ui/toaster';
import type { Generation } from '@/types';
import { formatDate, truncate } from '@/lib/utils';

// 任务类型
interface Task {
  id: string;
  prompt: string;
  type: string;
  status: 'pending' | 'processing';
  createdAt: number;
}

export default function HistoryPage() {
  const { data: session, update } = useSession();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Generation | null>(null);
  const [filter, setFilter] = useState<'all' | 'video' | 'image'>('all');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<'single' | 'batch' | 'all' | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const pageSize = 50;

  const loadHistory = useCallback(async (pageNum: number, append = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      const res = await fetch(`/api/user/history?page=${pageNum}&limit=${pageSize}`);
      if (res.ok) {
        const data = await res.json();
        const newGenerations = data.data || [];
        
        if (append) {
          setGenerations(prev => [...prev, ...newGenerations]);
        } else {
          setGenerations(newGenerations);
        }
        
        setHasMore(newGenerations.length === pageSize);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // 初始加载 - 只在组件挂载时执行一次
  const initialLoadRef = useRef(false);
  useEffect(() => {
    if (session?.user && !initialLoadRef.current) {
      initialLoadRef.current = true;
      loadHistory(1);
      loadPendingTasks();
    }

    return () => {
      abortControllersRef.current.forEach(controller => controller.abort());
      abortControllersRef.current.clear();
    };
  }, [session?.user?.id, loadHistory]);

  // 使用 ref 存储最新状态，避免 observer 回调中的闭包问题
  const stateRef = useRef({ page, hasMore, loading, loadingMore });
  useEffect(() => {
    stateRef.current = { page, hasMore, loading, loadingMore };
  }, [page, hasMore, loading, loadingMore]);

  // 使用 ref 保存 loadHistory 函数避免 observer 重建
  const loadHistoryRef = useRef(loadHistory);
  useEffect(() => {
    loadHistoryRef.current = loadHistory;
  }, [loadHistory]);

  // 无限滚动 - 只创建一次 observer，不依赖 loadHistory
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const { page: currentPage, hasMore: canLoadMore, loading: isLoading, loadingMore: isLoadingMore } = stateRef.current;
        if (entries[0].isIntersecting && canLoadMore && !isLoading && !isLoadingMore) {
          const nextPage = currentPage + 1;
          setPage(nextPage);
          loadHistoryRef.current(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const loadPendingTasks = async () => {
    try {
      const res = await fetch('/api/user/tasks');
      if (res.ok) {
        const data = await res.json();
        const tasks: Task[] = (data.data || []).map((t: any) => ({
          id: t.id,
          prompt: t.prompt,
          type: t.type,
          status: t.status,
          createdAt: t.createdAt,
        }));
        
        if (tasks.length > 0) {
          setPendingTasks(tasks);
          tasks.forEach(task => pollTaskStatus(task.id));
        }
      }
    } catch (err) {
      console.error('Failed to load pending tasks:', err);
    }
  };

  const pollTaskStatus = useCallback(async (taskId: string) => {
    // 防止重复轮询
    if (abortControllersRef.current.has(taskId)) return;

    const controller = new AbortController();
    abortControllersRef.current.set(taskId, controller);

    const poll = async () => {
      if (controller.signal.aborted) return;

      try {
        const res = await fetch(`/api/generate/status/${taskId}`, {
          signal: controller.signal,
        });
        const data = await res.json();

        if (!res.ok) {
          // 请求失败时移除控制器，允许稍后重试
          abortControllersRef.current.delete(taskId);
          return;
        }

        const status = data.data.status;

        if (status === 'completed' || status === 'failed' || status === 'cancelled') {
          // 任务结束，清理状态
          setPendingTasks(prev => prev.filter(t => t.id !== taskId));
          abortControllersRef.current.delete(taskId);
          if (status === 'completed') {
            await update();
            // 使用 ref 调用避免闭包问题
            loadHistoryRef.current(1);
          }
        } else {
          // 更新任务状态
          setPendingTasks(prev => prev.map(t => 
            t.id === taskId ? { ...t, status: status as 'pending' | 'processing' } : t
          ));
          // 继续轮询
          setTimeout(poll, 5000);
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          abortControllersRef.current.delete(taskId);
        }
      }
    };

    await poll();
  }, [update]);

  const downloadFile = (url: string, id: string, type: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `sanhub-${id}.${type.includes('video') ? 'mp4' : 'png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 删除功能
  const handleDelete = async (action: 'single' | 'batch' | 'all', id?: string) => {
    setDeleting(true);
    try {
      const body: any = { action };
      if (action === 'single' && id) {
        body.id = id;
      } else if (action === 'batch') {
        body.ids = Array.from(selectedIds);
      }

      const res = await fetch('/api/user/history/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({
        title: '删除成功',
        description: `已删除 ${data.deletedCount} 个作品`,
      });

      // 刷新列表
      setSelectedIds(new Set());
      setSelectMode(false);
      setPage(1);
      loadHistory(1);
    } catch (error) {
      toast({
        title: '删除失败',
        description: error instanceof Error ? error.message : '删除失败',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(null);
      setDeleteTargetId(null);
    }
  };

  // 切换选择
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredGenerations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredGenerations.map(g => g.id)));
    }
  };

  const isVideo = (gen: Generation) => gen.type.includes('video');

  const getTypeBadge = (type: string) => {
    if (type === 'sora-video') return { label: 'Sora 视频', icon: Video };
    if (type === 'sora-image') return { label: 'Sora 图像', icon: Image };
    if (type === 'gemini-image') return { label: 'Gemini', icon: Palette };
    if (type === 'zimage-image') return { label: 'Z-Image', icon: Image };
    if (type === 'gitee-image') return { label: 'Gitee', icon: Image };
    return { label: type, icon: Palette };
  };

  const isTaskVideo = (type: string) => type?.includes('video');
  
  // 获取正在进行的任务 ID 集合
  const pendingTaskIds = new Set(pendingTasks.map(t => t.id));
  
  // 过滤已完成的作品：排除正在进行中的任务，且只显示有 resultUrl 的
  const filteredGenerations = generations.filter(gen => {
    // 排除正在进行中的任务（避免重复显示）
    if (pendingTaskIds.has(gen.id)) return false;
    // 排除没有结果链接的（还未真正完成）
    if (!gen.resultUrl) return false;
    // 排除 pending/processing 状态的
    if (gen.status === 'pending' || gen.status === 'processing') return false;
    
    if (filter === 'all') return true;
    if (filter === 'video') return isVideo(gen);
    return !isVideo(gen);
  });
  
  // 根据筛选条件过滤 pending 任务
  const filteredTasks = pendingTasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'video') return isTaskVideo(task.type);
    return !isTaskVideo(task.type);
  });

  // 只统计真正完成的作品
  const completedGenerations = generations.filter(g => g.resultUrl && g.status !== 'pending' && g.status !== 'processing');
  const stats = {
    total: completedGenerations.length,
    pending: pendingTasks.length,
    videos: completedGenerations.filter(g => isVideo(g)).length,
    images: completedGenerations.filter(g => !isVideo(g)).length,
  };

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-light text-white">创作历史</h1>
            <p className="text-white/50 mt-1">查看和管理您的所有作品</p>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-6">
            {stats.pending > 0 && (
              <>
                <div className="text-center">
                  <p className="text-2xl font-light text-blue-400">{stats.pending}</p>
                  <p className="text-xs text-white/40">进行中</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
              </>
            )}
            <div className="text-center">
              <p className="text-2xl font-light text-white">{stats.total}</p>
              <p className="text-xs text-white/40">总作品</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-light text-white">{stats.videos}</p>
              <p className="text-xs text-white/40">视频</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-light text-white">{stats.images}</p>
              <p className="text-xs text-white/40">图像</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            {(['all', 'video', 'image'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  filter === f
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {f === 'all' ? '全部' : f === 'video' ? '视频' : '图像'}
              </button>
            ))}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-2">
            {selectMode ? (
              <>
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 px-3 py-2 bg-white/5 text-white/60 rounded-lg text-sm hover:bg-white/10 hover:text-white transition-all"
                >
                  {selectedIds.size === filteredGenerations.length ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  {selectedIds.size > 0 ? `已选 ${selectedIds.size}` : '全选'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm('batch')}
                  disabled={selectedIds.size === 0 || deleting}
                  className="flex items-center gap-2 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  删除选中
                </button>
                <button
                  onClick={() => {
                    setSelectMode(false);
                    setSelectedIds(new Set());
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-white/5 text-white/60 rounded-lg text-sm hover:bg-white/10 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                  取消
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setSelectMode(true)}
                  disabled={filteredGenerations.length === 0}
                  className="flex items-center gap-2 px-3 py-2 bg-white/5 text-white/60 rounded-lg text-sm hover:bg-white/10 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Edit3 className="w-4 h-4" />
                  管理
                </button>
                <button
                  onClick={() => setShowDeleteConfirm('all')}
                  disabled={filteredGenerations.length === 0 || deleting}
                  className="flex items-center gap-2 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  清空全部
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <History className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-white">作品库</h2>
                <p className="text-sm text-white/40">{filteredGenerations.length} 个作品</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white/30 mb-4" />
                <p className="text-white/40">加载中...</p>
              </div>
            ) : filteredGenerations.length === 0 && filteredTasks.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center border border-dashed border-white/20 rounded-xl">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                  <Image className="w-8 h-8 text-white/20" />
                </div>
                <p className="text-white/40">暂无{filter === 'video' ? '视频' : filter === 'image' ? '图像' : ''}作品</p>
                <p className="text-white/20 text-sm mt-1">开始创作你的第一个作品</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Pending 任务 */}
                {filteredTasks.map((task) => {
                  const badge = getTypeBadge(task.type);
                  return (
                    <div
                      key={task.id}
                      className="group relative aspect-video bg-white/5 rounded-xl overflow-hidden border border-blue-500/30"
                    >
                      {/* 加载动画 */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                        <Loader2 className="w-8 h-8 text-white/60 animate-spin mb-2" />
                        <p className="text-xs text-white/60">
                          {task.status === 'processing' ? '生成中...' : '排队中...'}
                        </p>
                      </div>
                      {/* 类型标签 */}
                      <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500/50 backdrop-blur-sm rounded-md flex items-center gap-1">
                        {isTaskVideo(task.type) ? (
                          <Play className="w-3 h-3 text-white" />
                        ) : (
                          <Image className="w-3 h-3 text-white" />
                        )}
                        <span className="text-[10px] text-white">
                          {task.status === 'processing' ? '生成中' : '排队中'}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 bg-black/50 backdrop-blur-sm text-white text-[10px] rounded-md flex items-center gap-1">
                          <badge.icon className="w-3 h-3" />
                          {badge.label}
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                        <p className="text-xs text-white/80 truncate">{task.prompt || '无提示词'}</p>
                        <p className="text-[10px] text-white/40 mt-1">{formatDate(task.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
                
                {/* 已完成的作品 */}
                {filteredGenerations.map((gen) => {
                  const badge = getTypeBadge(gen.type);
                  const isSelected = selectedIds.has(gen.id);
                  return (
                    <div
                      key={gen.id}
                      className={`group relative aspect-video bg-white/5 rounded-xl overflow-hidden cursor-pointer border transition-all ${
                        isSelected 
                          ? 'border-blue-500 ring-2 ring-blue-500/50' 
                          : 'border-white/10 hover:border-white/30'
                      }`}
                      onClick={() => {
                        if (selectMode) {
                          toggleSelect(gen.id);
                        } else {
                          setSelected(gen);
                        }
                      }}
                    >
                      {isVideo(gen) ? (
                        <>
                          <video
                            src={gen.resultUrl}
                            className="w-full h-full object-cover"
                            muted
                            loop
                            preload="metadata"
                            onMouseEnter={(e) => !selectMode && e.currentTarget.play()}
                            onMouseLeave={(e) => {
                              e.currentTarget.pause();
                              e.currentTarget.currentTime = 0;
                            }}
                          />
                          <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-md flex items-center gap-1">
                            <Play className="w-3 h-3 text-white" />
                            <span className="text-[10px] text-white">VIDEO</span>
                          </div>
                        </>
                      ) : (
                        <img
                          src={gen.resultUrl}
                          alt={gen.prompt}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                      
                      {/* 选择模式下的复选框 */}
                      {selectMode && (
                        <div className="absolute top-2 left-2 z-10">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                            isSelected 
                              ? 'bg-blue-500' 
                              : 'bg-black/50 backdrop-blur-sm border border-white/30'
                          }`}>
                            {isSelected && <Check className="w-4 h-4 text-white" />}
                          </div>
                        </div>
                      )}
                      
                      {!selectMode && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <Maximize2 className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 bg-black/50 backdrop-blur-sm text-white text-[10px] rounded-md flex items-center gap-1">
                          <badge.icon className="w-3 h-3" />
                          {badge.label}
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                        <p className="text-xs text-white/80 truncate">{gen.prompt || '无提示词'}</p>
                        <p className="text-[10px] text-white/40 mt-1">{formatDate(gen.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* 加载更多触发器 - 始终渲染以确保无限滚动工作 */}
          <div ref={loadMoreRef} className="h-10 flex items-center justify-center pb-4">
            {loadingMore && (
              <Loader2 className="w-5 h-5 animate-spin text-white/30" />
            )}
            {!hasMore && generations.length > 0 && !loading && (
              <p className="text-white/30 text-sm">已加载全部作品</p>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8"
          onClick={() => setSelected(null)}
        >
          <div className="w-full h-full flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-[90vw] max-h-[70vh] md:max-h-[75vh] flex items-center justify-center">
              {isVideo(selected) ? (
                <video
                  src={selected.resultUrl}
                  className="max-w-full max-h-[70vh] md:max-h-[75vh] w-auto h-auto rounded-xl border border-white/10"
                  controls
                  autoPlay
                  loop
                />
              ) : (
                <img
                  src={selected.resultUrl}
                  alt={selected.prompt}
                  className="max-w-full max-h-[70vh] md:max-h-[75vh] w-auto h-auto rounded-xl border border-white/10 object-contain"
                />
              )}
            </div>

            <div className="w-full max-w-3xl mt-4 md:mt-6 px-2">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <p className="text-white text-sm leading-relaxed truncate md:whitespace-normal flex-1">{truncate(selected.prompt || '无提示词', 150)}</p>
                    {selected.prompt && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selected.prompt);
                          toast({ title: '已复制提示词' });
                        }}
                        className="shrink-0 p-1.5 text-white/40 hover:text-white/80 hover:bg-white/10 rounded-lg transition-colors"
                        title="复制提示词"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-2">
                    <span className="text-white/40 text-xs">{formatDate(selected.createdAt)}</span>
                    <span className="text-white/20 hidden md:inline">·</span>
                    <span className="text-white/40 text-xs">{selected.cost} 积分</span>
                    <span className="text-white/20 hidden md:inline">·</span>
                    <span className="px-2 py-0.5 bg-white/10 text-white/60 text-xs rounded">
                      {getTypeBadge(selected.type).label}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 w-full md:w-auto">
                  <button
                    onClick={() => downloadFile(selected.resultUrl, selected.id, selected.type)}
                    className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-black rounded-xl hover:bg-white/90 transition-colors text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    下载
                  </button>
                  <button
                    onClick={() => setSelected(null)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 transition-colors text-sm font-medium"
                  >
                    <X className="w-4 h-4" />
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">确认删除</h3>
                <p className="text-sm text-white/40">此操作无法撤销</p>
              </div>
            </div>
            
            <p className="text-white/60 mb-6">
              {showDeleteConfirm === 'all' && '确定要清空所有已完成的作品吗？进行中的任务不会被删除。'}
              {showDeleteConfirm === 'batch' && `确定要删除选中的 ${selectedIds.size} 个作品吗？`}
              {showDeleteConfirm === 'single' && '确定要删除这个作品吗？'}
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-white/5 text-white border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (showDeleteConfirm === 'single' && deleteTargetId) {
                    handleDelete('single', deleteTargetId);
                  } else if (showDeleteConfirm === 'batch') {
                    handleDelete('batch');
                  } else if (showDeleteConfirm === 'all') {
                    handleDelete('all');
                  }
                }}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    删除中...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    确认删除
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
