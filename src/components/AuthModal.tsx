import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  open, 
  onOpenChange, 
  defaultMode = 'login' 
}) => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      setMode(defaultMode);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
    }
  }, [open, defaultMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({ title: t('common.error'), description: t('common.fill_all_fields'), variant: 'destructive' });
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      toast({ title: t('common.error'), description: t('common.passwords_mismatch'), variant: 'destructive' });
      return;
    }

    if (password.length < 6) {
      toast({ title: t('common.error'), description: t('common.password_short'), variant: 'destructive' });
      return;
    }

    setLoading(true);
    
    try {
      let error = null;
      let data = null;

      if (mode === 'register') {
        const res = await supabase.auth.signUp({
          email,
          password,
        });
        error = res.error;
        data = res.data;
      } else {
        const res = await supabase.auth.signInWithPassword({
          email,
          password,
      });
        error = res.error;
        data = res.data;
      }

      if (error) {
        throw error;
      }

      if (mode === 'register' && data?.user && !data.session) {
         toast({ 
          title: t('common.register_success'),
          description: t('common.confirm_email')
        });
        onOpenChange(false);
        return;
      }

      await refreshUser(); // Update global auth state

      toast({ 
        title: mode === 'register' ? t('common.register_success') : t('common.login_success'),
        description: t('common.welcome')
      });
      
      onOpenChange(false);
      // DomainHandler in App.tsx will handle redirection to app subdomain if needed
      if (window.location.hostname === 'loverlay.com') {
          // Explicitly redirect to app to be faster/sure? 
          // Actually App.tsx useEffect will catch it, but we can also do it here.
          // Let's rely on App.tsx for consistency.
      } else {
        navigate('/editor');
      }
    } catch (error: any) {
      toast({ 
        title: t('common.error'), 
        description: error.message || 'Что-то пошло не так',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
                redirectTo: window.location.origin,
            }
        });
        if (error) throw error;
    } catch (error: any) {
         toast({ 
            title: 'Google Auth Error', 
            description: error.message,
            variant: 'destructive'
          });
    }
  };

  const handleAppleAuth = async () => {
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: {
                redirectTo: window.location.origin,
            }
        });
        if (error) throw error;
    } catch (error: any) {
    toast({ 
            title: 'Apple Auth Error', 
            description: error.message,
            variant: 'destructive'
    });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-2xl font-bold">
            {mode === 'register' ? t('auth.register_title') : t('auth.login_title')}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {mode === 'register' 
              ? t('auth.register_desc')
              : t('auth.login_desc')
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">{t('common.email')}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-500"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300">{t('common.password')}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-500"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-zinc-300">{t('common.confirm_password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-purple-500"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0 py-5"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === 'register' ? (
              t('common.register')
            ) : (
              t('common.login')
            )}
          </Button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-zinc-900 px-2 text-zinc-500">{t('common.or')}</span>
          </div>
        </div>

        <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full bg-white/5 border-zinc-700 text-white hover:bg-white/10 hover:text-white"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {t('common.continue_google')}
        </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleAppleAuth}
            disabled={loading}
            className="w-full bg-white/5 border-zinc-700 text-white hover:bg-white/10 hover:text-white"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.38-1.09-.54-2.09-.5-3.08 0-1.02.51-2.02.58-3.08-.38-1.97-1.78-3.44-4.5-3.44-7.39 0-3.14 1.83-5.28 4.79-5.28 1.18 0 2.21.51 2.87.51.64 0 1.83-.55 3.05-.55 1.25 0 2.36.42 3.05 1.05-.28.17-1.76 1.05-1.76 3.69 0 2.95 2.5 3.97 2.62 4.01-.02.09-.39 1.39-1.31 2.76-.79 1.16-1.61 2.3-2.63 2.2zm-4.32-15.3c.63-.77 1.07-1.85 1.07-2.92 0-.15 0-.29-.02-.44-.99.04-2.2.66-2.91 1.49-.64.75-1.18 1.9-1.03 2.92.15.01 1.89-.28 2.89-1.05z"/>
            </svg>
            {t('common.continue_apple')}
          </Button>
        </div>

        <p className="text-center text-sm text-zinc-400 mt-4">
          {mode === 'register' ? (
            <>
              {t('common.already_account')}{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-purple-400 hover:text-purple-300 font-medium"
              >
                {t('common.login')}
              </button>
            </>
          ) : (
            <>
              {t('common.no_account')}{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-purple-400 hover:text-purple-300 font-medium"
              >
                {t('common.register')}
              </button>
            </>
          )}
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
