import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

const Header = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="w-full border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50 transition-theme">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="/Saveetha_Institute_of_Medical_And_Technical_Sciences_Logo.png" 
            alt="SIMATS Logo" 
            className="h-12 w-auto object-contain"
          />
          <div>
            <h1 className="font-heading text-xl font-semibold text-foreground">
            SIMATS Engineering College
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full hover:bg-accent transition-theme"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5 text-foreground" />
          ) : (
            <Sun className="h-5 w-5 text-foreground" />
          )}
        </Button>
      </div>
    </header>
  );
};

export default Header;
