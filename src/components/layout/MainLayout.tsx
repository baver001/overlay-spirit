import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '@/components/Header';

const MainLayout: React.FC = () => {
  const location = useLocation();
  const isEditorRoute = location.pathname.startsWith('/editor');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className={isEditorRoute ? '' : 'pt-20'}>
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
