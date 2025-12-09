'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

interface CaptchaProps {
  onCaptchaChange: (id: string, code: string) => void;
}

export function Captcha({ onCaptchaChange }: CaptchaProps) {
  const [captchaId, setCaptchaId] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [loading, setLoading] = useState(false);

  const refreshCaptcha = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/captcha', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setCaptchaId(data.data.id);
        setCaptchaSvg(data.data.svg);
        setCaptchaCode('');
        onCaptchaChange(data.data.id, '');
      }
    } catch (error) {
      console.error('Failed to load captcha:', error);
    } finally {
      setLoading(false);
    }
  }, [onCaptchaChange]);

  useEffect(() => {
    refreshCaptcha();
  }, [refreshCaptcha]);

  const handleCodeChange = (code: string) => {
    setCaptchaCode(code);
    onCaptchaChange(captchaId, code);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm text-white/50 uppercase tracking-wider">验证码</label>
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="请输入验证码"
          value={captchaCode}
          onChange={(e) => handleCodeChange(e.target.value.toUpperCase())}
          maxLength={4}
          required
          className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors backdrop-blur-sm uppercase tracking-widest"
        />
        <div className="flex items-center gap-2">
          <div
            className="h-[46px] w-[120px] rounded-xl overflow-hidden border border-white/10 cursor-pointer bg-[#1a1a1a]"
            onClick={refreshCaptcha}
            dangerouslySetInnerHTML={{ __html: captchaSvg }}
          />
          <button
            type="button"
            onClick={refreshCaptcha}
            disabled={loading}
            className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50"
            title="刷新验证码"
          >
            <RefreshCw className={`w-5 h-5 text-white/50 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
