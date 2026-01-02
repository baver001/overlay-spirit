import React, { useState } from 'react';
import { LogIn, LogOut, UserCircle2, Settings, Shield, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from './AuthModal';
import InstructionsModal from './InstructionsModal';
import { Button } from './ui/button';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { isSuperAdmin } from '@/lib/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const Header: React.FC = React.memo(() => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [authOpen, setAuthOpen] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  const isSuper = isSuperAdmin(user?.email);

  return (
    <>
      <header className="flex items-center p-4 border-b border-border fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-sm z-20 h-[60px]">
        <a href="https://loverlay.com" className="flex items-center gap-3">
          <img src="/assets/logo_white.svg" alt="Loverlay" className="h-6" />
        </a>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          
          {/* Кнопка инструкции */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setInstructionsOpen(true)}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            title={t('editor.instructions_title')}
          >
            <Info className="w-4 h-4" />
          </Button>
          
          {user ? (
            <>
              {/* User Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                    <UserCircle2 className="w-4 h-4" />
                    <span className="hidden sm:inline max-w-[150px] truncate">{user.email}</span>
                    {isSuper && <Shield className="w-3 h-3 text-violet-400" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {/* Личный кабинет - для всех пользователей */}
                  <DropdownMenuItem asChild>
                    <a href="/account" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="w-4 h-4" />
                      {t('common.my_account')}
                    </a>
                  </DropdownMenuItem>
                  
                  {/* Админ-панель - только для суперадмина */}
                  {isSuper && (
                    <DropdownMenuItem asChild>
                      <a href="/admin" className="flex items-center gap-2 cursor-pointer text-violet-400">
                        <Shield className="w-4 h-4" />
                        {t('common.admin_panel')}
                      </a>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={() => logout()}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('common.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setAuthOpen(true)} 
              className="gap-2"
            >
              <LogIn className="w-4 h-4" /> 
              {t('common.login')}
            </Button>
          )}
        </div>
      </header>
      
      {/* Spacer for fixed header */}
      <div className="h-[60px]" />

      <AuthModal 
        open={authOpen} 
        onOpenChange={setAuthOpen} 
      />
      
      <InstructionsModal
        open={instructionsOpen}
        onOpenChange={setInstructionsOpen}
      />
    </>
  );
});

Header.displayName = 'Header';

export default Header;
