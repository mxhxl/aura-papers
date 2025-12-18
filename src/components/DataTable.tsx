import { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { RetractionPaper } from '@/pages/Index';
import LoadingState from '@/components/LoadingState';
import { AlertTriangle, ExternalLink, Eye, EyeOff, ChevronDown, ChevronUp, Filter, User, BookOpen, Building2, Globe, Calendar, FileWarning, Microscope, Scale, FileText } from 'lucide-react';

interface DataTableProps {
  data?: RetractionPaper[];
  itemsPerPage?: number;
  fetchData?: (page: number, limit: number, signal?: AbortSignal) => Promise<{
    results: RetractionPaper[];
    count: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  hasFilters?: boolean;
}

// Retraction nature severity colors
const NATURE_COLORS: Record<string, string> = {
  'retraction': 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
  'expression of concern': 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
  'correction': 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
  'withdrawal': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
  'corrigendum': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
  'erratum': 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',
};

// Get color class for retraction nature
const getNatureColor = (nature: string): string => {
  if (!nature) return 'bg-muted text-muted-foreground';
  const normalized = nature.toLowerCase();
  for (const [key, value] of Object.entries(NATURE_COLORS)) {
    if (normalized.includes(key)) return value;
  }
  return 'bg-muted text-muted-foreground';
};

// Column configuration
interface ColumnConfig {
  key: string;
  label: string;
  width: string;
  priority: 'high' | 'medium' | 'low';
  visible: boolean;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'Record ID', label: 'ID', width: 'w-[70px]', priority: 'high', visible: true },
  { key: 'Title', label: 'Title', width: 'min-w-[220px]', priority: 'high', visible: true },
  { key: 'Author', label: 'Author', width: 'min-w-[150px]', priority: 'high', visible: true },
  { key: 'Journal', label: 'Journal', width: 'min-w-[130px]', priority: 'medium', visible: true },
  { key: 'Publisher', label: 'Publisher', width: 'min-w-[110px]', priority: 'low', visible: true },
  { key: 'Country', label: 'Country', width: 'min-w-[90px]', priority: 'medium', visible: true },
  { key: 'Institution', label: 'Institution', width: 'min-w-[150px]', priority: 'medium', visible: true },
  { key: 'ArticleType', label: 'Type', width: 'min-w-[90px]', priority: 'low', visible: true },
  { key: 'OriginalPaperDate', label: 'Published', width: 'min-w-[95px]', priority: 'medium', visible: true },
  { key: 'RetractionDate', label: 'Retracted', width: 'min-w-[95px]', priority: 'high', visible: true },
  { key: 'RetractionNature', label: 'Nature', width: 'min-w-[110px]', priority: 'high', visible: true },
  { key: 'View', label: 'View', width: 'w-[80px]', priority: 'high', visible: true },
];

// Memoized table row component
interface TableRowItemProps {
  paper: RetractionPaper;
  columns: ColumnConfig[];
  formatDate: (date: string) => string;
  truncateText: (text: string, maxLength: number) => string;
  onViewPaper: (paper: RetractionPaper) => void;
}

const TableRowItem = memo(({ paper, columns, formatDate, truncateText, onViewPaper }: TableRowItemProps) => {
  const renderCell = (column: ColumnConfig) => {
    const value = paper[column.key as keyof RetractionPaper];
    
    switch (column.key) {
      case 'Record ID':
        return (
          <span className="font-mono text-xs text-muted-foreground">
            {value}
          </span>
        );
      
      case 'Title':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="max-w-[220px]">
                {paper.URLS ? (
                  <a 
                    href={paper.URLS} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate block font-medium"
                  >
                    {truncateText(value || 'Untitled', 45)}
                  </a>
                ) : (
                  <span className="truncate block font-medium text-foreground">
                    {truncateText(value || 'Untitled', 45)}
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[400px]">
              <p className="text-sm">{value || 'Untitled'}</p>
            </TooltipContent>
          </Tooltip>
        );
      
      case 'Author':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="truncate block max-w-[150px] text-sm">
                {truncateText(value || 'N/A', 25)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[350px]">
              <p className="text-sm">{value || 'N/A'}</p>
            </TooltipContent>
          </Tooltip>
        );
      
      case 'RetractionNature':
        return value ? (
          <Badge className={`text-[10px] font-medium border ${getNatureColor(value)}`}>
            {truncateText(value, 18)}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">N/A</span>
        );
      
      case 'OriginalPaperDate':
      case 'RetractionDate':
        return (
          <span className={`text-sm ${column.key === 'RetractionDate' ? 'text-red-600 dark:text-red-400 font-medium' : 'text-foreground'}`}>
            {formatDate(value)}
          </span>
        );
      
      case 'Journal':
      case 'Publisher':
      case 'Institution':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="truncate block max-w-[150px] text-sm text-foreground">
                {truncateText(value || 'N/A', column.key === 'Institution' ? 28 : 22)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[300px]">
              <p className="text-sm">{value || 'N/A'}</p>
            </TooltipContent>
          </Tooltip>
        );
      
      case 'Country':
        return (
          <span className="text-sm text-foreground">
            {truncateText(value || 'N/A', 15)}
          </span>
        );
      
      case 'ArticleType':
        return (
          <Badge variant="outline" className="text-[10px] font-normal">
            {truncateText(value || 'N/A', 15)}
          </Badge>
        );
      
      case 'View':
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewPaper(paper)}
            className="h-7 px-2 text-xs gap-1 hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>
        );
      
      default:
        return (
          <span className="truncate text-sm text-foreground">
            {truncateText(value || 'N/A', 20)}
          </span>
        );
    }
  };

  return (
    <TableRow className="hover:bg-muted/50 transition-colors group">
      {columns.filter(c => c.visible).map((column) => (
        <TableCell key={column.key} className={column.width}>
          {renderCell(column)}
        </TableCell>
      ))}
    </TableRow>
  );
});

TableRowItem.displayName = 'TableRowItem';

const DataTable = ({ 
  data, 
  itemsPerPage: defaultItemsPerPage = 100,
  fetchData,
  hasFilters = false
}: DataTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);
  const [tableData, setTableData] = useState<RetractionPaper[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  
  // Paper detail dialog state
  const [selectedPaper, setSelectedPaper] = useState<RetractionPaper | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  
  // AbortController for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Handle viewing paper details
  const handleViewPaper = useCallback((paper: RetractionPaper) => {
    setSelectedPaper(paper);
    setIsDetailDialogOpen(true);
  }, []);

  // If fetchData is provided, use server-side pagination
  const useServerPagination = !!fetchData;

  // Memoized format functions
  const formatDate = useCallback((dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  }, []);

  const truncateText = useCallback((text: string, maxLength: number = 50) => {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }, []);

  const loadPageData = async () => {
    if (!fetchData) return;
    
    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    setIsLoading(true);
    try {
      const result = await fetchData(currentPage, itemsPerPage, abortController.signal);
      
      // Only update state if request wasn't aborted
      if (!abortController.signal.aborted) {
        setTableData(result.results);
        setTotalCount(result.count);
        setTotalPages(result.totalPages);
      }
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Failed to load page data:', error);
      if (!abortControllerRef.current?.signal.aborted) {
        setTableData([]);
        setTotalCount(0);
        setTotalPages(0);
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  // Load data when page or itemsPerPage changes (server-side pagination)
  useEffect(() => {
    if (useServerPagination && fetchData) {
      loadPageData();
    } else if (data) {
      // Client-side pagination (fallback)
      setIsLoading(false);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setTableData(data.slice(startIndex, endIndex));
      setTotalCount(data.length);
      setTotalPages(Math.ceil(data.length / itemsPerPage));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage]);

  // Reset to page 1 when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Toggle column visibility
  const toggleColumn = useCallback((columnKey: string) => {
    setColumns(prev => prev.map(col => 
      col.key === columnKey ? { ...col, visible: !col.visible } : col
    ));
  }, []);

  // Memoized visible columns
  const visibleColumns = useMemo(() => columns.filter(c => c.visible), [columns]);

  const getPageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  }, [currentPage, totalPages]);

  // Statistics for current view
  const stats = useMemo(() => {
    const retractionTypes: Record<string, number> = {};
    tableData.forEach(paper => {
      const nature = paper.RetractionNature || 'Unknown';
      retractionTypes[nature] = (retractionTypes[nature] || 0) + 1;
    });
    return { retractionTypes };
  }, [tableData]);

  if (isLoading && useServerPagination) {
    return <LoadingState />;
  }

  if (!useServerPagination && (!data || data.length === 0)) {
    return (
      <div className="text-center py-12 bg-card rounded-xl border border-border">
        <p className="text-muted-foreground">No data available.</p>
      </div>
    );
  }

  if (useServerPagination && tableData.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12 bg-card rounded-xl border border-border">
        <p className="text-muted-foreground">No data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls Row */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
            <span className="font-semibold text-foreground">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of{' '}
            <span className="font-semibold text-foreground">{totalCount.toLocaleString()}</span> papers
          </div>
          
          {/* Mini stats badges */}
          {Object.entries(stats.retractionTypes).slice(0, 3).map(([type, count]) => (
            <Badge key={type} variant="outline" className={`text-[10px] ${getNatureColor(type)}`}>
              {type}: {count}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Column visibility toggle */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              className="h-9 gap-2"
            >
              <Filter className="h-3.5 w-3.5" />
              Columns
              {showColumnSelector ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
            
            {showColumnSelector && (
              <div className="absolute right-0 top-full mt-2 z-50 bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Toggle Columns</p>
                <div className="space-y-1.5">
                  {columns.map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1.5 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={col.visible}
                        onChange={() => toggleColumn(col.key)}
                        className="rounded border-border"
                      />
                      <span className={col.priority === 'high' ? 'font-medium' : ''}>{col.label}</span>
                      {col.priority === 'high' && (
                        <Badge variant="outline" className="text-[8px] ml-auto">KEY</Badge>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="itemsPerPage" className="text-sm text-muted-foreground whitespace-nowrap">
              Per page:
            </Label>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => setItemsPerPage(Number(value))}
            >
              <SelectTrigger id="itemsPerPage" className="w-[80px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
                <SelectItem value="500">500</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {visibleColumns.map((column) => (
                  <TableHead 
                    key={column.key} 
                    className={`${column.width} text-xs font-semibold uppercase tracking-wider ${column.priority === 'high' ? 'text-foreground' : 'text-muted-foreground'}`}
                  >
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((paper) => (
                <TableRowItem
                  key={paper['Record ID']}
                  paper={paper}
                  columns={columns}
                  formatDate={formatDate}
                  truncateText={truncateText}
                  onViewPaper={handleViewPaper}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="text-sm text-muted-foreground">
            Page <span className="font-medium text-foreground">{currentPage}</span> of{' '}
            <span className="font-medium text-foreground">{totalPages.toLocaleString()}</span>
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) {
                      setCurrentPage(prev => prev - 1);
                    }
                  }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-muted'}
                />
              </PaginationItem>

              {getPageNumbers.map((page, index) => (
                <PaginationItem key={index}>
                  {page === 'ellipsis' ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page as number);
                      }}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) {
                      setCurrentPage(prev => prev + 1);
                    }
                  }}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-muted'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Paper Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
          {selectedPaper && (
            <>
              {/* Severity indicator bar */}
              <div className={`h-1.5 w-full ${
                selectedPaper.RetractionNature?.toLowerCase().includes('retraction') ? 'bg-red-500' :
                selectedPaper.RetractionNature?.toLowerCase().includes('concern') ? 'bg-orange-500' :
                selectedPaper.RetractionNature?.toLowerCase().includes('correction') ? 'bg-yellow-500' :
                'bg-blue-500'
              }`} />
              
              <DialogHeader className="px-6 pt-4 pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <DialogTitle className="text-xl font-semibold leading-tight pr-8">
                      {selectedPaper.Title || 'Untitled Paper'}
                    </DialogTitle>
                    <div className="flex flex-wrap gap-2">
                      {selectedPaper.RetractionNature && (
                        <Badge className={`text-xs font-medium border ${getNatureColor(selectedPaper.RetractionNature)}`}>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {selectedPaper.RetractionNature}
                        </Badge>
                      )}
                      {selectedPaper.ArticleType && (
                        <Badge variant="secondary" className="text-xs font-normal">
                          <FileWarning className="h-3 w-3 mr-1" />
                          {selectedPaper.ArticleType}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs font-mono">
                        #{selectedPaper['Record ID']}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              
              <ScrollArea className="max-h-[calc(90vh-140px)] px-6 pb-6">
                <div className="space-y-5">
                  {/* Author Section */}
                  {selectedPaper.Author && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
                      <User className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">Author(s)</span>
                        <p className="text-sm text-foreground mt-1 leading-relaxed">{selectedPaper.Author}</p>
                      </div>
                    </div>
                  )}

                  {/* Subject */}
                  {selectedPaper.Subject && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Microscope className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-muted-foreground">Subject</span>
                        <p className="text-sm text-foreground">{selectedPaper.Subject}</p>
                      </div>
                    </div>
                  )}

                  {/* Journal and Publisher Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedPaper.Journal && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                        <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-medium text-muted-foreground">Journal</span>
                          <p className="text-sm text-foreground">{selectedPaper.Journal}</p>
                        </div>
                      </div>
                    )}

                    {selectedPaper.Publisher && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                        <Building2 className="h-4 w-4 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-medium text-muted-foreground">Publisher</span>
                          <p className="text-sm text-foreground">{selectedPaper.Publisher}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Institution and Country Grid */}
                  {(selectedPaper.Institution || selectedPaper.Country) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedPaper.Institution && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                          <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-medium text-muted-foreground">Institution</span>
                            <p className="text-sm text-foreground">{selectedPaper.Institution}</p>
                          </div>
                        </div>
                      )}

                      {selectedPaper.Country && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                          <Globe className="h-4 w-4 text-cyan-600 dark:text-cyan-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-medium text-muted-foreground">Country</span>
                            <p className="text-sm text-foreground">{selectedPaper.Country}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <Separator />

                  {/* Timeline Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Original Paper Info */}
                    <div className="space-y-3 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <h4 className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        Original Paper
                      </h4>
                      <div className="space-y-2 text-sm">
                        {selectedPaper.OriginalPaperDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{formatDate(selectedPaper.OriginalPaperDate)}</span>
                          </div>
                        )}
                        {selectedPaper.OriginalPaperDOI && (
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">DOI:</span>
                            <a 
                              href={`https://doi.org/${selectedPaper.OriginalPaperDOI}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block font-mono text-xs text-primary hover:underline break-all"
                            >
                              {selectedPaper.OriginalPaperDOI}
                            </a>
                          </div>
                        )}
                        {selectedPaper.OriginalPaperPubMedID && (
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">PubMed ID:</span>
                            <a 
                              href={`https://pubmed.ncbi.nlm.nih.gov/${selectedPaper.OriginalPaperPubMedID}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-primary hover:underline"
                            >
                              {selectedPaper.OriginalPaperPubMedID}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Retraction Info */}
                    <div className="space-y-3 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                      <h4 className="font-semibold text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        Retraction Notice
                      </h4>
                      <div className="space-y-2 text-sm">
                        {selectedPaper.RetractionDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{formatDate(selectedPaper.RetractionDate)}</span>
                          </div>
                        )}
                        {selectedPaper.RetractionDOI && (
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">DOI:</span>
                            <a 
                              href={`https://doi.org/${selectedPaper.RetractionDOI}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block font-mono text-xs text-primary hover:underline break-all"
                            >
                              {selectedPaper.RetractionDOI}
                            </a>
                          </div>
                        )}
                        {selectedPaper.RetractionPubMedID && (
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">PubMed ID:</span>
                            <a 
                              href={`https://pubmed.ncbi.nlm.nih.gov/${selectedPaper.RetractionPubMedID}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-primary hover:underline"
                            >
                              {selectedPaper.RetractionPubMedID}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reason for Retraction */}
                  {selectedPaper.Reason && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        Reason for Retraction
                      </h4>
                      <p className="text-sm text-foreground p-4 rounded-lg bg-orange-500/5 border border-orange-500/20 leading-relaxed">
                        {selectedPaper.Reason}
                      </p>
                    </div>
                  )}

                  {/* Paywalled Status */}
                  {selectedPaper.Paywalled && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                      <Scale className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Paywalled:</span>
                      <span className="text-sm font-medium">{selectedPaper.Paywalled}</span>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedPaper.Notes && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Additional Notes
                      </h4>
                      <p className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/30 border-l-2 border-muted leading-relaxed">
                        {selectedPaper.Notes}
                      </p>
                    </div>
                  )}

                  {/* External Link */}
                  {selectedPaper.URLS && (
                    <div className="pt-2">
                      <a
                        href={selectedPaper.URLS}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Original Source
                      </a>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataTable;
