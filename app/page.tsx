'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Video, Image, MessageSquare, ArrowRight, Wand2, Layers, Palette, Play, Sparkles, Clock, Download, Infinity, Images, Eye, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticlesWrapper } from '@/components/ui/particles-wrapper';

interface Quota {
  video10sCount: number;
  video15sCount: number;
}

export default function LandingPage() {
  const [quota, setQuota] = useState<Quota | null>(null);

  useEffect(() => {
    // 获取配额
    fetch('/api/sora/quota')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setQuota(data.data);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative">
      <ParticlesWrapper />
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-xl border-b border-white/10 z-50">
        <div className="h-full max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-white/30 rounded flex items-center justify-center">
              <span className="text-sm font-light">S</span>
            </div>
            <span className="font-light text-lg tracking-wider">SANHUB</span>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com/genz27/sanhub" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white/50 hover:text-white transition-colors"
              title="GitHub"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
            <Link href="/login" className="text-sm text-white/70 hover:text-white transition-colors">
              登录
            </Link>
            <Button size="sm" className="bg-white text-black hover:bg-white/90" asChild>
              <Link href="/register">开始创作</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
        
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/3 rounded-full blur-3xl" />

        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <div className="space-y-2">
            <p className="text-white/50 text-sm tracking-[0.3em] uppercase">AI Creative Studio</p>
            <h1 className="text-6xl md:text-8xl font-extralight tracking-tight leading-none">
              想象力
              <br />
              <span className="font-normal">无边界</span>
            </h1>
          </div>
          
          <p className="text-xl text-white/60 font-light max-w-xl mx-auto leading-relaxed">
            融合 Sora 视频生成、Gemini 图像创作与 AI 对话，
            <br className="hidden md:block" />
            将你的创意瞬间转化为视觉艺术
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Button size="lg" className="bg-white text-black hover:bg-white/90 px-8 h-12 text-base" asChild>
              <Link href="/register">
                免费开始 <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/5 px-8 h-12 text-base" asChild>
              <Link href="/login">已有账号</Link>
            </Button>
          </div>

          {/* Quota Display */}
          {quota && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-full">
                <Zap className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-white/60">全站剩余</span>
                <span className="text-blue-400 font-medium">{quota.video10sCount}</span>
                <span className="text-white/40 text-sm">次10s</span>
                <span className="text-white/20">|</span>
                <span className="text-purple-400 font-medium">{quota.video15sCount}</span>
                <span className="text-white/40 text-sm">次15s</span>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-center gap-12 pt-8 text-sm">
            <div className="text-center">
              <p className="text-2xl font-light">Sora</p>
              <p className="text-white/40">AI 视频</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-light">Gemini</p>
              <p className="text-white/40">极速图像</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-light">Gallery</p>
              <p className="text-white/40">作品广场</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-light">Chat</p>
              <p className="text-white/40">AI 对话</p>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
          <span className="text-xs tracking-widest">SCROLL</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent" />
        </div>
      </section>


      {/* Features Grid */}
      <section className="py-32 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-white/40 text-sm tracking-[0.2em] uppercase mb-4">创作工具</p>
            <h2 className="text-4xl md:text-5xl font-extralight">四大核心能力</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Sora */}
            <div className="group p-8 border border-white/10 rounded-2xl hover:border-white/30 transition-all duration-500 hover:bg-white/[0.02]">
              <div className="w-14 h-14 border border-white/20 rounded-xl flex items-center justify-center mb-6 group-hover:border-white/40 transition-colors relative">
                <Video className="w-6 h-6" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-light mb-3">Sora 视频</h3>
              <p className="text-white/50 leading-relaxed mb-6">
                OpenAI 顶尖视频生成模型，从文字描述创造逼真的动态影像，支持多种时长与画幅比例
              </p>
              <div className="space-y-2 text-sm text-white/40">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  <span>10s / 15s 视频生成</span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>16:9 / 9:16 / 1:1 比例</span>
                </div>
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  <span>参考图/视频驱动</span>
                </div>
              </div>
            </div>

            {/* Gemini */}
            <div className="group p-8 border border-white/10 rounded-2xl hover:border-white/30 transition-all duration-500 hover:bg-white/[0.02]">
              <div className="w-14 h-14 border border-white/20 rounded-xl flex items-center justify-center mb-6 group-hover:border-white/40 transition-colors relative">
                <Palette className="w-6 h-6" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-light mb-3">Gemini 图像</h3>
              <p className="text-white/50 leading-relaxed mb-6">
                Google 最新图像生成技术，极速出图与 4K 高清双模式，满足不同创作场景需求
              </p>
              <div className="space-y-2 text-sm text-white/40">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Nano 极速模式</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Pro 4K 高清</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  <span>风格迁移与编辑</span>
                </div>
              </div>
            </div>

            {/* Gallery */}
            <div className="group p-8 border border-white/10 rounded-2xl hover:border-white/30 transition-all duration-500 hover:bg-white/[0.02]">
              <div className="w-14 h-14 border border-white/20 rounded-xl flex items-center justify-center mb-6 group-hover:border-white/40 transition-colors relative">
                <Images className="w-6 h-6" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-light mb-3">作品广场</h3>
              <p className="text-white/50 leading-relaxed mb-6">
                探索社区精彩创作，发现灵感，一键复制提示词开启你的创作之旅
              </p>
              <div className="space-y-2 text-sm text-white/40">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>瀑布流作品浏览</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  <span>热门/最新排序</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  <span>提示词一键复制</span>
                </div>
              </div>
            </div>

            {/* Chat */}
            <div className="group p-8 border border-white/10 rounded-2xl hover:border-white/30 transition-all duration-500 hover:bg-white/[0.02]">
              <div className="w-14 h-14 border border-white/20 rounded-xl flex items-center justify-center mb-6 group-hover:border-white/40 transition-colors relative">
                <MessageSquare className="w-6 h-6" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-light mb-3">AI 对话</h3>
              <p className="text-white/50 leading-relaxed mb-6">
                多模型智能对话，支持图像理解与创意构思，让 AI 成为你的创作伙伴
              </p>
              <div className="space-y-2 text-sm text-white/40">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>多模型自由切换</span>
                </div>
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  <span>视觉理解能力</span>
                </div>
                <div className="flex items-center gap-2">
                  <Infinity className="w-4 h-4" />
                  <span>上下文记忆</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-32 px-6 bg-white/[0.02] border-y border-white/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-white/40 text-sm tracking-[0.2em] uppercase mb-4">创作流程</p>
            <h2 className="text-4xl md:text-5xl font-extralight">简单三步，释放创意</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="text-5xl font-extralight text-white/20 mb-4">01</div>
              <h3 className="text-xl font-light mb-2">描述想法</h3>
              <p className="text-white/50 text-sm">用文字描绘你脑海中的画面，或上传参考图片</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-extralight text-white/20 mb-4">02</div>
              <h3 className="text-xl font-light mb-2">AI 生成</h3>
              <p className="text-white/50 text-sm">选择模型与参数，让 AI 将创意转化为作品</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-extralight text-white/20 mb-4">03</div>
              <h3 className="text-xl font-light mb-2">下载分享</h3>
              <p className="text-white/50 text-sm">保存高清作品，随时回顾与分享你的创作</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features List */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-3">
              <div className="w-12 h-12 border border-white/20 rounded-full flex items-center justify-center mx-auto">
                <Wand2 className="w-5 h-5" />
              </div>
              <h4 className="font-light">一键生成</h4>
              <p className="text-sm text-white/40">无需复杂设置</p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 border border-white/20 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="font-light">极速出图</h4>
              <p className="text-sm text-white/40">秒级响应</p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 border border-white/20 rounded-full flex items-center justify-center mx-auto">
                <Download className="w-5 h-5" />
              </div>
              <h4 className="font-light">高清下载</h4>
              <p className="text-sm text-white/40">原画质保存</p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 border border-white/20 rounded-full flex items-center justify-center mx-auto">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-light">历史记录</h4>
              <p className="text-sm text-white/40">永久保存</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 border-t border-white/10">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-extralight">
            准备好了吗？
          </h2>
          <p className="text-xl text-white/50 font-light">
            注册即获赠初始积分，开启你的 AI 创作之旅
          </p>
          <Button size="lg" className="bg-white text-black hover:bg-white/90 px-12 h-14 text-base" asChild>
            <Link href="/register">
              立即开始 <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border border-white/30 rounded flex items-center justify-center">
                <span className="text-xs font-light">S</span>
              </div>
              <span className="text-sm text-white/50">SANHUB © 2025</span>
            </div>
            <a 
              href="https://github.com/genz27/sanhub" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">GitHub</span>
            </a>
          </div>
          <p className="text-sm text-white/30">
            Powered by OpenAI Sora & Google Gemini
          </p>
        </div>
      </footer>
    </div>
  );
}
