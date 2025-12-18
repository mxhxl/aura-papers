import { memo } from 'react';
import { Moon, Sun, Database, Github } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const Header = memo(() => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="w-full border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-50 transition-theme">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg group-hover:blur-xl transition-all opacity-0 group-hover:opacity-100" />
              <img 
                src="/Saveetha_Institute_of_Medical_And_Technical_Sciences_Logo.png" 
                alt="SIMATS Logo" 
                className="h-10 w-auto object-contain relative z-10 transition-transform group-hover:scale-105"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-heading text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                SIMATS Engineering College
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Database className="h-3 w-3" />
                Paper Retraction Database
              </p>
            </div>
          </a>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full hover:bg-accent transition-all hover:scale-105"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <Moon className="h-5 w-5 text-foreground transition-transform hover:rotate-12" />
                ) : (
                  <Sun className="h-5 w-5 text-foreground transition-transform hover:rotate-45" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle {theme === 'light' ? 'dark' : 'light'} mode</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
