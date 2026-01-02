import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { isSuperAdmin } from '@/lib/auth';

const Footer: React.FC<FooterProps> = ({ className }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isSuperuser = isSuperAdmin(user?.email);
  
  const buildInfo = window.__BUILD_INFO__ || {
    version: 'dev',
    buildDate: new Date().toISOString(),
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const locales: Record<string, string> = {
        'ru': 'ru-RU',
        'ja': 'ja-JP',
        'pt': 'pt-PT',
        'en': 'en-US'
      };
      const locale = locales[i18n.language] || 'en-US';
      
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        // Use browser timezone or keep it Moscow if intended? Assuming user's timezone is better.
      }).format(date);
    } catch {
      return dateString;
    }
  };

  // Футер виден только суперюзеру
  if (!isSuperuser) {
    return null;
  }

  return (
    <footer className={cn("border-t border-border bg-background/50 backdrop-blur-sm", className)}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>© {new Date().getFullYear()} Loverlay</span>
          </div>
          <div className="flex items-center gap-4">
            <span>v{buildInfo.version}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">{t('editor.deploy')}: {formatDate(buildInfo.buildDate)}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
