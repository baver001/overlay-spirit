import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Languages className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-surface-1 border-border text-foreground">
        <DropdownMenuItem onClick={() => changeLanguage('en')} className="hover:bg-surface-3 focus:bg-surface-3 cursor-pointer">
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('ru')} className="hover:bg-surface-3 focus:bg-surface-3 cursor-pointer">
          Русский
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('ja')} className="hover:bg-surface-3 focus:bg-surface-3 cursor-pointer">
          日本語
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('pt')} className="hover:bg-surface-3 focus:bg-surface-3 cursor-pointer">
          Português
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;

