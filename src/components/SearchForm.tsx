import { useState } from 'react';
import { Search, FileText, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SearchFormProps {
  onSearch: (title: string, author: string) => void;
  isLoading: boolean;
}

const SearchForm = ({ onSearch, isLoading }: SearchFormProps) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && author.trim()) {
      onSearch(title.trim(), author.trim());
    }
  };

  const isValid = title.trim().length > 0 && author.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium text-foreground flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Paper Title
        </Label>
        <Input
          id="title"
          type="text"
          placeholder="Enter the paper title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-12 bg-background border-input focus:border-primary focus:ring-primary/20 transition-theme"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="author" className="text-sm font-medium text-foreground flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          Author Name
        </Label>
        <Input
          id="author"
          type="text"
          placeholder="Enter the author's name..."
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="h-12 bg-background border-input focus:border-primary focus:ring-primary/20 transition-theme"
          disabled={isLoading}
        />
      </div>

      <Button
        type="submit"
        disabled={!isValid || isLoading}
        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-theme shadow-md hover:shadow-glow"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Searching...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search Paper
          </span>
        )}
      </Button>
    </form>
  );
};

export default SearchForm;
