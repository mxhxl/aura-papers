import { useState } from 'react';
import Header from '@/components/Header';
import SearchForm from '@/components/SearchForm';
import ResultCard from '@/components/ResultCard';
import LoadingState from '@/components/LoadingState';
import { checkPaperExistence, SearchResult } from '@/lib/mockData';
import { BookOpen } from 'lucide-react';

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [searchedTitle, setSearchedTitle] = useState('');
  const [searchedAuthor, setSearchedAuthor] = useState('');

  const handleSearch = async (title: string, author: string) => {
    setIsLoading(true);
    setResult(null);
    setSearchedTitle(title);
    setSearchedAuthor(author);

    try {
      const searchResult = await checkPaperExistence(title, author);
      setResult(searchResult);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background transition-theme">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-accent/50 mb-4">
              <BookOpen className="h-10 w-10 text-primary" />
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground">
              Research Paper Search
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              Check if a research paper already exists in our database before starting your work.
            </p>
          </div>

          {/* Search Card */}
          <div className="bg-card rounded-2xl border border-border p-8 shadow-lg transition-theme">
            <SearchForm onSearch={handleSearch} isLoading={isLoading} />
          </div>

          {/* Results Section */}
          {isLoading && <LoadingState />}
          
          {!isLoading && result && (
            <ResultCard 
              result={result} 
              searchedTitle={searchedTitle}
              searchedAuthor={searchedAuthor}
            />
          )}

          {/* Sample Papers Hint */}
          {!result && !isLoading && (
            <div className="text-center text-sm text-muted-foreground">
              <p className="mb-2">Try searching for existing papers:</p>
              <p className="font-medium text-foreground/70">
                "AI Ethics" by Jane Doe • "Quantum Computing Basics" by Alice Johnson
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-6 mt-auto transition-theme">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Research Paper Search Interface • Built with React & Tailwind CSS</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
