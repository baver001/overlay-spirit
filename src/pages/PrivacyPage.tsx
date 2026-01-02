import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useNavigate } from 'react-router-dom';

const PrivacyPage: React.FC = () => {
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
          {t('privacy_page.title')}
        </h1>
        <p className="text-zinc-400 mb-8">{t('privacy_page.last_updated')}</p>
        
        <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 mb-12">
          <p className="text-zinc-200 font-medium mb-2">{t('privacy_page.operator')}</p>
          <p className="text-zinc-400">{t('privacy_page.contact')}</p>
        </div>

        <div className="space-y-12 text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('privacy_page.sections.collection.title')}</h2>
            <p>{t('privacy_page.sections.collection.text')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('privacy_page.sections.usage.title')}</h2>
            <p>{t('privacy_page.sections.usage.text')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('privacy_page.sections.sharing.title')}</h2>
            <p>{t('privacy_page.sections.sharing.text')}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;

