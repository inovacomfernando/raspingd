
"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { summarizeMarketTrends, type SummarizeMarketTrendsOutput, type SummarizeMarketTrendsInput } from "@/ai/flows/summarize-market-trends";
import { Loader2, Terminal, FileDown, Search, Lightbulb, Sparkles, TrendingUp, History, RotateCcw } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

interface InsightsGeneratorProps {
  initialScrapedData?: string;
}

interface AIInsightHistoryEntry {
  id: string;
  timestamp: string;
  inputScrapedData: string;
  output: SummarizeMarketTrendsOutput;
  language: string;
}

const LOCAL_STORAGE_HISTORY_KEY = "aiInsightsHistory_v1";
const MAX_HISTORY_ENTRIES = 5;

export function InsightsGenerator({ initialScrapedData }: InsightsGeneratorProps) {
  const [scrapedData, setScrapedData] = useState(initialScrapedData || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SummarizeMarketTrendsOutput | null>(null);
  const { t, currentLanguage } = useTranslation();
  const { toast } = useToast();

  const [history, setHistory] = useState<AIInsightHistoryEntry[]>([]);

  useEffect(() => {
    if (initialScrapedData) {
      setScrapedData(initialScrapedData);
    }
  }, [initialScrapedData]);

  useEffect(() => {
    // Load history from localStorage on component mount
    let loadedHistory: AIInsightHistoryEntry[] = [];
    try {
      const storedHistoryJson = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (storedHistoryJson) {
        const parsedHistory = JSON.parse(storedHistoryJson);
        if (Array.isArray(parsedHistory)) {
          loadedHistory = parsedHistory;
        } else {
          console.warn(`localStorage item ${LOCAL_STORAGE_HISTORY_KEY} is not an array. Resetting.`);
          localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify([]));
        }
      } else {
        localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify([]));
      }
    } catch (e) {
      console.error("Failed to load AI insights history from localStorage. Resetting.", e);
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify([]));
    }
    setHistory([...loadedHistory]); // Ensure new array reference
  }, []);

  const saveToHistory = (input: SummarizeMarketTrendsInput, output: SummarizeMarketTrendsOutput) => {
    const newEntry: AIInsightHistoryEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      inputScrapedData: input.scrapedData,
      output,
      language: input.targetLanguage || currentLanguage,
    };

    setHistory(prevHistory => {
      const updatedHistory = [newEntry, ...prevHistory].slice(0, MAX_HISTORY_ENTRIES);
      try {
        localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updatedHistory));
      } catch (e) {
        console.error("Failed to save AI insights history to localStorage:", e);
        // Optionally, inform the user if saving history failed
        toast({
            title: t('aiInsights.history.saveErrorTitle'),
            description: t('aiInsights.history.saveErrorDesc'),
            variant: "destructive",
        });
      }
      return [...updatedHistory]; // Ensure new array reference
    });
  };

  const loadFromHistory = (entry: AIInsightHistoryEntry) => {
    setScrapedData(entry.inputScrapedData);
    setResults(entry.output);
    toast({
      title: t('aiInsights.history.loadedTitle'),
      description: t('aiInsights.history.loadedDescription', { timestamp: format(new Date(entry.timestamp), "P p") }),
    });
  };


  const handleSubmit = async () => {
    if (!scrapedData.trim()) {
      setError(t('aiInsights.error.emptyData'));
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const inputParams: SummarizeMarketTrendsInput = { 
        scrapedData,
        targetLanguage: currentLanguage 
      };
      const aiResponse = await summarizeMarketTrends(inputParams);
      setResults(aiResponse);
      saveToHistory(inputParams, aiResponse);
    } catch (err) {
      console.error("AI Insights Error:", err);
      setError(err instanceof Error ? err.message : t('aiInsights.error.unexpected'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = (dataToReport?: SummarizeMarketTrendsOutput, reportLanguage?: string) => {
    const reportData = dataToReport || results;
    const langForReport = reportLanguage || currentLanguage;

    if (!reportData) return;

    let keywordSectionHtml = '';
    if (reportData.paidMediaKeywords && reportData.paidMediaKeywords.length > 0) {
      keywordSectionHtml += `
        <div class="section">
          <h2>${t('aiInsights.report.paidMediaKeywords.title')}</h2>
          <table>
            <thead>
              <tr>
                <th>${t('aiInsights.report.paidMediaKeywords.table.keyword')}</th>
                <th>${t('aiInsights.report.paidMediaKeywords.table.type')}</th>
                <th>${t('aiInsights.report.paidMediaKeywords.table.platforms')}</th>
                <th>${t('aiInsights.report.paidMediaKeywords.table.volume')}</th>
                <th>${t('aiInsights.report.paidMediaKeywords.table.rationale')}</th>
              </tr>
            </thead>
            <tbody>
      `;
      reportData.paidMediaKeywords.forEach(kw => {
        keywordSectionHtml += `
          <tr>
            <td>${kw.keyword} (${kw.language})</td>
            <td>${kw.type === 'interest' ? t('aiInsights.keywords.type.interest') : t('aiInsights.keywords.type.intention')}</td>
            <td>${kw.platformSuitability.join(', ')}</td>
            <td>${kw.estimatedVolume}</td>
            <td>${kw.rationale}</td>
          </tr>
        `;
      });
      keywordSectionHtml += `
            </tbody>
          </table>
        </div>
      `;
    }

    const printableContent = `
      <html>
        <head>
          <title>${t('aiInsights.report.title')}</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; 
              margin: 0; 
              padding: 0;
              background-color: #f8f9fa; 
              color: #343a40;
              line-height: 1.6;
            }
            .container {
              max-width: 900px;
              margin: 20px auto;
              padding: 25px;
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 0 15px rgba(0,0,0,0.1);
            }
            .report-header {
              text-align: center;
              padding-bottom: 20px;
              border-bottom: 1px solid #dee2e6;
              margin-bottom: 25px;
            }
            .report-header h1 {
              font-size: 28px;
              color: #2d3748;
              margin: 0;
            }
            .section { 
              margin-bottom: 25px; 
              padding: 20px; 
              border: 1px solid #e9ecef; 
              border-radius: 6px; 
              background-color: #fff;
            }
            .section h2 { 
              font-size: 20px;
              color: #4a5568;
              margin-top: 0; 
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 1px solid #eee;
            }
            pre { 
              white-space: pre-wrap; 
              word-wrap: break-word; 
              background-color: #f8f9fa; 
              padding: 15px; 
              border-radius: 4px; 
              font-size: 14px;
              color: #495057;
              border: 1px solid #dee2e6;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th, td {
              border: 1px solid #dee2e6;
              padding: 8px;
              text-align: left;
              font-size: 13px;
            }
            th {
              background-color: #f1f3f5;
              font-weight: 600;
            }
            @media print {
              body {
                background-color: #ffffff;
              }
              .container {
                box-shadow: none;
                margin: 0;
                max-width: 100%;
                border-radius: 0;
              }
              .btn-print {
                display: none;
              }
            }
          </style>
        </head>
        <body lang="${langForReport}">
          <div class="container">
            <div class="report-header">
              <h1>${t('aiInsights.report.title')}</h1>
            </div>
            <div class="section">
              <h2>${t('aiInsights.report.marketSummary')}</h2>
              <pre>${reportData.summary}</pre>
            </div>
            <div class="section">
              <h2>${t('aiInsights.report.actionableRecommendations')}</h2>
              <pre>${reportData.recommendations}</pre>
            </div>
            ${keywordSectionHtml}
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printableContent);
      printWindow.document.close();
      // It's better to let the user click print in the new window
      // printWindow.print(); 
    } else {
      alert(t('aiInsights.report.popupError'));
    }
  };

  const getVolumeBadgeColor = (volume: 'high' | 'medium' | 'low' | 'n/a' | undefined) => {
    switch (volume) {
      case 'high': return 'bg-green-500 hover:bg-green-600 text-white';
      case 'medium': return 'bg-yellow-400 hover:bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 hover:bg-blue-600 text-white';
      default: return 'bg-gray-400 hover:bg-gray-500 text-white';
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="scrapedData" className="block text-sm font-medium text-foreground mb-1">
          {t('aiInsights.pasteData.label')}
        </label>
        <Textarea
          id="scrapedData"
          value={scrapedData}
          onChange={(e) => setScrapedData(e.target.value)}
          placeholder={t('aiInsights.pasteData.placeholder')}
          rows={10}
          className="shadow-sm"
          disabled={isLoading}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          {t('aiInsights.pasteData.description')}
        </p>
      </div>

      <Button onClick={handleSubmit} disabled={isLoading || !scrapedData.trim()} className="w-full sm:w-auto">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('aiInsights.button.generating')}
          </>
        ) : (
          t('aiInsights.button.generate')
        )}
      </Button>

      {error && (
        <Alert variant="destructive" className="shadow-md">
          <Terminal className="h-4 w-4" />
          <AlertTitle>{t('aiInsights.error.title')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results && (
        <div className="space-y-6 mt-6">
           <div className="flex justify-end">
            <Button onClick={() => handleDownloadReport()} variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              {t('aiInsights.button.downloadReport')}
            </Button>
          </div>
          <Card className="shadow-md" id="ai-summary-section">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" /> 
                {t('aiInsights.results.marketSummary.title')}
              </CardTitle>
              <CardDescription>{t('aiInsights.results.marketSummary.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{results.summary}</p>
            </CardContent>
          </Card>

          <Card className="shadow-md" id="ai-recommendations-section">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {t('aiInsights.results.actionableRecommendations.title')}
              </CardTitle>
              <CardDescription>{t('aiInsights.results.actionableRecommendations.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{results.recommendations}</p>
            </CardContent>
          </Card>

          {results.paidMediaKeywords && results.paidMediaKeywords.length > 0 && (
            <Card className="shadow-md" id="ai-keywords-section">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  {t('aiInsights.results.paidMediaKeywords.title')}
                </CardTitle>
                <CardDescription>{t('aiInsights.results.paidMediaKeywords.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('aiInsights.results.paidMediaKeywords.table.keyword')}</TableHead>
                      <TableHead>{t('aiInsights.results.paidMediaKeywords.table.type')}</TableHead>
                      <TableHead>{t('aiInsights.results.paidMediaKeywords.table.platforms')}</TableHead>
                      <TableHead>{t('aiInsights.results.paidMediaKeywords.table.volume')}</TableHead>
                      <TableHead>{t('aiInsights.results.paidMediaKeywords.table.rationale')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.paidMediaKeywords.map((kw, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{kw.keyword} <span className="text-xs text-muted-foreground">({kw.language})</span></TableCell>
                        <TableCell>
                          <Badge 
                            variant={kw.type === 'intention' ? "default" : "secondary"}
                            className={cn(kw.type === 'intention' && "bg-blue-500 hover:bg-blue-600", kw.type === 'interest' && "bg-purple-500 hover:bg-purple-600" )}
                          >
                            {kw.type === 'interest' ? <TrendingUp className="mr-1 h-3 w-3"/> : <Lightbulb className="mr-1 h-3 w-3"/>}
                            {kw.type === 'interest' ? t('aiInsights.keywords.type.interest') : t('aiInsights.keywords.type.intention')}
                          </Badge>
                        </TableCell>
                        <TableCell>{kw.platformSuitability.join(', ')}</TableCell>
                        <TableCell>
                           <Badge className={cn("capitalize", getVolumeBadgeColor(kw.estimatedVolume))}>
                            {kw.estimatedVolume}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{kw.rationale}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* History Section */}
      <Card className="shadow-md mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            {t('aiInsights.history.title')}
          </CardTitle>
          <CardDescription>{t('aiInsights.history.description', { count: MAX_HISTORY_ENTRIES.toString() })}</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('aiInsights.history.noHistory')}</p>
          ) : (
            <ul className="space-y-3">
              {history.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md shadow-sm">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {format(new Date(entry.timestamp), "MMM d, yyyy HH:mm:ss")} ({entry.language.toUpperCase()})
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-md">
                      {t('aiInsights.history.inputDataPrefix')} {entry.inputScrapedData.substring(0, 70)}{entry.inputScrapedData.length > 70 ? "..." : ""}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => loadFromHistory(entry)}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {t('aiInsights.history.loadButton')}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

