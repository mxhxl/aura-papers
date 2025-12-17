import { Moon, Sun, FileSpreadsheet } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

const Header = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="w-full border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50 transition-theme">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-semibold text-foreground">
              CSV Data Viewer
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              View large datasets with ease
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
