import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useNavigate } from 'react-router-dom';

const RefundsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <Button 
            variant="ghost" 
            className="pl-0 hover:bg-transparent text-zinc-400 hover:text-white"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back_to_home')}
          </Button>
          <LanguageSwitcher />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
          {t('refunds_page.title')}
        </h1>
        <p className="text-zinc-400 mb-12">{t('refunds_page.last_updated')}</p>

        <p className="text-xl text-zinc-200 mb-12 font-light">
          {t('refunds_page.intro')}
        </p>

        <div className="space-y-12 text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('refunds_page.conditions.title')}</h2>
            <div className="whitespace-pre-line">{t('refunds_page.conditions.text')}</div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('refunds_page.how_to.title')}</h2>
            <p>{t('refunds_page.how_to.text')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('refunds_page.non_refundable.title')}</h2>
            <p>{t('refunds_page.non_refundable.text')}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RefundsPage;

