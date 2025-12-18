import { memo } from 'react';
import { Search, Database, FileText } from 'lucide-react';

const LoadingState = memo(() => {
  return (
    <div className="animate-fade-in rounded-2xl border border-border bg-card p-6 md:p-8 shadow-lg transition-theme overflow-hidden relative">
      {/* Background shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer" />
      
      <div className="relative flex items-center gap-5">
        {/* Animated icon container */}
        <div className="relative">
          <div className="p-4 rounded-2xl bg-primary/10 animate-pulse-soft">
            <Search className="h-7 w-7 text-primary animate-bounce" style={{ animationDuration: '1.5s' }} />
          </div>
          {/* Orbital dots */}
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary/50 animate-ping" />
        </div>
        
        {/* Content skeleton */}
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <div className="h-5 w-48 rounded-lg animate-shimmer" />
            <div className="h-4 w-72 rounded-lg animate-shimmer animation-delay-200" />
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-primary/40 via-primary to-primary/40 animate-shimmer" />
            </div>
            <span className="text-xs text-muted-foreground animate-pulse-soft">Searching...</span>
          </div>
        </div>
      </div>
      
      {/* Skeleton result cards preview */}
      <div className="mt-6 pt-6 border-t border-border/50 grid gap-4">
        {[1, 2, 3].map((i) => (
          <div 
            key={i} 
            className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 animate-fade-in opacity-0"
            style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'forwards' }}
          >
            <div className="p-2 rounded-lg bg-muted animate-shimmer">
              <FileText className="h-5 w-5 text-transparent" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded animate-shimmer" style={{ animationDelay: `${i * 50}ms` }} />
              <div className="h-3 w-1/2 rounded animate-shimmer" style={{ animationDelay: `${i * 100}ms` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

LoadingState.displayName = 'LoadingState';

export default LoadingState;
