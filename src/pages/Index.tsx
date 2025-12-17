import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import Header from '@/components/Header';
import CSVUploader from '@/components/CSVUploader';
import DataTable from '@/components/DataTable';
import { FileSpreadsheet, Database, Zap } from 'lucide-react';

interface CSVData {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  fileName: string;
}

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [csvData, setCSVData] = useState<CSVData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    setIsLoading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = results.data as Record<string, string>[];
        
        setCSVData({
          headers,
          rows,
          totalRows: rows.length,
          fileName: file.name,
        });
        setIsLoading(false);
      },
      error: (err) => {
        setError(`Failed to parse CSV: ${err.message}`);
        setIsLoading(false);
      },
    });
  }, []);

  return (
    <div className="min-h-screen bg-background transition-theme">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {!csvData ? (
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-accent/50 mb-4">
                <FileSpreadsheet className="h-10 w-10 text-primary" />
              </div>
              <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground">
                CSV Data Viewer
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                Upload your CSV file to view and explore data with powerful pagination and search.
              </p>
            </div>

            {/* Upload Card */}
            <div className="bg-card rounded-2xl border border-border p-8 shadow-lg transition-theme">
              <CSVUploader
                onFileSelect={handleFileSelect}
                isLoading={isLoading}
                fileName={csvData?.fileName}
              />

              {error && (
                <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-card border border-border">
                <Database className="h-6 w-6 text-primary mb-2" />
                <h3 className="font-medium text-foreground">Large Datasets</h3>
                <p className="text-sm text-muted-foreground">
                  Handle 160,000+ rows efficiently
                </p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <Zap className="h-6 w-6 text-primary mb-2" />
                <h3 className="font-medium text-foreground">Fast Pagination</h3>
                <p className="text-sm text-muted-foreground">
                  Navigate data smoothly
                </p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <FileSpreadsheet className="h-6 w-6 text-primary mb-2" />
                <h3 className="font-medium text-foreground">Search & Filter</h3>
                <p className="text-sm text-muted-foreground">
                  Find what you need quickly
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header with file info */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground">
                  {csvData.fileName}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {csvData.totalRows.toLocaleString()} rows × {csvData.headers.length} columns
                </p>
              </div>
              <CSVUploader
                onFileSelect={handleFileSelect}
                isLoading={isLoading}
                fileName={csvData.fileName}
              />
            </div>

            {/* Data Table */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-lg transition-theme">
              <DataTable
                data={csvData.rows}
                headers={csvData.headers}
                totalRows={csvData.totalRows}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-6 mt-8 transition-theme">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>CSV Data Viewer • Handles large datasets with ease</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
