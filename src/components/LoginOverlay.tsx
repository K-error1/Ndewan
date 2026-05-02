import { useState, useRef, useEffect } from 'react';
import { db, User } from '@/lib/db';
import { useToast } from '@/components/ui/Toast';
import { Boxes, Eye, EyeOff, Lock, User as UserIcon, LogIn } from 'lucide-react';
import { cn } from '@/utils/cn';

interface LoginOverlayProps {
  onLogin: (user: User) => void;
}

export function LoginOverlay({ onLogin }: LoginOverlayProps) {
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { setError('Username is required'); return; }
    if (!password) { setError('Password is required'); return; }
    
    setError('');
    setLoading(true);
    try {
      const result = await db.users.login(username.trim().toLowerCase(), password);
      if (result.success && result.user) {
        toast(`Welcome back, ${result.user.full_name || result.user.username}!`, 'success');
        onLogin(result.user);
      } else {
        setError(result.error || 'Invalid credentials');
        setPassword('');
      }
    } catch (err) {
      setError('Login system error. Please restart the app.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#05080f]">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-emerald-600/8 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-2xl shadow-indigo-900/50 mb-5 ring-1 ring-white/10">
            <Boxes size={30} strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Ndewan Enterprices</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.25em] mt-1.5">Management System</p>
        </div>

        {/* Login Card */}
        <div className="glass-panel rounded-3xl border border-white/5 p-8 shadow-2xl shadow-black/40">
          <h2 className="text-lg font-bold text-white mb-1">Sign In</h2>
          <p className="text-slate-500 text-xs mb-8">Enter your credentials to access the system</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Username
              </label>
              <div className="relative">
                <UserIcon size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                <input
                  ref={usernameRef}
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. admin"
                  autoComplete="username"
                  className={cn(
                    "w-full pl-11 pr-4 py-3.5 rounded-xl bg-black/30 border text-white text-sm font-medium placeholder:text-slate-700",
                    "focus:outline-none focus:ring-2 transition-all",
                    error ? "border-red-500/50 focus:ring-red-500/20" : "border-white/10 focus:border-indigo-500/50 focus:ring-indigo-500/20"
                  )}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={cn(
                    "w-full pl-11 pr-12 py-3.5 rounded-xl bg-black/30 border text-white text-sm font-medium placeholder:text-slate-700",
                    "focus:outline-none focus:ring-2 transition-all",
                    error ? "border-red-500/50 focus:ring-red-500/20" : "border-white/10 focus:border-indigo-500/50 focus:ring-indigo-500/20"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 animate-in">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                <p className="text-red-400 text-xs font-semibold">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm transition-all mt-2",
                "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40",
                "active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              )}
            >
              {loading ? (
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <LogIn size={16} />
              )}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Default credentials hint */}
        <div className="mt-6 text-center">
          <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">
            Default: <span className="text-slate-600">admin</span> / <span className="text-slate-600">admin</span>
          </p>
        </div>
      </div>
    </div>
  );
}
