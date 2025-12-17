import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Header from '@/components/Header';
import SearchForm, { SearchFilters } from '@/components/SearchForm';
import ResultCard from '@/components/ResultCard';
import DataTable from '@/components/DataTable';
import LoadingState from '@/components/LoadingState';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // AbortController for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check backend availability
  useEffect(() => {
    const checkBackend = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
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
    
    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    setIsLoading(true);
    setSearchFilters(filters);
    setSearchResults(null);

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
      
      // Only update state if request wasn't aborted
      if (!abortController.signal.aborted) {
        setSearchResults(data);
        setBackendAvailable(true);
      }
    } catch (error) {
      // Ignore abort errors
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

  // Fetch function for DataTable (server-side pagination) with request cancellation
  const fetchTableData = useCallback(async (page: number, limit: number, signal?: AbortSignal) => {
    const hasFilters = Object.values(searchFilters).some(v => v !== undefined && v !== '');
    
    try {
      if (hasFilters) {
        // Use search endpoint with pagination
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
        // Use papers endpoint with pagination
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
      // Re-throw if not an abort error
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      throw error;
    }
  }, [searchFilters]);

  // Create a stable key that changes when filters change
  const filterKey = useMemo(() => JSON.stringify(searchFilters), [searchFilters]);

  const hasActiveFilters = Object.values(searchFilters).some(v => v !== undefined && v !== '');

  return (
    <div className="min-h-screen bg-background transition-theme">
      <Header />
      
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
          {/* Backend Status Alert */}
          {!backendAvailable && (
            <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                Backend server is not available. Please start the backend server for full functionality.
              </AlertDescription>
            </Alert>
          )}

          {/* Hero Section */}
          <div className="text-center space-y-3 md:space-y-4 mb-4 md:mb-8">
            <div className="inline-flex items-center justify-center mb-3 md:mb-4">
              <img 
                src="/Saveetha_Institute_of_Medical_And_Technical_Sciences_Logo.png" 
                alt="SIMATS Logo" 
                className="h-16 w-auto md:h-24 object-contain"
              />
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground px-2">
            SIMATS Engineering College
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              Search and filter retracted research papers from Saveetha School of Engineering.
            </p>
            {backendAvailable && totalCount > 0 && (
              <p className="text-xs sm:text-sm text-muted-foreground">
                {totalCount.toLocaleString()} papers in database
              </p>
            )}
          </div>

          {/* Search Card */}
          <div className="bg-card rounded-xl md:rounded-2xl border border-border p-4 sm:p-6 md:p-8 shadow-lg transition-theme">
            <SearchForm onSearch={handleSearch} isLoading={isLoading} />
          </div>

          {/* Search Results Section */}
          {isLoading && <LoadingState />}
          
          {!isLoading && searchResults && hasActiveFilters && searchResults.results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-foreground">
                  Search Results
                </h2>
                <span className="text-sm text-muted-foreground">
                  Found {searchResults.count.toLocaleString()} paper{searchResults.count !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid gap-4">
                {searchResults.results.slice(0, 5).map((paper) => (
                  <ResultCard key={paper['Record ID']} paper={paper} />
                ))}
              </div>
              {searchResults.count > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  Showing first 5 results. Use the table below to see all {searchResults.count.toLocaleString()} results.
                </p>
              )}
            </div>
          )}

          {!isLoading && searchResults && hasActiveFilters && searchResults.results.length === 0 && (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <p className="text-muted-foreground">
                No papers found matching your search criteria.
              </p>
            </div>
          )}

          {/* Data Table Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-2xl font-semibold text-foreground">
                {hasActiveFilters ? 'Filtered Results' : 'All Papers'}
              </h2>
            </div>

            {backendAvailable ? (
              <DataTable 
                key={filterKey}
                fetchData={fetchTableData}
                itemsPerPage={100}
                hasFilters={hasActiveFilters}
              />
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <p className="text-muted-foreground">
                  Please start the backend server to view data.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-6 mt-auto transition-theme">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>SIMATS Engineering College • SIMATS Paper Retraction Database</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
