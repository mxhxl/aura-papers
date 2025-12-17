import { AlertTriangle, CheckCircle, User, Calendar } from 'lucide-react';
import { SearchResult } from '@/lib/mockData';

interface ResultCardProps {
  result: SearchResult;
  searchedTitle: string;
  searchedAuthor: string;
}

const ResultCard = ({ result, searchedTitle, searchedAuthor }: ResultCardProps) => {
  if (result.found && result.paper) {
    return (
      <div className="animate-fade-in rounded-xl border-2 border-warning bg-warning-bg p-6 shadow-md transition-theme">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-warning/20">
            <AlertTriangle className="h-6 w-6 text-warning" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="font-heading text-xl font-semibold text-foreground">
                Paper Already Exists
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                This paper has already been submitted to the database.
              </p>
            </div>

            <div className="bg-card/50 rounded-lg p-4 space-y-3 border border-border">
              <h4 className="font-medium text-foreground">
                "{result.paper.title}"
              </h4>
              
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4 text-primary" />
                  <span>Created by: <span className="text-foreground font-medium">{result.paper.author}</span></span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>Date: <span className="text-foreground font-medium">{new Date(result.paper.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in rounded-xl border-2 border-success bg-success-bg p-6 shadow-md transition-theme">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-full bg-success/20">
          <CheckCircle className="h-6 w-6 text-success" />
        </div>
        <div className="flex-1 space-y-2">
          <h3 className="font-heading text-xl font-semibold text-foreground">
            Paper Available to Write
          </h3>
          <p className="text-sm text-muted-foreground">
            Great news! No existing paper matches "{searchedTitle}" by {searchedAuthor}. 
            You can proceed with your research.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
