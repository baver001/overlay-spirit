import React from 'react';

const Footer: React.FC = () => {
  const buildInfo = window.__BUILD_INFO__ || {
    version: 'dev',
    buildDate: new Date().toISOString(),
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Moscow',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <footer className="border-t border-border bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>© {new Date().getFullYear()} Loverlay</span>
          </div>
          <div className="flex items-center gap-4">
            <span>v{buildInfo.version}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Деплой: {formatDate(buildInfo.buildDate)}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

