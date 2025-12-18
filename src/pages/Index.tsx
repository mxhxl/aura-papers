import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Header from '@/components/Header';
import SearchForm, { SearchFilters } from '@/components/SearchForm';
import ResultCard from '@/components/ResultCard';
import DataTable from '@/components/DataTable';
import LoadingState from '@/components/LoadingState';
import { AlertCircle, Database, FileText, Building2, Calendar, TrendingUp, ChevronDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export interface RetractionPaper {
  'Record ID': string;
  Title: string;
  Subject: string;
  Institution: string;
  Journal: string;
  Publisher: string;
  Country: string;
  Author: string;
  URLS: string;
  ArticleType: string;
  RetractionDate: string;
  RetractionDOI: string;
  RetractionPubMedID: string;
  OriginalPaperDate: string;
  OriginalPaperDOI: string;
  OriginalPaperPubMedID: string;
  RetractionNature: string;
  Reason: string;
  Paywalled: string;
  Notes: string;
}

interface SearchResponse {
  count: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  results: RetractionPaper[];
}

// Stats card component
interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  delay?: number;
}

const StatsCard = ({ icon, label, value, subtext, trend, delay = 0 }: StatsCardProps) => (
  <div 
    className="stats-card animate-fade-in-up opacity-0"
    style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
  >
    <div className="flex items-start justify-between">
      <div className="p-2 rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      {trend && (
        <TrendingUp className={`h-4 w-4 ${trend === 'up' ? 'text-red-500' : trend === 'down' ? 'text-green-500' : 'text-muted-foreground'}`} />
      )}
    </div>
    <div className="mt-3">
      <p className="text-2xl font-bold text-foreground font-heading">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {subtext && (
        <p className="text-xs text-muted-foreground/70 mt-1">{subtext}</p>
      )}
    </div>
  </div>
);

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [showResults, setShowResults] = useState(false);
  
  // AbortController for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Check backend availability
  useEffect(() => {
    const checkBackend = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        const response = await fetch('http://localhost:3000/api/health', {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (response.ok) {
          const data = await response.json();
          setTotalCount(data.papersLoaded || 0);
          setBackendAvailable(true);
        } else {
          setBackendAvailable(false);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name !== 'AbortError') {
          setBackendAvailable(false);
        }
      }
    };
    checkBackend();
  }, []);

  const handleSearch = async (filters: SearchFilters) => {
    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    setIsLoading(true);
    setSearchFilters(filters);
    setSearchResults(null);
    setShowResults(true);

    try {
      const response = await fetch('http://localhost:3000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...filters,
          page: 1,
          limit: 20
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResponse = await response.json();
      
      if (!abortController.signal.aborted) {
        setSearchResults(data);
        setBackendAvailable(true);
        
        // Scroll to results
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Search failed:', error);
      if (!abortController.signal.aborted) {
        setBackendAvailable(false);
        setSearchResults({ count: 0, results: [] });
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  // Fetch function for DataTable
  const fetchTableData = useCallback(async (page: number, limit: number, signal?: AbortSignal) => {
    const hasFilters = Object.values(searchFilters).some(v => v !== undefined && v !== '');
    
    try {
      if (hasFilters) {
        const response = await fetch('http://localhost:3000/api/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...searchFilters,
            page,
            limit
          }),
          signal
        });

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const data: SearchResponse = await response.json();
        return {
          results: data.results,
          count: data.count,
          page: data.page || page,
          limit: data.limit || limit,
          totalPages: data.totalPages || Math.ceil(data.count / limit)
        };
      } else {
        const response = await fetch(`http://localhost:3000/api/papers?page=${page}&limit=${limit}`, {
          signal
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const data: SearchResponse = await response.json();
        return {
          results: data.results,
          count: data.count,
          page: data.page || page,
          limit: data.limit || limit,
          totalPages: data.totalPages || Math.ceil(data.count / limit)
        };
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      throw error;
    }
  }, [searchFilters]);

  const filterKey = useMemo(() => JSON.stringify(searchFilters), [searchFilters]);
  const hasActiveFilters = Object.values(searchFilters).some(v => v !== undefined && v !== '');

  return (
    <div className="min-h-screen bg-background transition-theme">
      {/* Background gradient mesh */}
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" />
      
      <Header />
      
      <main className="relative container mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-10">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          {/* Backend Status Alert */}
          {!backendAvailable && (
            <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 animate-fade-in">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                Backend server is not available. Please start the backend server for full functionality.
              </AlertDescription>
            </Alert>
          )}

          {/* Hero Section */}
          <div className="text-center space-y-4 mb-6 md:mb-10">
            <div className="inline-flex items-center justify-center mb-4 animate-fade-in">
              <div className="p-1 rounded-2xl bg-gradient-to-br from-primary/20 to-emerald-500/20 animate-glow">
                <img 
                  src="/Saveetha_Institute_of_Medical_And_Technical_Sciences_Logo.png" 
                  alt="SIMATS Logo" 
                  className="h-20 w-auto md:h-28 object-contain rounded-xl"
                />
              </div>
            </div>
            
            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground px-2 animate-fade-in-up opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
              SIMATS Engineering College
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4 animate-fade-in-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
              Comprehensive database for exploring retracted research papers from Saveetha School of Engineering
            </p>

            {/* Quick Stats */}
            {backendAvailable && totalCount > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-3xl mx-auto pt-4">
                <StatsCard
                  icon={<Database className="h-5 w-5" />}
                  label="Total Papers"
                  value={totalCount}
                  delay={300}
                />
                <StatsCard
                  icon={<FileText className="h-5 w-5" />}
                  label="Searchable Fields"
                  value={16}
                  subtext="Author, Title, DOI..."
                  delay={400}
                />
                <StatsCard
                  icon={<Building2 className="h-5 w-5" />}
                  label="Institutions"
                  value="100+"
                  delay={500}
                />
                <StatsCard
                  icon={<Calendar className="h-5 w-5" />}
                  label="Years Covered"
                  value="2010-2024"
                  delay={600}
                />
              </div>
            )}
          </div>

          {/* Search Card */}
          <div className="glass-card rounded-2xl md:rounded-3xl p-5 sm:p-6 md:p-8 shadow-xl animate-fade-in-up opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Search Papers</h2>
                <p className="text-sm text-muted-foreground">Filter by author, title, institution, dates, and more</p>
              </div>
            </div>
            <SearchForm onSearch={handleSearch} isLoading={isLoading} />
          </div>

          {/* Results Section */}
          <div ref={resultsRef} className="scroll-mt-20">
            {/* Loading State */}
            {isLoading && <LoadingState />}
            
            {/* Search Results Cards */}
            {!isLoading && searchResults && hasActiveFilters && searchResults.results.length > 0 && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl md:text-2xl font-semibold text-foreground font-heading">
                      Search Results
                    </h2>
                    <Badge variant="secondary" className="text-sm font-medium">
                      {searchResults.count.toLocaleString()} paper{searchResults.count !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  {hasActiveFilters && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {Object.entries(searchFilters).filter(([, v]) => v).slice(0, 3).map(([key, value]) => (
                        <Badge key={key} variant="outline" className="text-xs">
                          {key}: {String(value).substring(0, 20)}{String(value).length > 20 ? '...' : ''}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-4">
                  {searchResults.results.slice(0, 5).map((paper, index) => (
                    <div 
                      key={paper['Record ID']} 
                      className="animate-fade-in-up opacity-0"
                      style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
                    >
                      <ResultCard paper={paper} />
                    </div>
                  ))}
                </div>
                
                {searchResults.count > 5 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      Showing first 5 of {searchResults.count.toLocaleString()} results
                    </p>
                    <button 
                      onClick={() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })}
                      className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium"
                    >
                      <ChevronDown className="h-4 w-4 animate-bounce" />
                      View all in table below
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* No Results */}
            {!isLoading && searchResults && hasActiveFilters && searchResults.results.length === 0 && (
              <div className="text-center py-16 bg-card rounded-2xl border border-border animate-fade-in">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No papers found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  No papers match your search criteria. Try adjusting your filters or using different keywords.
                </p>
              </div>
            )}
          </div>

          {/* Data Table Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground font-heading">
                  {hasActiveFilters ? 'Filtered Results' : 'All Papers'}
                </h2>
                {hasActiveFilters && (
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    Filtered
                  </Badge>
                )}
              </div>
            </div>

            {backendAvailable ? (
              <div className="animate-fade-in">
                <DataTable 
                  key={filterKey}
                  fetchData={fetchTableData}
                  itemsPerPage={100}
                  hasFilters={hasActiveFilters}
                />
              </div>
            ) : (
              <div className="text-center py-16 bg-card rounded-2xl border border-border">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Database className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Backend Unavailable</h3>
                <p className="text-muted-foreground">
                  Please start the backend server to view data.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-border bg-card/50 backdrop-blur-sm py-8 mt-auto transition-theme">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img 
                src="/Saveetha_Institute_of_Medical_And_Technical_Sciences_Logo.png" 
                alt="SIMATS Logo" 
                className="h-8 w-auto object-contain opacity-70"
              />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">SIMATS Engineering College</p>
                <p className="text-xs">Paper Retraction Database</p>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground/70 text-center md:text-right">
              <p>Data sourced from Retraction Watch Database</p>
              <p>© {new Date().getFullYear()} SIMATS. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
