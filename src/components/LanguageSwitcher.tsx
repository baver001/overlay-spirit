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
        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
          <Languages className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
        <DropdownMenuItem onClick={() => changeLanguage('en')} className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer">
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('ru')} className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer">
          Русский
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('ja')} className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer">
          日本語
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('pt')} className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer">
          Português
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;

