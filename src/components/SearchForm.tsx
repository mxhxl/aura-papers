import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export interface SearchFilters {
  author?: string;
  title?: string;
  articleType?: string;
  country?: string;
  journal?: string;
  publisher?: string;
  affiliation?: string;
  institution?: string;
  originalPaperFromDate?: string;
  originalPaperToDate?: string;
  originalPaperPubMedID?: string;
  originalPaperDOI?: string;
  retractionFromDate?: string;
  retractionToDate?: string;
  retractionPubMedID?: string;
  retractionDOI?: string;
}

interface SearchFormProps {
  onSearch: (filters: SearchFilters) => void;
  isLoading: boolean;
}

const SearchForm = ({ onSearch, isLoading }: SearchFormProps) => {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [options, setOptions] = useState<{
    articleTypes: string[];
    countries: string[];
    journals: string[];
    publishers: string[];
  }>({
    articleTypes: [],
    countries: [],
    journals: [],
    publishers: []
  });
  
  // Cache options in localStorage
  const optionsCacheKey = 'retraction_options_cache';
  const optionsCacheTimeKey = 'retraction_options_cache_time';
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Load dropdown options with caching
  useEffect(() => {
    const loadOptions = async () => {
      try {
        // Check cache first
        const cachedData = localStorage.getItem(optionsCacheKey);
        const cacheTime = localStorage.getItem(optionsCacheTimeKey);
        
        if (cachedData && cacheTime) {
          const age = Date.now() - parseInt(cacheTime);
          if (age < CACHE_TTL) {
            setOptions(JSON.parse(cachedData));
            return;
          }
        }

        // Fetch fresh data
        const response = await fetch('http://localhost:3000/api/options');
        if (!response.ok) throw new Error('Failed to fetch options');
        const data = await response.json();
        
        // Cache the data
        localStorage.setItem(optionsCacheKey, JSON.stringify(data));
        localStorage.setItem(optionsCacheTimeKey, Date.now().toString());
        
        setOptions(data);
      } catch (err) {
        console.error('Failed to load options:', err);
        // Try to use cached data even if expired
        const cachedData = localStorage.getItem(optionsCacheKey);
        if (cachedData) {
          setOptions(JSON.parse(cachedData));
        } else {
          setOptions({
            articleTypes: [],
            countries: [],
            journals: [],
            publishers: []
          });
        }
      }
    };
    
    loadOptions();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  const handleClear = () => {
    setFilters({});
    onSearch({});
  };

  // Debounced filter updates for text inputs (not for selects/dates)
  const updateFilter = useCallback((key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  }, []);

  // For text inputs, we don't need debouncing since search only happens on submit
  // But we can optimize by not triggering re-renders unnecessarily
  const handleTextInputChange = useCallback((key: keyof SearchFilters) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      updateFilter(key, e.target.value);
    };
  }, [updateFilter]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Left Column - Search Criteria */}
        <div className="space-y-3 md:space-y-4">
          <h3 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4">Search Criteria</h3>
          
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="author" className="text-xs md:text-sm font-medium">
              Author(s):
            </Label>
            <Input
              id="author"
              type="text"
              placeholder="Type to search"
              value={filters.author || ''}
              onChange={handleTextInputChange('author')}
              className="h-9 md:h-10 text-sm md:text-base"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="title" className="text-xs md:text-sm font-medium">
              Title:
            </Label>
            <Input
              id="title"
              type="text"
              placeholder="Type to search"
              value={filters.title || ''}
              onChange={handleTextInputChange('title')}
              className="h-9 md:h-10 text-sm md:text-base"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="articleType" className="text-xs md:text-sm font-medium">
              Article Type(s):
            </Label>
            <Select
              value={filters.articleType || undefined}
              onValueChange={(value) => updateFilter('articleType', value)}
              disabled={isLoading}
            >
              <SelectTrigger className="h-9 md:h-10 text-sm md:text-base">
                <SelectValue placeholder="Select article type" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                {options.articleTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="country" className="text-xs md:text-sm font-medium">
              Country(s):
            </Label>
            <Select
              value={filters.country || undefined}
              onValueChange={(value) => updateFilter('country', value)}
              disabled={isLoading}
            >
              <SelectTrigger className="h-9 md:h-10 text-sm md:text-base">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                {options.countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="journal" className="text-xs md:text-sm font-medium">
              Journal:
            </Label>
            <Select
              value={filters.journal || undefined}
              onValueChange={(value) => updateFilter('journal', value)}
              disabled={isLoading}
            >
              <SelectTrigger className="h-9 md:h-10 text-sm md:text-base">
                <SelectValue placeholder="Select journal" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                {options.journals.map((journal) => (
                  <SelectItem key={journal} value={journal}>
                    {journal}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="publisher" className="text-xs md:text-sm font-medium">
              Publisher:
            </Label>
            <Select
              value={filters.publisher || undefined}
              onValueChange={(value) => updateFilter('publisher', value)}
              disabled={isLoading}
            >
              <SelectTrigger className="h-9 md:h-10 text-sm md:text-base">
                <SelectValue placeholder="Select publisher" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                {options.publishers.map((publisher) => (
                  <SelectItem key={publisher} value={publisher}>
                    {publisher}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="affiliation" className="text-xs md:text-sm font-medium">
              Affiliation(s):
            </Label>
            <Input
              id="affiliation"
              type="text"
              placeholder="Type to search"
              value={filters.affiliation || ''}
              onChange={handleTextInputChange('affiliation')}
              className="h-9 md:h-10 text-sm md:text-base"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="institution" className="text-xs md:text-sm font-medium">
              Institution:
            </Label>
            <Input
              id="institution"
              type="text"
              placeholder="Type to search"
              value={filters.institution || ''}
              onChange={handleTextInputChange('institution')}
              className="h-9 md:h-10 text-sm md:text-base"
              disabled={isLoading}
            />
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="link"
              onClick={handleClear}
              className="p-0 h-auto text-primary underline"
              disabled={isLoading}
            >
              Clear Search
            </Button>
          </div>
        </div>

        {/* Right Column - Date and Identifier Filters */}
        <div className="space-y-4 md:space-y-6">
          {/* Original Paper Section */}
          <div className="space-y-3 md:space-y-4">
            <h3 className="text-base md:text-lg font-semibold text-foreground">Original Paper</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="originalFromDate" className="text-xs md:text-sm font-medium">
                  From Date:
                </Label>
                <Input
                  id="originalFromDate"
                  type="date"
                  value={filters.originalPaperFromDate || ''}
                  onChange={(e) => updateFilter('originalPaperFromDate', e.target.value)}
                  className="h-9 md:h-10 text-sm md:text-base"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="originalToDate" className="text-xs md:text-sm font-medium">
                  To:
                </Label>
                <Input
                  id="originalToDate"
                  type="date"
                  value={filters.originalPaperToDate || ''}
                  onChange={(e) => updateFilter('originalPaperToDate', e.target.value)}
                  className="h-9 md:h-10 text-sm md:text-base"
                  placeholder="mm/dd/yyyy"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="originalPubMedID" className="text-xs md:text-sm font-medium">
                PubMedID:
              </Label>
              <Input
                id="originalPubMedID"
                type="text"
                value={filters.originalPaperPubMedID || ''}
                onChange={(e) => updateFilter('originalPaperPubMedID', e.target.value)}
                className="h-9 md:h-10 text-sm md:text-base"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="originalDOI" className="text-xs md:text-sm font-medium">
                DOI:
              </Label>
              <Input
                id="originalDOI"
                type="text"
                value={filters.originalPaperDOI || ''}
                onChange={(e) => updateFilter('originalPaperDOI', e.target.value)}
                className="h-9 md:h-10 text-sm md:text-base"
                disabled={isLoading}
              />
            </div>
          </div>

          <Separator />

          {/* Retraction or Other Notices Section */}
          <div className="space-y-3 md:space-y-4">
            <h3 className="text-base md:text-lg font-semibold text-foreground">Retraction or Other Notices</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="retractionFromDate" className="text-xs md:text-sm font-medium">
                  From Date:
                </Label>
                <Input
                  id="retractionFromDate"
                  type="date"
                  value={filters.retractionFromDate || ''}
                  onChange={(e) => updateFilter('retractionFromDate', e.target.value)}
                  className="h-9 md:h-10 text-sm md:text-base"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="retractionToDate" className="text-xs md:text-sm font-medium">
                  To:
                </Label>
                <Input
                  id="retractionToDate"
                  type="date"
                  value={filters.retractionToDate || ''}
                  onChange={(e) => updateFilter('retractionToDate', e.target.value)}
                  className="h-9 md:h-10 text-sm md:text-base"
                  placeholder="mm/dd/yyyy"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="retractionPubMedID" className="text-xs md:text-sm font-medium">
                PubMedID:
              </Label>
              <Input
                id="retractionPubMedID"
                type="text"
                value={filters.retractionPubMedID || ''}
                onChange={(e) => updateFilter('retractionPubMedID', e.target.value)}
                className="h-9 md:h-10 text-sm md:text-base"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="retractionDOI" className="text-xs md:text-sm font-medium">
                DOI:
              </Label>
              <Input
                id="retractionDOI"
                type="text"
                value={filters.retractionDOI || ''}
                onChange={(e) => updateFilter('retractionDOI', e.target.value)}
                className="h-9 md:h-10 text-sm md:text-base"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Search Button */}
      <div className="flex justify-end pt-2 md:pt-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto h-11 md:h-12 px-6 md:px-8 bg-teal-600 hover:bg-teal-700 text-white font-medium"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Searching...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </span>
          )}
        </Button>
      </div>
    </form>
  );
};

export default SearchForm;
