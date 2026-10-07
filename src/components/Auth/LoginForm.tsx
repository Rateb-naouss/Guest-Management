import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const { success, error } = useToast();

  const [email, setEmail] = useState('admin@wedding.com');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      error('يرجى ملء جميع الحقول');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      success('مرحباً بك! تم تسجيل الدخول إلى لوحة إدارة حفل الزفاف بنجاح');
    } catch (err: any) {
      error(err.message || 'بيانات الدخول غير صحيحة');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@wedding.com');
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative ambient subtle glow */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-serif sm:font-sans">
            نظام إدارة وتنظيم ضيوف الزفاف
          </h1>
          <p className="text-xs text-neutral-400 mt-1.5 font-medium">
            بوابة تسجيل دخول المشرفين والمنظمين لإدارة الحضور وتوزيع الطاولات
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-neutral-800/90 border border-neutral-700/80 rounded-3xl p-7 shadow-2xl backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-neutral-300 font-semibold mb-1.5">
                البريد الإلكتروني للمسؤول
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@wedding.com"
                  dir="ltr"
                  className="w-full pr-10 pl-4 py-2.5 bg-neutral-900/80 border border-neutral-700 rounded-xl text-neutral-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all text-right"
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-300 font-semibold mb-1.5">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full pr-10 pl-4 py-2.5 bg-neutral-900/80 border border-neutral-700 rounded-xl text-neutral-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all text-right"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 text-xs"
            >
              <span>{isLoading ? 'جاري التحقق...' : 'تسجيل الدخول إلى النظام'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Demo account helper */}
          <div className="mt-6 pt-5 border-t border-neutral-700/80 text-center">
            <div className="text-[11px] text-neutral-400 mb-2">
              بيانات الدخول التجريبية المعدّة مسبقاً للمشرف:
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white hover:border-amber-500/40 text-[11px] font-mono transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>admin@wedding.com / admin123</span>
            </button>
          </div>
        </div>

        {/* Footer copyright */}
        <div className="text-center text-[11px] text-neutral-500 mt-6">
          Wedding Guest Management System · All Rights Reserved
        </div>
      </div>
    </div>
  );
};
