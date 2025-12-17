import { Calendar, User, BookOpen, Building2, Globe, FileText, ExternalLink } from 'lucide-react';
import { RetractionPaper } from '@/pages/Index';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ResultCardProps {
  paper: RetractionPaper;
}

const ResultCard = ({ paper }: ResultCardProps) => {
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

  return (
    <Card className="border-border hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2 line-clamp-2">
              {paper.Title || 'Untitled Paper'}
            </CardTitle>
            <div className="flex flex-wrap gap-2 mt-2">
              {paper.RetractionNature && (
                <Badge variant="destructive" className="text-xs">
                  {paper.RetractionNature}
                </Badge>
              )}
              {paper.ArticleType && (
                <Badge variant="secondary" className="text-xs">
                  {paper.ArticleType}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Author Information */}
        {paper.Author && (
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-sm font-medium text-muted-foreground">Author(s):</span>
              <span className="text-sm text-foreground ml-2">{paper.Author}</span>
            </div>
          </div>
        )}

        {/* Journal and Publisher */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paper.Journal && (
            <div className="flex items-start gap-2">
              <BookOpen className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-sm font-medium text-muted-foreground">Journal:</span>
                <span className="text-sm text-foreground ml-2">{paper.Journal}</span>
              </div>
            </div>
          )}

          {paper.Publisher && (
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-sm font-medium text-muted-foreground">Publisher:</span>
                <span className="text-sm text-foreground ml-2">{paper.Publisher}</span>
              </div>
            </div>
          )}
        </div>

        {/* Institution and Country */}
        {(paper.Institution || paper.Country) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paper.Institution && (
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Institution:</span>
                  <span className="text-sm text-foreground ml-2 line-clamp-2">{paper.Institution}</span>
                </div>
              </div>
            )}

            {paper.Country && (
              <div className="flex items-start gap-2">
                <Globe className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Country:</span>
                  <span className="text-sm text-foreground ml-2">{paper.Country}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Original Paper Information */}
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground text-sm">Original Paper</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {paper.OriginalPaperDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Date:</span>
                <span className="text-foreground">{formatDate(paper.OriginalPaperDate)}</span>
              </div>
            )}
            {paper.OriginalPaperDOI && (
              <div>
                <span className="text-muted-foreground">DOI:</span>
                <span className="text-foreground ml-2 font-mono text-xs">{paper.OriginalPaperDOI}</span>
              </div>
            )}
            {paper.OriginalPaperPubMedID && (
              <div>
                <span className="text-muted-foreground">PubMed ID:</span>
                <span className="text-foreground ml-2">{paper.OriginalPaperPubMedID}</span>
              </div>
            )}
          </div>
        </div>

        {/* Retraction Information */}
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground text-sm">Retraction Notice</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {paper.RetractionDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Date:</span>
                <span className="text-foreground">{formatDate(paper.RetractionDate)}</span>
              </div>
            )}
            {paper.RetractionDOI && (
              <div>
                <span className="text-muted-foreground">DOI:</span>
                <span className="text-foreground ml-2 font-mono text-xs">{paper.RetractionDOI}</span>
              </div>
            )}
            {paper.RetractionPubMedID && (
              <div>
                <span className="text-muted-foreground">PubMed ID:</span>
                <span className="text-foreground ml-2">{paper.RetractionPubMedID}</span>
              </div>
            )}
          </div>
        </div>

        {/* Reason for Retraction */}
        {paper.Reason && (
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground text-sm">Reason for Retraction</h4>
            <p className="text-sm text-foreground bg-muted/50 p-3 rounded-md">
              {paper.Reason}
            </p>
          </div>
        )}

        {/* Subject */}
        {paper.Subject && (
          <div>
            <span className="text-sm font-medium text-muted-foreground">Subject:</span>
            <span className="text-sm text-foreground ml-2">{paper.Subject}</span>
          </div>
        )}

        {/* URL Link */}
        {paper.URLS && (
          <div className="pt-2">
            <a
              href={paper.URLS}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              View Details
            </a>
          </div>
        )}

        {/* Notes */}
        {paper.Notes && (
          <div className="pt-2 border-t border-border">
            <span className="text-sm font-medium text-muted-foreground">Notes:</span>
            <p className="text-sm text-foreground mt-1">{paper.Notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResultCard;
