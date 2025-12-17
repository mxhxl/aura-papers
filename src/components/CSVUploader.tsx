import { useCallback, useRef } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CSVUploaderProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  fileName?: string;
}

const CSVUploader = ({ onFileSelect, isLoading, fileName }: CSVUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type === 'text/csv') {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={handleClick}
      className={`
        relative cursor-pointer rounded-xl border-2 border-dashed p-8
        transition-all duration-200 ease-in-out
        ${isLoading 
          ? 'border-primary/50 bg-primary/5' 
          : 'border-border hover:border-primary/50 hover:bg-accent/30'
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
        disabled={isLoading}
      />
      
      <div className="flex flex-col items-center gap-4 text-center">
        {fileName ? (
          <>
            <div className="p-4 rounded-full bg-success/20">
              <FileSpreadsheet className="h-10 w-10 text-success" />
            </div>
            <div>
              <p className="font-medium text-foreground">{fileName}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Click or drop to replace
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="p-4 rounded-full bg-primary/10">
              <Upload className="h-10 w-10 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {isLoading ? 'Processing...' : 'Drop your CSV file here'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse
              </p>
            </div>
          </>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-primary">
            <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-sm">Parsing large file...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CSVUploader;
