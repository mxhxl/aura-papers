import { useState, useEffect, useRef } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RetractionPaper } from '@/pages/Index';
import LoadingState from '@/components/LoadingState';

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
  
  // AbortController for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // If fetchData is provided, use server-side pagination
  const useServerPagination = !!fetchData;

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
  // Note: Filter changes are handled via the key prop in parent, which remounts this component
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

  const formatDate = (dateStr: string) => {
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
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getPageNumbers = () => {
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
  };

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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="text-sm text-muted-foreground">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} papers
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="itemsPerPage" className="text-sm text-muted-foreground whitespace-nowrap">
            Items per page:
          </Label>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => setItemsPerPage(Number(value))}
          >
            <SelectTrigger id="itemsPerPage" className="w-[100px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
              <SelectItem value="500">500</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead className="min-w-[200px]">Title</TableHead>
                <TableHead className="min-w-[150px]">Author</TableHead>
                <TableHead className="min-w-[120px]">Journal</TableHead>
                <TableHead className="min-w-[100px]">Publisher</TableHead>
                <TableHead className="min-w-[100px]">Country</TableHead>
                <TableHead className="min-w-[150px]">Institution</TableHead>
                <TableHead className="min-w-[100px]">Article Type</TableHead>
                <TableHead className="min-w-[100px]">Original Date</TableHead>
                <TableHead className="min-w-[100px]">Retraction Date</TableHead>
                <TableHead className="min-w-[120px]">Retraction Nature</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((paper) => (
                <TableRow key={paper['Record ID']} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{paper['Record ID']}</TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="truncate" title={paper.Title}>
                      {truncateText(paper.Title, 40)}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[150px]">
                    <div className="truncate" title={paper.Author}>
                      {truncateText(paper.Author, 30)}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[120px]">
                    <div className="truncate" title={paper.Journal}>
                      {truncateText(paper.Journal, 20)}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[100px]">
                    <div className="truncate" title={paper.Publisher}>
                      {truncateText(paper.Publisher, 20)}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[100px]">
                    <div className="truncate" title={paper.Country}>
                      {truncateText(paper.Country, 15)}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[150px]">
                    <div className="truncate" title={paper.Institution || 'N/A'}>
                      {truncateText(paper.Institution || 'N/A', 30)}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[100px]">
                    <div className="truncate" title={paper.ArticleType}>
                      {truncateText(paper.ArticleType, 20)}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(paper.OriginalPaperDate)}</TableCell>
                  <TableCell>{formatDate(paper.RetractionDate)}</TableCell>
                  <TableCell className="max-w-[120px]">
                    <div className="truncate" title={paper.RetractionNature}>
                      {truncateText(paper.RetractionNature, 20)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalPages > 1 && (
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
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>

            {getPageNumbers().map((page, index) => (
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
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default DataTable;
