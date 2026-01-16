import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface FooterProps {
  className?: string;
  variant?: 'minimal' | 'full';
}

const Footer: React.FC<FooterProps> = ({ className, variant = 'minimal' }) => {
  const { t } = useTranslation();

  if (variant === 'minimal') {
    return (
      <footer className={cn("border-t border-border bg-surface-1/50 backdrop-blur-unified-md", className)}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Loverlay by LevelUP</span>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="hover:text-foreground transition-colors">{t('common.privacy')}</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">{t('common.terms')}</Link>
              <a href="mailto:support@loverlay.com" className="hover:text-foreground transition-colors">{t('common.support')}</a>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // Full variant for landing pages
  return (
    <footer className={cn("border-t border-white/5 py-12 px-6 bg-surface-0/90", className)}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img 
              src="/assets/logo_white.svg" 
              alt="Loverlay" 
              className="h-6 w-auto"
            />
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">{t('common.privacy')}</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">{t('common.terms')}</Link>
            <Link to="/refunds" className="hover:text-foreground transition-colors">{t('common.refunds')}</Link>
            <a href="mailto:support@loverlay.com" className="hover:text-foreground transition-colors">{t('common.support')}</a>
          </div>
          <p className="text-sm text-muted-foreground/60">
            © {new Date().getFullYear()} Loverlay by LevelUP. {t('common.rights_reserved')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
