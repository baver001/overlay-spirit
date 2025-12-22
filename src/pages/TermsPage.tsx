import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useNavigate, Link } from 'react-router-dom';

const TermsPage: React.FC = () => {
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
            Back to Home
          </Button>
          <LanguageSwitcher />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
          {t('terms_page.title')}
        </h1>
        <p className="text-zinc-400 mb-8">{t('terms_page.last_updated')}</p>

        {/* Legal Header */}
        <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 mb-12">
          <h3 className="text-xl font-semibold text-white mb-2">{t('legal.company_name')}</h3>
          <p className="text-zinc-300 mb-4">{t('legal.intro_text')}</p>
          <div className="text-sm text-zinc-400">
             <p>{t('legal.product_desc')}</p>
          </div>
        </div>

        <div className="space-y-12 text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('terms_page.sections.intro.title')}</h2>
            <p>{t('terms_page.sections.intro.text')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('terms_page.sections.license.title')}</h2>
            <p>{t('terms_page.sections.license.text')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('terms_page.sections.restrictions.title')}</h2>
            <p>{t('terms_page.sections.restrictions.text')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">{t('terms_page.sections.links.title')}</h2>
            <p className="mb-4">{t('terms_page.sections.links.text')}</p>
            <div className="flex flex-col gap-2">
              <Link to="/privacy" className="text-blue-400 hover:text-blue-300 underline">
                {t('terms_page.sections.links.privacy_link')}
              </Link>
              <Link to="/refunds" className="text-blue-400 hover:text-blue-300 underline">
                {t('terms_page.sections.links.refund_link')}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;

