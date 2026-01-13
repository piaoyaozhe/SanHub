'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  User,
  Upload,
  Trash2,
  Sparkles,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import { cn, fileToBase64 } from '@/lib/utils';
import { toast } from '@/components/ui/toaster';
import type { CharacterCard, DailyLimitConfig } from '@/types';
import { formatDate } from '@/lib/utils';

// 进行中的任务（存储在内存中，刷新后消失）
interface PendingTask {
  id: string;
  avatarUrl: string;
  status: 'pending' | 'processing' | 'failed';
  errorMessage?: string;
  createdAt: number;
}

// 每日使用量类型
interface DailyUsage {
  imageCount: number;
  videoCount: number;
  characterCardCount: number;
}

export default function CharacterCardPage() {
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 状态
  const [videoFile, setVideoFile] = useState<{ data: string; preview: string; firstFrame: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [progressMessages, setProgressMessages] = useState<string[]>([]);
  const [characterCards, setCharacterCards] = useState<CharacterCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  // 进行中的任务（在内存中，刷新后消失）
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);

  // 每日限制
  const [dailyUsage, setDailyUsage] = useState<DailyUsage>({ imageCount: 0, videoCount: 0, characterCardCount: 0 });
  const [dailyLimits, setDailyLimits] = useState<DailyLimitConfig>({ imageLimit: 0, videoLimit: 0, characterCardLimit: 0 });
  
  // 角色卡参数
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [instructionSet, setInstructionSet] = useState('');
  const [safetyInstructionSet, setSafetyInstructionSet] = useState('');
  
  // 时间戳滑块 (最多5秒范围)
  const [timestampStart, setTimestampStart] = useState(0);
  const [timestampEnd, setTimestampEnd] = useState(3);
  const [videoDuration, setVideoDuration] = useState(15); // 视频时长，最大15秒

  // 加载角色卡列表（包括已完成和进行中的）
  const loadCharacterCards = useCallback(async () => {
    try {
      const res = await fetch('/api/user/character-cards');
      if (res.ok) {
        const data = await res.json();
        setCharacterCards(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load character cards:', err);
    } finally {
      setLoadingCards(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      loadCharacterCards();
    }
  }, [session?.user, loadCharacterCards]);

  // 加载每日使用量
  useEffect(() => {
    const loadDailyUsage = async () => {
      try {
        const res = await fetch('/api/user/daily-usage');
        if (res.ok) {
          const data = await res.json();
          setDailyUsage(data.data.usage);
          setDailyLimits(data.data.limits);
        }
      } catch (err) {
        console.error('Failed to load daily usage:', err);
      }
    };
    loadDailyUsage();
  }, []);

  // 轮询检查处理中的角色卡状态（包括 pendingTasks）
  useEffect(() => {
    const hasProcessingInCards = characterCards.some(card => card.status === 'processing');
    const hasProcessingInTasks = pendingTasks.some(task => task.status === 'processing');
    
    if (!hasProcessingInCards && !hasProcessingInTasks) return;

    const interval = setInterval(() => {
      loadCharacterCards();
      // 清理已完成或失败的 pendingTasks（已在 characterCards 中的）
      setPendingTasks(prev => prev.filter(task => 
        !characterCards.some(card => card.id === task.id)
      ));
    }, 3000);

    return () => clearInterval(interval);
  }, [characterCards, pendingTasks, loadCharacterCards]);

  // 提取视频第一帧
  const extractFirstFrame = (videoUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = videoUrl;
      video.muted = true;
      
      video.onloadeddata = () => {
        video.currentTime = 0;
      };
      
      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('无法创建 canvas context'));
            return;
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };
      
      video.onerror = () => {
        reject(new Error('视频加载失败'));
      };
      
      video.load();
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 仅支持 MP4 格式
    if (file.type !== 'video/mp4') {
      setError('仅支持 MP4 格式的视频');
      return;
    }

    // 限制文件大小 (15MB)
    if (file.size > 15 * 1024 * 1024) {
      setError('视频文件不能超过 15MB');
      return;
    }

    try {
      const data = await fileToBase64(file);
      // 移除 data:video/mp4;base64, 前缀
      const base64Data = data.split(',')[1] || data;
      const previewUrl = URL.createObjectURL(file);
      
      // 获取视频时长
      const duration = await new Promise<number>((resolve, reject) => {
        const video = document.createElement('video');
        video.src = previewUrl;
        video.onloadedmetadata = () => {
          resolve(video.duration);
        };
        video.onerror = () => reject(new Error('无法读取视频时长'));
      });

      // 限制视频时长最大15秒
      if (duration > 15) {
        URL.revokeObjectURL(previewUrl);
        setError('视频时长不能超过 15 秒');
        return;
      }
      
      // 提取第一帧
      const firstFrame = await extractFirstFrame(previewUrl);
      
      // 设置视频时长和重置滑块
      const actualDuration = Math.min(duration, 15);
      setVideoDuration(actualDuration);
      setTimestampStart(0);
      // 根据视频时长智能设置结束时间（推荐3秒范围）
      const defaultEnd = Math.min(3, actualDuration);
      setTimestampEnd(defaultEnd);
      
      setVideoFile({
        data: base64Data,
        preview: previewUrl,
        firstFrame,
      });
      setError('');
    } catch (err) {
      setError('视频处理失败，请重试');
    }
    e.target.value = '';
  };

  const clearVideo = () => {
    if (videoFile) {
      URL.revokeObjectURL(videoFile.preview);
    }
    setVideoFile(null);
  };

  // 检查是否达到每日限制
  const isCharacterCardLimitReached = dailyLimits.characterCardLimit > 0 && dailyUsage.characterCardCount >= dailyLimits.characterCardLimit;

  const handleGenerate = async () => {
    if (!videoFile) {
      setError('请上传视频文件');
      return;
    }

    // 检查每日限制
    if (isCharacterCardLimitReached) {
      setError(`今日角色卡生成次数已达上限 (${dailyLimits.characterCardLimit} 次)`);
      return;
    }

    setError('');
    setSubmitting(true);
    setProgressMessages(['正在提交任务...']);

    try {
      const response = await fetch('/api/generate/character-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoBase64: videoFile.data,
          firstFrameBase64: videoFile.firstFrame,
          username: username.trim() || undefined,
          displayName: displayName.trim() || undefined,
          instructionSet: instructionSet.trim() || undefined,
          safetyInstructionSet: safetyInstructionSet.trim() || undefined,
          timestamps: `${timestampStart},${timestampEnd}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '生成失败');
      }

      // 添加到进行中任务列表
      const newTask: PendingTask = {
        id: data.data.id,
        avatarUrl: videoFile?.firstFrame || '',
        status: 'processing',
        createdAt: Date.now(),
      };
      setPendingTasks(prev => [newTask, ...prev]);

      toast({
        title: '任务已提交',
        description: '角色卡正在后台生成，请稍候刷新页面查看结果',
      });

      // 更新今日使用量
      setDailyUsage(prev => ({ ...prev, characterCardCount: prev.characterCardCount + 1 }));

      // 清空视频
      clearVideo();

      // 5秒后自动刷新列表
      setTimeout(() => {
        loadCharacterCards();
      }, 5000);

    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
      toast({
        title: '生成失败',
        description: err instanceof Error ? err.message : '生成失败',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 删除角色卡
  const handleDeleteCard = async (cardId: string) => {
    try {
      const res = await fetch('/api/user/character-cards', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId }),
      });

      if (res.ok) {
        // 从列表中移除
        setCharacterCards(prev => prev.filter(c => c.id !== cardId));
        toast({
          title: '已删除',
          description: '角色卡已删除',
        });
      } else {
        const data = await res.json();
        throw new Error(data.error || '删除失败');
      }
    } catch (err) {
      toast({
        title: '删除失败',
        description: err instanceof Error ? err.message : '删除失败',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extralight text-foreground">角色卡生成</h1>
          <p className="text-foreground/50 mt-1 font-light">
            上传视频生成专属角色卡，角色卡将绑定到您的账户
          </p>
        </div>
        {dailyLimits.characterCardLimit > 0 && (
          <div className={cn(
            "px-4 py-2 rounded-xl border text-sm",
            isCharacterCardLimitReached
              ? "bg-red-500/10 border-red-500/30 text-red-400"
              : "bg-card/60 border-border/70 text-foreground/60"
          )}>
            今日: {dailyUsage.characterCardCount} / {dailyLimits.characterCardLimit}
          </div>
        )}
      </div>

      {/* 每日限制达到提示 */}
      {isCharacterCardLimitReached && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">今日角色卡生成次数已达上限，请明天再试</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧 - 生成面板 */}
        <div className="lg:col-span-1">
          <div className={cn(
            "bg-card/60 border border-border/70 rounded-2xl overflow-hidden backdrop-blur-sm",
            isCharacterCardLimitReached && "opacity-50 pointer-events-none"
          )}>
            {/* Header */}
            <div className="px-5 py-4 border-b border-border/70 bg-gradient-to-r from-emerald-500/5 to-sky-500/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-500/30 to-sky-500/30 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-medium text-foreground">角色卡创建</h2>
                  <p className="text-xs text-foreground/40">从视频提取角色</p>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* 视频上传 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-foreground/50 uppercase tracking-wider">上传视频</label>
                  {videoFile && (
                    <button
                      onClick={clearVideo}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> 清除
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="video/mp4"
                  onChange={handleFileUpload}
                />
                {!videoFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-border/70 rounded-lg p-6 text-center cursor-pointer hover:bg-card/60 hover:border-emerald-500/30 transition-all group"
                  >
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-emerald-500/10 to-sky-500/10 flex items-center justify-center group-hover:from-emerald-500/20 group-hover:to-sky-500/20 transition-all">
                      <Upload className="w-5 h-5 text-emerald-400/60 group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <p className="text-sm text-foreground/60 group-hover:text-foreground/80 transition-colors">点击上传视频</p>
                    <p className="text-xs text-foreground/30 mt-1">MP4 格式 · 最长 15 秒 · 最大 15MB</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* 视频预览 */}
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-border/70">
                      <video
                        src={videoFile.preview}
                        className="w-full h-full object-cover"
                        controls
                      />
                    </div>
                    {/* 第一帧预览 */}
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-500/10 to-sky-500/10 rounded-lg border border-emerald-500/20">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-border/70 shrink-0">
                        <img
                          src={videoFile.firstFrame}
                          alt="Video first frame"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-foreground/80">角色卡封面</p>
                        <p className="text-[10px] text-foreground/40">将使用视频第一帧作为角色卡图案</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 时间戳选择 - 仅在有视频时显示 */}
              {videoFile && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-foreground/50 uppercase tracking-wider">提取区间</label>
                    <span className="text-xs text-foreground/40 font-mono">
                      {timestampStart.toFixed(1)}s - {timestampEnd.toFixed(1)}s
                    </span>
                  </div>
                  <div className="p-3 bg-card/60 rounded-lg space-y-3">
                    {/* 可视化时间轴 */}
                    <div className="relative h-3 bg-card/70 rounded-full overflow-hidden">
                      <div
                        className="absolute h-full bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full transition-all"
                        style={{
                          left: `${(timestampStart / videoDuration) * 100}%`,
                          width: `${((timestampEnd - timestampStart) / videoDuration) * 100}%`,
                        }}
                      />
                      {/* 时间刻度 */}
                      <div className="absolute inset-0 flex justify-between px-1 items-center pointer-events-none">
                        {Array.from({ length: Math.min(Math.ceil(videoDuration) + 1, 16) }, (_, i) => (
                          <div key={i} className="w-px h-1.5 bg-card/80" />
                        ))}
                      </div>
                    </div>
                    {/* 双滑块控制 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-foreground/40">起始</span>
                          <span className="text-[10px] text-emerald-400 font-mono">{timestampStart.toFixed(1)}s</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={Math.min(timestampEnd - 0.5, videoDuration - 0.5)}
                          step={0.5}
                          value={timestampStart}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setTimestampStart(val);
                            if (timestampEnd - val > 5) setTimestampEnd(val + 5);
                          }}
                          className="w-full h-1.5 accent-emerald-500 cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-foreground/40">结束</span>
                          <span className="text-[10px] text-sky-400 font-mono">{timestampEnd.toFixed(1)}s</span>
                        </div>
                        <input
                          type="range"
                          min={Math.max(timestampStart + 0.5, 0.5)}
                          max={videoDuration}
                          step={0.5}
                          value={timestampEnd}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setTimestampEnd(val);
                            if (val - timestampStart > 5) setTimestampStart(val - 5);
                          }}
                          className="w-full h-1.5 accent-sky-500 cursor-pointer"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-foreground/30 text-center">
                      区间 {(timestampEnd - timestampStart).toFixed(1)}s / 最大 5s · 视频 {videoDuration.toFixed(1)}s
                    </p>
                  </div>
                </div>
              )}

              {/* 角色信息（可选） */}
              <div className="space-y-3">
                <label className="text-xs text-foreground/50 uppercase tracking-wider">角色信息（可选）</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-foreground/40 mb-1.5 block">用户名</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                      placeholder="my_character"
                      className="w-full px-3 py-2 bg-card/60 border border-border/70 text-foreground rounded-lg focus:outline-none focus:border-emerald-500/30 placeholder:text-foreground/30 text-sm transition-colors"
                      maxLength={32}
                    />
                    <p className="text-[10px] text-foreground/30 mt-1">仅字母、数字、下划线</p>
                  </div>
                  <div>
                    <label className="text-[10px] text-foreground/40 mb-1.5 block">显示名称</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="My Character"
                      className="w-full px-3 py-2 bg-card/60 border border-border/70 text-foreground rounded-lg focus:outline-none focus:border-emerald-500/30 placeholder:text-foreground/30 text-sm transition-colors"
                      maxLength={64}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-foreground/40 mb-1.5 block">人物介绍</label>
                  <textarea
                    value={instructionSet}
                    onChange={(e) => setInstructionSet(e.target.value)}
                    placeholder="描述角色的性格、特点等..."
                    className="w-full h-16 px-3 py-2 bg-card/60 border border-border/70 text-foreground rounded-lg resize-none focus:outline-none focus:border-emerald-500/30 placeholder:text-foreground/30 text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-foreground/40 mb-1.5 block">安全指令</label>
                  <textarea
                    value={safetyInstructionSet}
                    onChange={(e) => setSafetyInstructionSet(e.target.value)}
                    placeholder="安全相关的指令..."
                    className="w-full h-16 px-3 py-2 bg-card/60 border border-border/70 text-foreground rounded-lg resize-none focus:outline-none focus:border-emerald-500/30 placeholder:text-foreground/30 text-sm transition-colors"
                  />
                </div>
              </div>

              {/* 进度消息 */}
              {progressMessages.length > 0 && (
                <div className="space-y-1 p-3 bg-card/60 rounded-lg max-h-40 overflow-y-auto">
                  {progressMessages.map((msg, i) => (
                    <p key={i} className="text-xs text-foreground/60 font-mono">{msg}</p>
                  ))}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={submitting || !videoFile}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-medium transition-all',
                  submitting || !videoFile
                    ? 'bg-card/70 text-foreground/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-sky-500 text-foreground hover:opacity-90'
                )}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>生成中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>生成角色卡</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 右侧 - 角色卡列表 */}
        <div className="lg:col-span-2">
          <div className="bg-card/60 border border-border/70 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="px-5 py-4 border-b border-border/70 bg-gradient-to-r from-sky-500/5 to-emerald-500/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-sky-500/30 to-emerald-500/30 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-sky-400" />
                </div>
                <div>
                  <h2 className="text-base font-medium text-foreground">我的角色卡</h2>
                  <p className="text-xs text-foreground/40">{characterCards.filter((c) => !pendingTasks.some((t) => t.id === c.id)).length + pendingTasks.length} 个角色卡</p>
                </div>
              </div>
            </div>

            <div className="p-5">
              {loadingCards ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-6 h-6 animate-spin text-foreground/30" />
                </div>
              ) : characterCards.length === 0 && pendingTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 border border-dashed border-border/70 rounded-xl bg-gradient-to-br from-emerald-500/5 to-sky-500/5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-sky-500/10 flex items-center justify-center mb-3">
                    <User className="w-7 h-7 text-emerald-400/40" />
                  </div>
                  <p className="text-foreground/50 text-sm">暂无角色卡</p>
                  <p className="text-foreground/30 text-xs mt-1">上传视频开始创建你的第一个角色卡</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* 内存中的任务（优先显示，有实时状态） */}
                  {pendingTasks.map((task) => {
                    return <PendingTaskItem key={task.id} task={task} />;
                  })}
                  {/* 数据库中的角色卡（去重：排除已在 pendingTasks 中的） */}
                  {characterCards
                    .filter((card) => {
                      const isDuplicate = pendingTasks.some((t) => t.id === card.id);
                      return !isDuplicate;
                    })
                    .map((card) => {
                      return <CharacterCardItem key={card.id} card={card} onDelete={handleDeleteCard} />;
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 进行中任务卡片组件（内存中的任务，刷新后消失）
function PendingTaskItem({ task }: { task: PendingTask }) {
  const statusConfig = {
    pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: '排队中' },
    processing: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: '生成中' },
    failed: { bg: 'bg-red-500/20', text: 'text-red-400', label: '失败' },
  };
  const status = statusConfig[task.status];

  return (
    <div className="bg-card/60 border border-border/70 rounded-xl overflow-hidden hover:border-border/70 transition-all">
      <div className="aspect-square bg-gradient-to-br from-emerald-500/10 to-sky-500/10 flex items-center justify-center relative">
        {task.avatarUrl ? (
          <img src={task.avatarUrl} alt="" className="w-full h-full object-cover opacity-60" />
        ) : (
          <User className="w-12 h-12 text-foreground/30" />
        )}
        <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center gap-2">
          {task.status === 'processing' ? (
            <Loader2 className="w-8 h-8 text-foreground animate-spin" />
          ) : task.status === 'pending' ? (
            <div className="w-8 h-8 rounded-full border-2 border-amber-400/50 border-t-amber-400 animate-spin" />
          ) : null}
          <span className={cn('px-2.5 py-1 text-xs rounded-full font-medium', status.bg, status.text)}>
            {status.label}
          </span>
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm text-foreground/60 truncate">正在生成...</p>
        <p className="text-[10px] text-foreground/30 mt-1">{formatDate(task.createdAt)}</p>
        {task.errorMessage && (
          <p className="text-[10px] text-red-400 mt-1 truncate">{task.errorMessage}</p>
        )}
      </div>
    </div>
  );
}

// 角色卡卡片组件
function CharacterCardItem({ card, onDelete }: { card: CharacterCard; onDelete?: (id: string) => void }) {
  const statusConfig = {
    pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: '排队中' },
    processing: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: '生成中' },
    completed: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: '完成' },
    failed: { bg: 'bg-red-500/20', text: 'text-red-400', label: '失败' },
  };
  const status = statusConfig[card.status];
  const isProcessing = card.status === 'processing' || card.status === 'pending';

  return (
    <div className="bg-card/60 border border-border/70 rounded-xl overflow-hidden hover:border-emerald-500/30 transition-all group">
      <div className={cn(
        "aspect-square flex items-center justify-center relative",
        card.status === 'failed' ? "bg-gradient-to-br from-red-500/10 to-red-900/10" : "bg-gradient-to-br from-emerald-500/10 to-sky-500/10"
      )}>
        {card.avatarUrl ? (
          <img
            src={card.avatarUrl}
            alt={card.characterName}
            className={cn("w-full h-full object-cover", (card.status === 'failed' || isProcessing) && "opacity-60")}
          />
        ) : isProcessing ? (
          <Loader2 className="w-10 h-10 text-foreground/30 animate-spin" />
        ) : card.status === 'failed' ? (
          <X className="w-10 h-10 text-red-400/50" />
        ) : (
          <User className="w-12 h-12 text-foreground/30" />
        )}
        
        {/* 状态遮罩 */}
        {(isProcessing || card.status === 'failed') && (
          <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center gap-2">
            {isProcessing && <Loader2 className="w-8 h-8 text-foreground animate-spin" />}
            {card.status === 'failed' && <X className="w-8 h-8 text-red-400" />}
          </div>
        )}
        
        {/* 删除按钮 */}
        {onDelete && (
          <button
            onClick={() => onDelete(card.id)}
            className="absolute top-2 right-2 p-1.5 bg-background/70 hover:bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
            title="删除"
          >
            <Trash2 className="w-3.5 h-3.5 text-foreground" />
          </button>
        )}
        
        {/* 状态标签 */}
        <div className="absolute bottom-2 left-2">
          <span className={cn('px-2 py-0.5 text-[10px] rounded-full font-medium backdrop-blur-sm', status.bg, status.text)}>
            {status.label}
          </span>
        </div>
      </div>

      <div className="p-3">
        <h3 className="text-sm font-medium text-foreground truncate">
          {card.characterName || (card.status === 'failed' ? '生成失败' : '生成中...')}
        </h3>
        <p className="text-[10px] text-foreground/30 mt-1">{formatDate(card.createdAt)}</p>
        {card.errorMessage && (
          <p className="text-[10px] text-red-400 mt-1 line-clamp-1" title={card.errorMessage}>
            {card.errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}

