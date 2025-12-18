import { memo, useMemo } from 'react';
import { Calendar, User, BookOpen, Building2, Globe, ExternalLink, AlertTriangle, FileWarning, Scale, Microscope } from 'lucide-react';
import { RetractionPaper } from '@/pages/Index';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ResultCardProps {
  paper: RetractionPaper;
}

// Retraction severity mapping for visual priority
const RETRACTION_SEVERITY: Record<string, { level: 'critical' | 'high' | 'medium' | 'low'; color: string }> = {
  'Retraction': { level: 'critical', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30' },
  'Expression of Concern': { level: 'high', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30' },
  'Correction': { level: 'medium', color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30' },
  'Withdrawal': { level: 'high', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30' },
  'Corrigendum': { level: 'low', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' },
  'Erratum': { level: 'low', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30' },
};

// Reason keywords for highlighting importance
const REASON_KEYWORDS = {
  critical: ['fabrication', 'falsification', 'plagiarism', 'fraud', 'misconduct', 'fake', 'manipulated'],
  high: ['duplicate', 'self-plagiarism', 'data integrity', 'ethical', 'consent'],
  medium: ['error', 'mistake', 'overlap', 'redundant'],
};

// Get severity badge for retraction nature
const getSeverityBadge = (nature: string) => {
  const normalizedNature = Object.keys(RETRACTION_SEVERITY).find(
    key => nature?.toLowerCase().includes(key.toLowerCase())
  );
  return RETRACTION_SEVERITY[normalizedNature || 'Retraction'] || RETRACTION_SEVERITY['Retraction'];
};

// Highlight important keywords in reason text
const highlightReasonKeywords = (reason: string) => {
  if (!reason) return null;
  
  let highlighted = reason;
  let severity: 'critical' | 'high' | 'medium' | 'normal' = 'normal';
  
  // Check for severity level
  for (const keyword of REASON_KEYWORDS.critical) {
    if (reason.toLowerCase().includes(keyword)) {
      severity = 'critical';
      break;
    }
  }
  if (severity === 'normal') {
    for (const keyword of REASON_KEYWORDS.high) {
      if (reason.toLowerCase().includes(keyword)) {
        severity = 'high';
        break;
      }
    }
  }
  if (severity === 'normal') {
    for (const keyword of REASON_KEYWORDS.medium) {
      if (reason.toLowerCase().includes(keyword)) {
        severity = 'medium';
        break;
      }
    }
  }
  
  const severityStyles = {
    critical: 'bg-red-500/10 dark:bg-red-500/20 border-l-4 border-l-red-500',
    high: 'bg-orange-500/10 dark:bg-orange-500/20 border-l-4 border-l-orange-500',
    medium: 'bg-yellow-500/10 dark:bg-yellow-500/20 border-l-4 border-l-yellow-500',
    normal: 'bg-muted/50',
  };
  
  return {
    text: highlighted,
    style: severityStyles[severity],
    severity
  };
};

// Calculate days between original publication and retraction
const calculateTimeToRetraction = (originalDate: string, retractionDate: string) => {
  if (!originalDate || !retractionDate) return null;
  
  try {
    const original = new Date(originalDate);
    const retraction = new Date(retractionDate);
    const diffTime = Math.abs(retraction.getTime() - original.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    if (diffYears > 0) {
      return { value: diffYears, unit: 'year', days: diffDays };
    } else if (diffMonths > 0) {
      return { value: diffMonths, unit: 'month', days: diffDays };
    }
    return { value: diffDays, unit: 'day', days: diffDays };
  } catch {
    return null;
  }
};

const ResultCard = memo(({ paper }: ResultCardProps) => {
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

  // Memoized calculations
  const severityBadge = useMemo(() => getSeverityBadge(paper.RetractionNature), [paper.RetractionNature]);
  const reasonAnalysis = useMemo(() => highlightReasonKeywords(paper.Reason), [paper.Reason]);
  const timeToRetraction = useMemo(
    () => calculateTimeToRetraction(paper.OriginalPaperDate, paper.RetractionDate),
    [paper.OriginalPaperDate, paper.RetractionDate]
  );

  // Priority fields based on value presence
  const hasHighPriorityInfo = paper.RetractionNature || paper.Reason;
  const hasIdentifiers = paper.OriginalPaperDOI || paper.RetractionDOI || paper.OriginalPaperPubMedID || paper.RetractionPubMedID;

  return (
    <Card className="border-border hover:shadow-lg transition-all duration-300 group overflow-hidden">
      {/* Severity indicator bar */}
      <div className={`h-1 w-full ${severityBadge.level === 'critical' ? 'bg-red-500' : severityBadge.level === 'high' ? 'bg-orange-500' : severityBadge.level === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <CardTitle className="text-lg md:text-xl leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {paper.Title || 'Untitled Paper'}
            </CardTitle>
            
            {/* Badges row with enhanced styling */}
            <div className="flex flex-wrap gap-2">
              {paper.RetractionNature && (
                <Tooltip>
                  <TooltipTrigger>
                    <Badge className={`text-xs font-medium border ${severityBadge.color}`}>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {paper.RetractionNature}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Retraction severity: {severityBadge.level}</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {paper.ArticleType && (
                <Badge variant="secondary" className="text-xs font-normal">
                  <FileWarning className="h-3 w-3 mr-1" />
                  {paper.ArticleType}
                </Badge>
              )}
              {paper.Subject && (
                <Badge variant="outline" className="text-xs font-normal">
                  <Microscope className="h-3 w-3 mr-1" />
                  {paper.Subject.length > 30 ? paper.Subject.substring(0, 30) + '...' : paper.Subject}
                </Badge>
              )}
              {timeToRetraction && (
                <Badge variant="outline" className="text-xs font-normal bg-muted/50">
                  <Scale className="h-3 w-3 mr-1" />
                  {timeToRetraction.value} {timeToRetraction.unit}{timeToRetraction.value !== 1 ? 's' : ''} to retraction
                </Badge>
              )}
            </div>
          </div>
          
          {/* Record ID badge */}
          <div className="shrink-0">
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
              #{paper['Record ID']}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-0">
        {/* Author - High priority field */}
        {paper.Author && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <User className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">Author(s)</span>
              <p className="text-sm text-foreground mt-0.5 leading-relaxed">{paper.Author}</p>
            </div>
          </div>
        )}

        {/* Journal and Publisher - Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {paper.Journal && (
            <div className="flex items-start gap-2 p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
              <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-medium text-muted-foreground">Journal</span>
                <p className="text-sm text-foreground truncate" title={paper.Journal}>{paper.Journal}</p>
              </div>
            </div>
          )}

          {paper.Publisher && (
            <div className="flex items-start gap-2 p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
              <Building2 className="h-4 w-4 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-medium text-muted-foreground">Publisher</span>
                <p className="text-sm text-foreground truncate" title={paper.Publisher}>{paper.Publisher}</p>
              </div>
            </div>
          )}
        </div>

        {/* Institution and Country */}
        {(paper.Institution || paper.Country) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {paper.Institution && (
              <div className="flex items-start gap-2 p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-medium text-muted-foreground">Institution</span>
                  <p className="text-sm text-foreground line-clamp-2" title={paper.Institution}>{paper.Institution}</p>
                </div>
              </div>
            )}

            {paper.Country && (
              <div className="flex items-start gap-2 p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                <Globe className="h-4 w-4 text-cyan-600 dark:text-cyan-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-medium text-muted-foreground">Country</span>
                  <p className="text-sm text-foreground">{paper.Country}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <Separator className="my-2" />

        {/* Timeline Section - Original vs Retraction */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Original Paper Info */}
          <div className="space-y-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <h4 className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              Original Paper
            </h4>
            <div className="space-y-1.5 text-sm">
              {paper.OriginalPaperDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-foreground font-medium">{formatDate(paper.OriginalPaperDate)}</span>
                </div>
              )}
              {paper.OriginalPaperDOI && (
                <div className="text-xs">
                  <span className="text-muted-foreground">DOI: </span>
                  <a 
                    href={`https://doi.org/${paper.OriginalPaperDOI}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-primary hover:underline break-all"
                  >
                    {paper.OriginalPaperDOI}
                  </a>
                </div>
              )}
              {paper.OriginalPaperPubMedID && (
                <div className="text-xs">
                  <span className="text-muted-foreground">PubMed: </span>
                  <a 
                    href={`https://pubmed.ncbi.nlm.nih.gov/${paper.OriginalPaperPubMedID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {paper.OriginalPaperPubMedID}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Retraction Info */}
          <div className="space-y-2 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
            <h4 className="font-semibold text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              Retraction Notice
            </h4>
            <div className="space-y-1.5 text-sm">
              {paper.RetractionDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-foreground font-medium">{formatDate(paper.RetractionDate)}</span>
                </div>
              )}
              {paper.RetractionDOI && (
                <div className="text-xs">
                  <span className="text-muted-foreground">DOI: </span>
                  <a 
                    href={`https://doi.org/${paper.RetractionDOI}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-primary hover:underline break-all"
                  >
                    {paper.RetractionDOI}
                  </a>
                </div>
              )}
              {paper.RetractionPubMedID && (
                <div className="text-xs">
                  <span className="text-muted-foreground">PubMed: </span>
                  <a 
                    href={`https://pubmed.ncbi.nlm.nih.gov/${paper.RetractionPubMedID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {paper.RetractionPubMedID}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reason for Retraction - High visibility */}
        {reasonAnalysis && (
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${reasonAnalysis.severity === 'critical' ? 'text-red-500' : reasonAnalysis.severity === 'high' ? 'text-orange-500' : reasonAnalysis.severity === 'medium' ? 'text-yellow-500' : 'text-muted-foreground'}`} />
              Reason for Retraction
              {reasonAnalysis.severity !== 'normal' && (
                <Badge variant="outline" className={`text-[10px] ${reasonAnalysis.severity === 'critical' ? 'text-red-500 border-red-500/50' : reasonAnalysis.severity === 'high' ? 'text-orange-500 border-orange-500/50' : 'text-yellow-500 border-yellow-500/50'}`}>
                  {reasonAnalysis.severity.toUpperCase()}
                </Badge>
              )}
            </h4>
            <p className={`text-sm text-foreground p-3 rounded-md ${reasonAnalysis.style}`}>
              {reasonAnalysis.text}
            </p>
          </div>
        )}

        {/* URL Link */}
        {paper.URLS && (
          <div className="pt-2">
            <a
              href={paper.URLS}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium hover:underline transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              View Original Source
            </a>
          </div>
        )}

        {/* Notes - Secondary info */}
        {paper.Notes && (
          <div className="pt-2 border-t border-border">
            <details className="group">
              <summary className="text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                Additional Notes
              </summary>
              <p className="text-sm text-foreground mt-2 pl-2 border-l-2 border-muted">
                {paper.Notes}
              </p>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ResultCard.displayName = 'ResultCard';

export default ResultCard;
