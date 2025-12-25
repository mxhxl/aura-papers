import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { Search, X, Filter, Calendar, FileText, User, Building2, Globe, BookOpen, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

// Quick filter presets
const QUICK_FILTERS = [
  { label: 'SIMATS Papers', filters: { institution: 'saveetha' } },
  { label: 'Recent Retractions', filters: { retractionFromDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] } },
  { label: 'India', filters: { country: 'India' } },
];

// Input field with icon component
interface FieldInputProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: string;
}

const FieldInput = memo(({ id, label, icon, placeholder, value, onChange, disabled, type = 'text' }: FieldInputProps) => (
  <div className="space-y-1.5">
    <Label htmlFor={id} className="text-xs md:text-sm font-medium flex items-center gap-2">
      <span className="text-primary">{icon}</span>
      {label}
    </Label>
    <Input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 md:h-10 text-sm md:text-base bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all"
      disabled={disabled}
    />
  </div>
));

FieldInput.displayName = 'FieldInput';

// Select field with icon component
interface FieldSelectProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  value: string | undefined;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

const FieldSelect = memo(({ id, label, icon, placeholder, value, options, onChange, disabled }: FieldSelectProps) => (
  <div className="space-y-1.5">
    <Label htmlFor={id} className="text-xs md:text-sm font-medium flex items-center gap-2">
      <span className="text-primary">{icon}</span>
      {label}
    </Label>
    <Select
      value={value || undefined}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className="h-9 md:h-10 text-sm md:text-base bg-background/50 border-border/50 focus:border-primary/50">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px] overflow-y-auto">
        {options.map((option) => (
          <SelectItem key={option} value={option} className="text-sm">
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
));

FieldSelect.displayName = 'FieldSelect';

const SearchForm = memo(({ onSearch, isLoading }: SearchFormProps) => {
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  
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
        const response = await fetch('/api/options');
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

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  }, [filters, onSearch]);

  const handleClear = useCallback(() => {
    setFilters({});
    onSearch({});
  }, [onSearch]);

  const handleQuickFilter = useCallback((quickFilter: { label: string; filters: Partial<SearchFilters> }) => {
    const newFilters = { ...filters, ...quickFilter.filters };
    setFilters(newFilters);
    onSearch(newFilters);
  }, [filters, onSearch]);

  const updateFilter = useCallback((key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  }, []);

  // Count active filters
  const activeFilterCount = useMemo(() => 
    Object.values(filters).filter(v => v !== undefined && v !== '').length
  , [filters]);

  // Check if any advanced filters are active
  const hasAdvancedFilters = useMemo(() => 
    !!(filters.originalPaperFromDate || filters.originalPaperToDate || 
       filters.originalPaperPubMedID || filters.originalPaperDOI ||
       filters.retractionFromDate || filters.retractionToDate ||
       filters.retractionPubMedID || filters.retractionDOI)
  , [filters]);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Quick Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Quick filters
        </span>
        {QUICK_FILTERS.map((qf) => (
          <Button
            key={qf.label}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickFilter(qf)}
            disabled={isLoading}
            className="h-7 text-xs rounded-full hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all"
          >
            {qf.label}
          </Button>
        ))}
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="text-xs rounded-full">
            {activeFilterCount} active
          </Badge>
        )}
      </div>

      <Separator className="bg-border/50" />

      {/* Main Search Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Primary Search Fields */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            Primary Filters
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldInput
              id="author"
              label="Author(s)"
              icon={<User className="h-3.5 w-3.5" />}
              placeholder="Search by name..."
              value={filters.author || ''}
              onChange={(v) => updateFilter('author', v)}
              disabled={isLoading}
            />

            <FieldInput
              id="title"
              label="Title"
              icon={<FileText className="h-3.5 w-3.5" />}
              placeholder="Search by title..."
              value={filters.title || ''}
              onChange={(v) => updateFilter('title', v)}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldSelect
              id="articleType"
              label="Article Type"
              icon={<FileText className="h-3.5 w-3.5" />}
              placeholder="Select type"
              value={filters.articleType}
              options={options.articleTypes}
              onChange={(v) => updateFilter('articleType', v)}
              disabled={isLoading}
            />

            <FieldSelect
              id="country"
              label="Country"
              icon={<Globe className="h-3.5 w-3.5" />}
              placeholder="Select country"
              value={filters.country}
              options={options.countries}
              onChange={(v) => updateFilter('country', v)}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldSelect
              id="journal"
              label="Journal"
              icon={<BookOpen className="h-3.5 w-3.5" />}
              placeholder="Select journal"
              value={filters.journal}
              options={options.journals}
              onChange={(v) => updateFilter('journal', v)}
              disabled={isLoading}
            />

            <FieldSelect
              id="publisher"
              label="Publisher"
              icon={<Building2 className="h-3.5 w-3.5" />}
              placeholder="Select publisher"
              value={filters.publisher}
              options={options.publishers}
              onChange={(v) => updateFilter('publisher', v)}
              disabled={isLoading}
            />
          </div>

          <FieldInput
            id="institution"
            label="Institution"
            icon={<Building2 className="h-3.5 w-3.5" />}
            placeholder="Search institution..."
            value={filters.institution || ''}
            onChange={(v) => updateFilter('institution', v)}
            disabled={isLoading}
          />
        </div>

        {/* Date & ID Filters (Collapsible) */}
        <div className="space-y-4">
          <Collapsible open={showAdvanced || hasAdvancedFilters} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-between h-auto py-2 px-3 hover:bg-muted/50"
              >
                <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Advanced Filters
                  {hasAdvancedFilters && (
                    <Badge variant="secondary" className="text-[10px] ml-2">Active</Badge>
                  )}
                </span>
                {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-4 pt-4">
              {/* Original Paper Section */}
              <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  Original Paper
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <FieldInput
                    id="originalFromDate"
                    label="From Date"
                    icon={<Calendar className="h-3.5 w-3.5" />}
                    placeholder=""
                    value={filters.originalPaperFromDate || ''}
                    onChange={(v) => updateFilter('originalPaperFromDate', v)}
                    disabled={isLoading}
                    type="date"
                  />

                  <FieldInput
                    id="originalToDate"
                    label="To Date"
                    icon={<Calendar className="h-3.5 w-3.5" />}
                    placeholder=""
                    value={filters.originalPaperToDate || ''}
                    onChange={(v) => updateFilter('originalPaperToDate', v)}
                    disabled={isLoading}
                    type="date"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FieldInput
                    id="originalPubMedID"
                    label="PubMed ID"
                    icon={<FileText className="h-3.5 w-3.5" />}
                    placeholder="e.g., 12345678"
                    value={filters.originalPaperPubMedID || ''}
                    onChange={(v) => updateFilter('originalPaperPubMedID', v)}
                    disabled={isLoading}
                  />

                  <FieldInput
                    id="originalDOI"
                    label="DOI"
                    icon={<FileText className="h-3.5 w-3.5" />}
                    placeholder="e.g., 10.1234/..."
                    value={filters.originalPaperDOI || ''}
                    onChange={(v) => updateFilter('originalPaperDOI', v)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Retraction Notice Section */}
              <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20 space-y-3">
                <h4 className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  Retraction Notice
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <FieldInput
                    id="retractionFromDate"
                    label="From Date"
                    icon={<Calendar className="h-3.5 w-3.5" />}
                    placeholder=""
                    value={filters.retractionFromDate || ''}
                    onChange={(v) => updateFilter('retractionFromDate', v)}
                    disabled={isLoading}
                    type="date"
                  />

                  <FieldInput
                    id="retractionToDate"
                    label="To Date"
                    icon={<Calendar className="h-3.5 w-3.5" />}
                    placeholder=""
                    value={filters.retractionToDate || ''}
                    onChange={(v) => updateFilter('retractionToDate', v)}
                    disabled={isLoading}
                    type="date"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FieldInput
                    id="retractionPubMedID"
                    label="PubMed ID"
                    icon={<FileText className="h-3.5 w-3.5" />}
                    placeholder="e.g., 12345678"
                    value={filters.retractionPubMedID || ''}
                    onChange={(v) => updateFilter('retractionPubMedID', v)}
                    disabled={isLoading}
                  />

                  <FieldInput
                    id="retractionDOI"
                    label="DOI"
                    icon={<FileText className="h-3.5 w-3.5" />}
                    placeholder="e.g., 10.1234/..."
                    value={filters.retractionDOI || ''}
                    onChange={(v) => updateFilter('retractionDOI', v)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2 gap-4">
        <Button
          type="button"
          variant="ghost"
          onClick={handleClear}
          disabled={isLoading || activeFilterCount === 0}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-2" />
          Clear all
        </Button>
        
        <Button
          type="submit"
          disabled={isLoading}
          className="h-11 px-8 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-medium shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Searching...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search Papers
            </span>
          )}
        </Button>
      </div>
    </form>
  );
});

SearchForm.displayName = 'SearchForm';

export default SearchForm;
