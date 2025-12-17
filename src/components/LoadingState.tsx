import { Search } from 'lucide-react';

const LoadingState = () => {
  return (
    <div className="animate-fade-in rounded-xl border border-border bg-card p-6 shadow-md transition-theme">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-full bg-primary/10 animate-pulse-soft">
          <Search className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="h-5 w-48 rounded-md animate-shimmer" />
          <div className="h-4 w-64 rounded-md animate-shimmer" />
        </div>
      </div>
    </div>
  );
};

export default LoadingState;
