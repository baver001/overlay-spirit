import React from 'react';
import { Camera } from 'lucide-react';

const Header: React.FC = React.memo(() => {
  return (
    <header className="flex items-center p-4 border-b border-border fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-sm z-20">
      <Camera className="w-6 h-6 mr-3 text-primary" />
      <h1 className="text-xl font-bold text-foreground">Photo Editor</h1>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
