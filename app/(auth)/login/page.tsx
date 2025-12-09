'use client';

import { useState, useCallback, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowRight } from 'lucide-react';
import { ParticlesBackground } from '@/components/ui/particles';
import { Captcha } from '@/components/ui/captcha';

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 已登录用户自动跳转
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.replace('/image');
    }
  }, [status, session, router]);

  const handleCaptchaChange = useCallback((id: string, code: string) => {
    setCaptchaId(id);
    setCaptchaCode(code);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 验证码检查
    if (!captchaCode || captchaCode.length !== 4) {
      setError('请输入4位验证码');
      return;
    }

    setLoading(true);

    try {
      // 先验证验证码
      const captchaRes = await fetch('/api/captcha/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: captchaId, code: captchaCode }),
      });
      
      const captchaData = await captchaRes.json();
      if (!captchaData.success) {
        setError('验证码错误');
        // 刷新验证码
        handleCaptchaChange('', '');
        return;
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/image');
        router.refresh();
      }
    } catch {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-black relative">
      <ParticlesBackground />
      
      {/* Left Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 border border-white/30 rounded-lg flex items-center justify-center">
                <span className="text-lg font-light text-white">S</span>
              </div>
              <span className="font-light text-xl tracking-wider text-white">SANHUB</span>
            </Link>
          </div>

          <div>
            <h2 className="text-3xl font-light text-white">欢迎回来</h2>
            <p className="text-white/50 mt-2">登录您的账号继续创作</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm text-white/50 uppercase tracking-wider">邮箱</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors backdrop-blur-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/50 uppercase tracking-wider">密码</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors backdrop-blur-sm"
              />
            </div>

            <Captcha onCaptchaChange={handleCaptchaChange} />

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl backdrop-blur-sm">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  登录中...
                </>
              ) : (
                <>
                  登录
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div>
            <span className="text-white/40">还没有账号？</span>{' '}
            <Link href="/register" className="text-white hover:underline font-medium">
              立即注册
            </Link>
          </div>
        </div>
      </div>

      {/* Right Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-bl from-white/5 to-transparent border-l border-white/10 relative z-10">
        <div />
        
        <div className="space-y-6">
          <h1 className="text-5xl font-extralight text-white leading-tight">
            创意无限
            <br />
            <span className="font-normal">AI 驱动</span>
          </h1>
          <p className="text-white/50 text-lg font-light max-w-md">
            使用 Sora 和 Gemini 的强大能力，将你的想象力转化为惊艳的视觉作品
          </p>
        </div>

        <div className="flex items-center gap-4">
          <p className="text-white/30 text-sm">© 2025 SanHub</p>
          <a 
            href="https://github.com/genz27/sanhub" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">Open Source</span>
          </a>
        </div>
      </div>
    </div>
  );
}
