import React, { useState, Suspense, lazy } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Image, 
  Layers, 
  Download, 
  Zap, 
  Palette,
  ArrowRight,
  Check,
  Star,
  Play,
  Wand2
} from 'lucide-react';
import AuthModal from '@/components/AuthModal';
import Footer from '@/components/Footer';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Ленивая загрузка 3D компонента для производительности
const ThreeBackground = lazy(() => import('@/components/ThreeBackground'));

const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  const openAuth = (mode: 'login' | 'register') => {
    if (user) {
      window.location.href = 'https://app.loverlay.com';
      return;
    }
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const getEditorUrl = () => {
    return 'https://app.loverlay.com';
  };

  const handleStart = () => {
    if (user) {
        window.location.href = getEditorUrl();
    } else {
        openAuth('register');
    }
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen text-foreground overflow-hidden bg-surface-0">
      {/* 3D Background */}
      <Suspense fallback={null}>
        <ThreeBackground />
      </Suspense>
      
      {/* Точечный фон как в редакторе */}
      <div className="fixed inset-0 pointer-events-none opacity-30 bg-dots" />

      {/* Header */}
      <header className="relative z-fixed border-b border-white/5 backdrop-blur-unified-xl bg-surface-1/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 group">
            <img 
              src="/assets/logo_white.svg" 
              alt="Loverlay" 
              className="h-4 w-auto"
            />
          </a>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('common.features')}</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('common.how_it_works')}</a>
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t('common.pricing')}</Link>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {user ? (
               <Button 
                variant="ghost"
                className="text-muted-foreground hover:text-foreground hover:bg-white/10"
                onClick={handleLogout}
              >
                {t('common.logout') || 'Sign Out'}
              </Button>
            ) : (
                <>
            <Button 
              variant="ghost" 
              className="text-muted-foreground hover:text-foreground hover:bg-white/10"
              onClick={() => openAuth('login')}
            >
              {t('common.login')}
            </Button>
            <Button 
              className="bg-brand-gradient text-white border-0 shadow-glow-brand rounded-full"
              onClick={() => openAuth('register')}
            >
              {t('common.start_free')}
            </Button>
                </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-24 pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-pink/30 mb-8 animate-fade-in bg-surface-3/80">
              <Wand2 className="w-4 h-4 text-brand-peach" />
              <span className="text-sm text-foreground/80">{t('landing.badge')}</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 animate-fade-in-up">
              {t('landing.title_start')}{' '}
              <span className="text-transparent bg-clip-text bg-brand-gradient">
                {t('landing.title_highlight')}
              </span>
              <br />
              {t('landing.title_end')}
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up delay-100">
              {t('landing.subtitle')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-200">
              {user ? (
                <Button 
                  size="lg"
                  className="bg-brand-gradient text-white border-0 shadow-glow-brand px-12 py-6 text-lg group rounded-full"
                  onClick={() => window.location.href = getEditorUrl()}
                >
                  {t('common.open_editor')}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              ) : (
                <>
                  <Button 
                    size="lg"
                    className="bg-brand-gradient text-white border-0 shadow-glow-brand px-8 py-6 text-lg group rounded-full"
                    onClick={handleStart}
                  >
                    {t('common.try_free')}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <a href={getEditorUrl()}>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="border-white/20 bg-white/5 hover:bg-white/10 text-foreground px-8 py-6 text-lg group backdrop-blur-unified-sm rounded-full"
                    >
                      <Play className="mr-2 w-5 h-5" />
                      {t('common.open_editor')}
                    </Button>
                  </a>
                </>
              )}
            </div>

            {/* Social proof */}
            <div className="flex items-center justify-center gap-6 mt-12 animate-fade-in-up delay-300">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div 
                    key={i} 
                    className="w-10 h-10 rounded-full border-2 border-surface-0 overflow-hidden bg-surface-2 shadow-unified-lg"
                  >
                    <img 
                      src={`/assets/users/user${i}.png`} 
                      alt={`User ${i}`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{t('landing.users_count')}</p>
              </div>
            </div>
          </div>

          {/* Hero Image / Demo */}
          <div className="mt-20 relative animate-fade-in-up delay-500 max-w-5xl mx-auto px-4">
            <div className="absolute inset-x-0 -bottom-24 h-64 bg-gradient-to-t from-surface-0 via-surface-0/80 to-transparent z-10 pointer-events-none" />
            <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-glow-primary backdrop-blur-unified-sm bg-surface-2/90">
              {/* App Preview */}
              <div className="relative w-full overflow-hidden">
                {/* Desktop Screenshot */}
                <img 
                  src="/assets/landing-screenshot.png" 
                  alt="Loverlay Editor Desktop Screenshot" 
                  className="hidden md:block w-full h-auto object-contain"
                />
                {/* Mobile Screenshot */}
                <img 
                  src="/assets/landing-screenshot-mobile.png" 
                  alt="Loverlay Editor Mobile Screenshot" 
                  className="block md:hidden w-full h-auto object-contain"
                />
                {/* Subtle inner shadow for depth */}
                <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.3)] pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t('landing.features_title')}{' '}
              <span className="text-transparent bg-clip-text bg-brand-gradient">
                {t('landing.features_title_highlight')}
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('landing.features_subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Layers className="w-6 h-6" />,
                title: t('landing.feature_overlays_title'),
                description: t('landing.feature_overlays_desc'),
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: <Palette className="w-6 h-6" />,
                title: t('landing.feature_blending_title'),
                description: t('landing.feature_blending_desc'),
                gradient: "from-purple-500 to-pink-500"
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: t('landing.feature_instant_title'),
                description: t('landing.feature_instant_desc'),
                gradient: "from-amber-500 to-orange-500"
              },
              {
                icon: <Image className="w-6 h-6" />,
                title: t('landing.feature_quality_title'),
                description: t('landing.feature_quality_desc'),
                gradient: "from-green-500 to-emerald-500"
              },
              {
                icon: <Download className="w-6 h-6" />,
                title: t('landing.feature_export_title'),
                description: t('landing.feature_export_desc'),
                gradient: "from-blue-500 to-indigo-500"
              },
              {
                icon: <Sparkles className="w-6 h-6" />,
                title: t('landing.feature_premium_title'),
                description: t('landing.feature_premium_desc'),
                gradient: "from-violet-500 to-purple-500"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="group p-6 rounded-lg border border-white/10 hover:border-primary/30 transition-all hover:-translate-y-1 bg-surface-2/50"
              >
                <div className={`w-12 h-12 rounded-md bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-unified-md group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative z-10 py-32 px-6 bg-surface-1/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t('landing.steps_title')}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('landing.steps_subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: t('landing.step_1_title'),
                description: t('landing.step_1_desc')
              },
              {
                step: "02",
                title: t('landing.step_2_title'),
                description: t('landing.step_2_desc')
              },
              {
                step: "03",
                title: t('landing.step_3_title'),
                description: t('landing.step_3_desc')
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-8xl font-bold text-foreground/5 absolute -top-8 left-0">
                  {item.step}
                </div>
                <div className="relative pt-12">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xl font-bold mb-4 shadow-glow-primary">
                    {index + 1}
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t('landing.pricing_title')}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('landing.pricing_subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Free */}
            <div className="p-8 rounded-lg border border-white/10 bg-surface-2/50">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">{t('landing.free_plan')}</h3>
                <p className="text-muted-foreground">{t('landing.free_for')}</p>
              </div>
              <div className="mb-6">
                <span className="text-5xl font-bold">{t('landing.free_price')}</span>
                <span className="text-muted-foreground">{t('landing.forever')}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  t('landing.free_feature_1'),
                  t('landing.free_feature_2'),
                  t('landing.free_feature_3'),
                  t('landing.free_feature_4')
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-foreground/80">{item}</span>
                  </li>
                ))}
              </ul>
              <a href={getEditorUrl()}>
                <Button className="w-full bg-white/10 hover:bg-white/20 text-foreground border-0 rounded-full">
                  {t('common.start_free')}
                </Button>
              </a>
            </div>

            {/* Premium */}
            <div className="p-8 rounded-lg border border-primary/30 relative overflow-hidden bg-surface-3/50">
              <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full text-xs font-medium">
                {t('landing.popular')}
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">{t('landing.premium_plan')}</h3>
                <p className="text-muted-foreground">{t('landing.premium_for')}</p>
              </div>
              <div className="mb-6">
                <span className="text-5xl font-bold">{t('landing.premium_price')}</span>
                <span className="text-muted-foreground">{t('landing.per_month')}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  t('landing.premium_feature_1'),
                  t('landing.premium_feature_2'),
                  t('landing.premium_feature_3'),
                  t('landing.premium_feature_4'),
                  t('landing.premium_feature_5')
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-primary" />
                    <span className="text-foreground/80">{item}</span>
                  </li>
                ))}
              </ul>
              <Button 
                className="w-full bg-brand-gradient text-white border-0 shadow-glow-brand rounded-full"
                onClick={() => openAuth('register')}
              >
                {t('landing.subscribe')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-xl border border-brand-pink/20 relative overflow-hidden bg-surface-3/80">
            <div className="absolute inset-0 bg-brand-gradient opacity-10" />
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                {t('landing.cta_title')}
              </h2>
              <p className="text-xl text-foreground/80 mb-8">
                {t('landing.cta_subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {user ? (
                  <Button 
                    size="lg"
                    className="bg-brand-gradient text-white border-0 shadow-glow-brand px-12 py-6 text-lg font-semibold rounded-full"
                    onClick={() => window.location.href = getEditorUrl()}
                  >
                    {t('common.open_editor')}
                  </Button>
                ) : (
                  <>
                    <Button 
                      size="lg"
                      className="bg-brand-gradient text-white border-0 shadow-glow-brand px-8 py-6 text-lg font-semibold rounded-full"
                      onClick={() => openAuth('register')}
                    >
                      {t('landing.create_account')}
                    </Button>
                    <a href={getEditorUrl()}>
                      <Button 
                        size="lg" 
                        variant="outline" 
                        className="border-white/30 bg-transparent hover:bg-white/10 text-foreground px-8 py-6 text-lg rounded-full"
                      >
                        {t('landing.try_without_reg')}
                      </Button>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer variant="full" />

      {/* Auth Modal */}
      <AuthModal 
        open={authOpen} 
        onOpenChange={setAuthOpen}
        defaultMode={authMode}
      />

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-500 { animation-delay: 500ms; }
      `}</style>
    </div>
  );
};

export default LandingPage;
