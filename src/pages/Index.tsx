import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import { FileSpreadsheet, AlertCircle } from 'lucide-react';
import LoadingState from '@/components/LoadingState';

interface CSVData {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [csvData, setCSVData] = useState<CSVData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCSV = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/data/data.csv');
        if (!response.ok) {
          throw new Error('CSV file not found. Please place your CSV file at public/data/data.csv');
        }
        
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const headers = results.meta.fields || [];
            const rows = results.data as Record<string, string>[];
            
            setCSVData({
              headers,
              rows,
              totalRows: rows.length
            });
            setIsLoading(false);
          },
          error: (err) => {
            setError(`Failed to parse CSV: ${err.message}`);
            setIsLoading(false);
          }
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load CSV file');
        setIsLoading(false);
      }
    };

    loadCSV();
  }, []);

  return (
    <div className="min-h-screen bg-background transition-theme">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingState />
            <p className="mt-4 text-muted-foreground">Loading CSV data...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 max-w-md text-center">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Data</h3>
              <p className="text-muted-foreground text-sm">{error}</p>
              <p className="text-muted-foreground text-xs mt-4">
                Place your CSV file at: <code className="bg-muted px-2 py-1 rounded">public/data/data.csv</code>
              </p>
            </div>
          </div>
        )}

        {!isLoading && !error && csvData && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileSpreadsheet className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-semibold text-foreground">
                  CSV Data Viewer
                </h2>
                <p className="text-sm text-muted-foreground">
                  {csvData.totalRows.toLocaleString()} rows • {csvData.headers.length} columns
                </p>
              </div>
            </div>

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

      <footer className="border-t border-border bg-card/50 py-6 mt-8 transition-theme">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>CSV Data Viewer • Handles large datasets with ease</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
