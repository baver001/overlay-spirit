import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, Zap, Package, Calendar, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useNavigate } from 'react-router-dom';

const PricingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-0 text-foreground p-6 md:p-12 bg-dots">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <Button 
            variant="ghost" 
            className="pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back_to_home')}
          </Button>
          <LanguageSwitcher />
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/80 to-foreground/50">
            {t('pricing_page.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('pricing_page.subtitle')}
          </p>
        </div>

        {/* Free Weekly Highlight */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-white/10 rounded-lg p-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-slow" />
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-md">
                  <Zap className="h-8 w-8 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">{t('pricing_page.free_weekly.title')}</h3>
                  <p className="text-muted-foreground">{t('pricing_page.free_weekly.description')}</p>
                </div>
              </div>
              <div className="bg-white/5 px-4 py-2 rounded-full border border-white/10">
                <span className="text-sm font-medium text-foreground/80">
                  {t('pricing_page.free_weekly.availability')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* Single Pack Card */}
          <div className="bg-surface-1/50 border border-border rounded-xl p-8 flex flex-col hover:border-border/80 transition-all duration-slow">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-medium text-foreground/80">{t('pricing_page.packs_section.title')}</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-foreground">{t('pricing_page.packs_section.price_discount')}</span>
                <span className="text-xl text-muted-foreground line-through">{t('pricing_page.packs_section.price_original')}</span>
                <span className="text-muted-foreground">{t('pricing_page.packs_section.per_pack')}</span>
              </div>
            </div>

            <div className="space-y-4 flex-grow mb-8">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-foreground shrink-0" />
                <span className="text-foreground/80">{t('pricing_page.packs_section.features.lifetime')}</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-foreground shrink-0" />
                <span className="text-foreground/80">{t('pricing_page.packs_section.features.free_overlays')}</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-foreground shrink-0" />
                <span className="text-foreground/80">{t('pricing_page.packs_section.features.commercial')}</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-foreground shrink-0" />
                <span className="text-foreground/80">{t('pricing_page.packs_section.features.high_res')}</span>
              </div>
            </div>

            <Button className="w-full bg-brand-gradient text-white border-0 shadow-glow-brand rounded-full" size="lg">
              {t('pricing_page.packs_section.cta')}
            </Button>
          </div>

          {/* Subscription Card */}
          <div className="bg-surface-1 border border-white/20 rounded-xl p-8 flex flex-col relative overflow-hidden hover:border-white/30 transition-all duration-slow shadow-unified-xl">
            <div className="absolute top-0 right-0 p-4">
              <Star className="h-6 w-6 text-purple-400 fill-purple-400/20" />
            </div>
            
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-purple-400" />
                <h3 className="text-lg font-medium text-purple-300">{t('pricing_page.subscription_section.title')}</h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-foreground">{t('pricing_page.subscription_section.monthly_price')}</span>
                  <span className="text-muted-foreground">{t('pricing_page.subscription_section.monthly_period')}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground/80">{t('pricing_page.subscription_section.yearly_price')}</span>
                  <span className="text-muted-foreground">{t('pricing_page.subscription_section.yearly_period')}</span>
                  <span className="text-xs font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                    {t('pricing_page.subscription_section.yearly_save')}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 flex-grow mb-8">
              <div className="flex items-start gap-3">
                <div className="bg-purple-500/20 p-1 rounded-full">
                  <Check className="h-3 w-3 text-purple-400 shrink-0" />
                </div>
                <span className="text-foreground/90">{t('pricing_page.subscription_section.features.all_access')}</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-purple-500/20 p-1 rounded-full">
                  <Check className="h-3 w-3 text-purple-400 shrink-0" />
                </div>
                <span className="text-foreground/90">{t('pricing_page.subscription_section.features.weekly_updates')}</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-purple-500/20 p-1 rounded-full">
                  <Check className="h-3 w-3 text-purple-400 shrink-0" />
                </div>
                <span className="text-foreground/90">{t('pricing_page.subscription_section.features.priority_support')}</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-purple-500/20 p-1 rounded-full">
                  <Check className="h-3 w-3 text-purple-400 shrink-0" />
                </div>
                <span className="text-foreground/90">{t('pricing_page.subscription_section.features.cancel_anytime')}</span>
              </div>
            </div>

            <Button className="w-full bg-brand-gradient text-white border-0 shadow-glow-brand rounded-full" size="lg">
              {t('pricing_page.subscription_section.cta')}
            </Button>
            
            <p className="text-center text-xs text-muted-foreground mt-4">
              {t('pricing_page.billing_secure')}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PricingPage;

