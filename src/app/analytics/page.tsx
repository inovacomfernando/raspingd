
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Activity, Gauge, Image as ImageIcon, AlertCircle, BarChartBig, SearchCode, Info, ListChecks, KeyRound, LinkIcon, FileTextIcon, CheckCircle, XCircle } from "lucide-react";
import { getPagespeedInsights, type PageSpeedOutput, type PageSpeedInput } from "@/ai/flows/get-pagespeed-insights";
import { getSeoAnalysis, type SeoAnalysisOutput, type SeoAnalysisInput } from "@/ai/flows/get-seo-analysis";
import { useTranslation } from '@/hooks/use-translation';
import { Progress } from '@/components/ui/progress';
import NextImage from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Integration } from "@/types/integration";

const LOCAL_STORAGE_INTEGRATIONS_KEY = "marketwiseApp_integrations";

export default function AnalyticsPage() {
  const { t } = useTranslation();

  // PageSpeed States
  const [targetUrl, setTargetUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [results, setResults] = useState<PageSpeedOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // SEO Analysis States
  const [seoTargetUrl, setSeoTargetUrl] = useState('');
  const [seoKeyword, setSeoKeyword] = useState('');
  const [seoResults, setSeoResults] = useState<SeoAnalysisOutput | null>(null);
  const [isSeoLoading, setIsSeoLoading] = useState(false);
  const [seoError, setSeoError] = useState<string | null>(null);
  const [searxngIntegrations, setSearxngIntegrations] = useState<Integration[]>([]);
  const [selectedSearxngInstanceId, setSelectedSearxngInstanceId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const storedIntegrations = localStorage.getItem(LOCAL_STORAGE_INTEGRATIONS_KEY);
    if (storedIntegrations) {
      try {
        const allIntegrations: Integration[] = JSON.parse(storedIntegrations);
        const filteredSearxng = allIntegrations.filter(
          (int) => int.serviceType === 'searxng_instance' && int.status === 'Active'
        );
        setSearxngIntegrations(filteredSearxng);
        if (filteredSearxng.length > 0 && !selectedSearxngInstanceId) {
          // setSelectedSearxngInstanceId(filteredSearxng[0].id); // Optionally pre-select first
        }
      } catch (e) {
        console.error("Failed to parse integrations for Analytics page:", e);
        setSearxngIntegrations([]);
      }
    }
  }, [selectedSearxngInstanceId]);


  const handlePageSpeedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl) {
      setError(t('analyticsPage.error.urlRequired'));
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const input: PageSpeedInput = { targetUrl };
      if (apiKey) {
        input.apiKey = apiKey;
      }
      const response = await getPagespeedInsights(input);
      if (response.errorMessage) {
        setError(response.errorMessage);
      } else {
        setResults(response);
      }
    } catch (err: any) {
      console.error("PageSpeed Analysis Error:", err);
      setError(err.message || t('analyticsPage.error.general'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeoAnalysisSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seoTargetUrl) {
      setSeoError(t('analyticsPage.seo.error.urlRequired'));
      return;
    }
    if (searxngIntegrations.length > 0 && !selectedSearxngInstanceId && seoKeyword.trim()) {
        // Require SearxNG instance only if integrations are available AND a keyword is provided
        setSeoError(t('analyticsPage.seo.error.noSearxngInstanceForKeyword'));
        return;
    }


    setIsSeoLoading(true);
    setSeoError(null);
    setSeoResults(null);

    const selectedInstance = searxngIntegrations.find(int => int.id === selectedSearxngInstanceId);

    try {
      const input: SeoAnalysisInput = { 
        targetUrl: seoTargetUrl,
        keyword: seoKeyword.trim() || undefined, 
        searxngInstanceUrl: selectedInstance?.apiUrl, // Pass undefined if no instance selected
        searxngApiKey: selectedInstance?.apiKey,
      };
      
      const response = await getSeoAnalysis(input);
      if (response.overallErrorMessage) {
        setSeoError(response.overallErrorMessage);
      } else {
        setSeoResults(response);
      }
    } catch (err: any) {
      console.error("SEO Analysis Error:", err);
      setSeoError(err.message || t('analyticsPage.seo.error.general'));
    } finally {
      setIsSeoLoading(false);
    }
  };


  const MetricCard = ({ title, value, unit, score, description, idealRange }: { title: string, value?: string | number, unit?: string, score?: number | null, description?: string, idealRange?: string }) => {
    let scoreColorClass = 'bg-gray-500';
    if (score !== null && score !== undefined) {
        if (score >= 0.9) scoreColorClass = 'bg-green-500';
        else if (score >= 0.5) scoreColorClass = 'bg-yellow-500';
        else scoreColorClass = 'bg-red-500';
    }
    
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          {score !== null && score !== undefined && (
             <div className="flex items-center gap-2 mt-1">
                <div className={`w-3 h-3 rounded-full ${scoreColorClass}`}></div>
                <span className="text-xs text-muted-foreground">Score: {(score * 100).toFixed(0)}/100</span>
             </div>
          )}
        </CardHeader>
        <CardContent>
          {value !== undefined && <p className="text-2xl font-bold">{value}{unit}</p>}
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          {idealRange && <p className="text-xs text-blue-600 mt-1">Ideal: {idealRange}</p>}
        </CardContent>
      </Card>
    );
  };
  
  const getScoreColor = (score: number | null | undefined): string => {
    if (score === null || score === undefined) return 'bg-gray-200 dark:bg-gray-700';
    if (score >= 0.9) return 'bg-green-500';
    if (score >= 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };


  return (
    <div className="flex flex-col gap-8">
      {/* PageSpeed Insights Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            {t('analyticsPage.title')}
          </CardTitle>
          <CardDescription>{t('analyticsPage.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePageSpeedSubmit} className="space-y-4">
            <div>
              <Label htmlFor="targetUrl">{t('analyticsPage.form.urlLabel')}</Label>
              <Input
                id="targetUrl"
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder={t('analyticsPage.form.urlPlaceholder')}
                className="mt-1 shadow-sm"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="apiKey">{t('analyticsPage.form.apiKeyLabel')}</Label>
              <Input
                id="apiKey"
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={t('analyticsPage.form.apiKeyPlaceholder')}
                className="mt-1 shadow-sm"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">{t('analyticsPage.form.apiKeyDescription')}</p>
            </div>
            <Button type="submit" disabled={isLoading || !targetUrl} className="w-full sm:w-auto">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('analyticsPage.form.buttonLoading')}
                </>
              ) : (
                t('analyticsPage.form.buttonSubmit')
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="shadow-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('analyticsPage.error.title')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results && results.performanceScore !== null && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Gauge className="h-6 w-6 text-primary" />
                {t('analyticsPage.results.overallPerformance')}
            </CardTitle>
             <CardDescription>{t('analyticsPage.results.forUrl', { url: targetUrl })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
                <div 
                    className="mx-auto mb-2 h-32 w-32 rounded-full flex items-center justify-center text-white text-4xl font-bold"
                    style={{ background: getScoreColor(results.performanceScore) }}
                >
                    {((results.performanceScore ?? 0) * 100).toFixed(0)}
                </div>
                <Progress 
                    value={((results.performanceScore ?? 0) * 100)} 
                    className="w-full h-3 [&>div]:rounded-full" 
                    indicatorClassName={getScoreColor(results.performanceScore)}
                />
                <p className="text-sm text-muted-foreground mt-2">{t('analyticsPage.results.performanceScoreDesc')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.metrics?.firstContentfulPaint && (
                <MetricCard 
                  title={results.metrics.firstContentfulPaint.title}
                  value={results.metrics.firstContentfulPaint.displayValue}
                  score={results.metrics.firstContentfulPaint.score}
                  description={results.metrics.firstContentfulPaint.description?.substring(0, results.metrics.firstContentfulPaint.description.indexOf('[Learn more]'))}
                  idealRange="0-1.8s"
                />
              )}
              {results.metrics?.largestContentfulPaint && (
                <MetricCard 
                  title={results.metrics.largestContentfulPaint.title}
                  value={results.metrics.largestContentfulPaint.displayValue}
                  score={results.metrics.largestContentfulPaint.score}
                  description={results.metrics.largestContentfulPaint.description?.substring(0, results.metrics.largestContentfulPaint.description.indexOf('[Learn more]'))}
                  idealRange="0-2.5s"
                />
              )}
              {results.metrics?.cumulativeLayoutShift && (
                <MetricCard 
                  title={results.metrics.cumulativeLayoutShift.title}
                  value={results.metrics.cumulativeLayoutShift.displayValue}
                  score={results.metrics.cumulativeLayoutShift.score}
                  description={results.metrics.cumulativeLayoutShift.description?.substring(0, results.metrics.cumulativeLayoutShift.description.indexOf('[Learn more]'))}
                  idealRange="0-0.1"
                />
              )}
              {results.metrics?.speedIndex && (
                <MetricCard 
                  title={results.metrics.speedIndex.title}
                  value={results.metrics.speedIndex.displayValue}
                  score={results.metrics.speedIndex.score}
                  description={results.metrics.speedIndex.description?.substring(0, results.metrics.speedIndex.description.indexOf('[Learn more]'))}
                  idealRange="0-3.4s"
                />
              )}
              {results.metrics?.interactive && (
                <MetricCard 
                  title={results.metrics.interactive.title}
                  value={results.metrics.interactive.displayValue}
                  score={results.metrics.interactive.score}
                  description={results.metrics.interactive.description?.substring(0, results.metrics.interactive.description.indexOf('[Learn more]'))}
                  idealRange="0-3.8s"
                />
              )}
              {results.metrics?.totalBlockingTime && (
                <MetricCard 
                  title={results.metrics.totalBlockingTime.title}
                  value={results.metrics.totalBlockingTime.displayValue}
                  score={results.metrics.totalBlockingTime.score}
                  description={results.metrics.totalBlockingTime.description?.substring(0, results.metrics.totalBlockingTime.description.indexOf('[Learn more]'))}
                  idealRange="0-200ms"
                />
              )}
            </div>
             {results.screenshotData && (
                <Card className="mt-6 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ImageIcon className="h-5 w-5 text-primary" />
                            {t('analyticsPage.results.finalScreenshot')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <NextImage 
                            src={results.screenshotData} 
                            alt={t('analyticsPage.results.finalScreenshotAlt')}
                            width={360}
                            height={640}
                            className="border rounded-md shadow-md"
                            data-ai-hint="website screenshot"
                        />
                    </CardContent>
                </Card>
            )}
            {results.loadExperience?.overall_category && (
                 <Card className="mt-6 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                           <BarChartBig className="h-5 w-5 text-primary" />
                           {t('analyticsPage.results.cruxTitle')}
                        </CardTitle>
                        <CardDescription>
                            {t('analyticsPage.results.cruxOverall')}: <span className={`font-semibold ${results.loadExperience.overall_category === 'FAST' ? 'text-green-600' : results.loadExperience.overall_category === 'AVERAGE' ? 'text-yellow-600' : 'text-red-600'}`}>{results.loadExperience.overall_category}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{t('analyticsPage.results.cruxDescription')}</p>
                    </CardContent>
                 </Card>
            )}
          </CardContent>
        </Card>
      )}
      
      <Separator className="my-8" />

      {/* SEO Analysis Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchCode className="h-6 w-6 text-primary" />
            {t('analyticsPage.seo.title')}
          </CardTitle>
          <CardDescription>{t('analyticsPage.seo.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSeoAnalysisSubmit} className="space-y-4">
            <div>
              <Label htmlFor="seoTargetUrl">{t('analyticsPage.seo.form.urlLabel')}</Label>
              <Input
                id="seoTargetUrl"
                type="url"
                value={seoTargetUrl}
                onChange={(e) => setSeoTargetUrl(e.target.value)}
                placeholder={t('analyticsPage.seo.form.urlPlaceholder')}
                className="mt-1 shadow-sm"
                disabled={isSeoLoading}
              />
            </div>
            <div>
              <Label htmlFor="seoKeyword">{t('analyticsPage.seo.form.keywordLabel')}</Label>
              <Input
                id="seoKeyword"
                type="text"
                value={seoKeyword}
                onChange={(e) => setSeoKeyword(e.target.value)}
                placeholder={t('analyticsPage.seo.form.keywordPlaceholder')}
                className="mt-1 shadow-sm"
                disabled={isSeoLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">{t('analyticsPage.seo.form.keywordDescription')}</p>
            </div>
            
            <div>
              <Label htmlFor="searxngInstance">{t('analyticsPage.seo.form.searxngInstanceLabel')}</Label>
              {searxngIntegrations.length > 0 ? (
                <Select
                  value={selectedSearxngInstanceId}
                  onValueChange={setSelectedSearxngInstanceId}
                  disabled={isSeoLoading}
                >
                  <SelectTrigger className="mt-1 shadow-sm">
                    <SelectValue placeholder={t('analyticsPage.seo.form.searxngInstancePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {searxngIntegrations.map(int => (
                      <SelectItem key={int.id} value={int.id}>
                        {int.name} ({int.apiUrl})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground mt-1 bg-muted p-2 rounded-md">
                  {t('analyticsPage.seo.form.searxngInstanceNotConfigured')}
                </p>
              )}
               <p className="text-xs text-muted-foreground mt-1">{t('analyticsPage.seo.form.searxngInstanceDescription')}</p>
            </div>

            <Button 
                type="submit" 
                disabled={isSeoLoading || !seoTargetUrl || (searxngIntegrations.length > 0 && !selectedSearxngInstanceId && !!seoKeyword.trim())} 
                className="w-full sm:w-auto"
            >
              {isSeoLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('analyticsPage.seo.form.buttonLoading')}
                </>
              ) : (
                t('analyticsPage.seo.form.buttonSubmit')
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {seoError && !seoResults && ( 
        <Alert variant="destructive" className="shadow-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('analyticsPage.seo.error.title')}</AlertTitle>
          <AlertDescription>{seoError}</AlertDescription>
        </Alert>
      )}

      {seoResults && (
        <Card className="shadow-lg mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                {t('analyticsPage.seo.results.title', { url: seoTargetUrl })}
            </CardTitle>
            {seoResults.overallErrorMessage && <CardDescription className="text-destructive">{seoResults.overallErrorMessage}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Direct Fetch Results */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-md flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-primary" />
                    {t('analyticsPage.seo.results.directFetchTitle')}
                </CardTitle>
                {seoResults.directFetchResults?.fetchError && (
                    <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4"/>
                        <AlertTitle>{t('analyticsPage.seo.results.errorDirectFetch')}</AlertTitle>
                        <AlertDescription>{seoResults.directFetchResults.fetchError}</AlertDescription>
                    </Alert>
                )}
              </CardHeader>
              {!seoResults.directFetchResults?.fetchError && (
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <span className="font-semibold">{t('analyticsPage.seo.results.pageTitle')}: </span>
                    <span className="text-muted-foreground">{seoResults.directFetchResults?.pageTitle || t('analyticsPage.seo.results.notAvailable')}</span>
                  </div>
                  <div>
                    <span className="font-semibold">{t('analyticsPage.seo.results.metaDescription')}: </span>
                    <span className="text-muted-foreground">{seoResults.directFetchResults?.metaDescription || t('analyticsPage.seo.results.notAvailable')}</span>
                  </div>
                  <div>
                    <span className="font-semibold">{t('analyticsPage.seo.results.h1Headings')}:</span>
                    {seoResults.directFetchResults?.h1Headings && seoResults.directFetchResults.h1Headings.length > 0 ? (
                      <ul className="list-disc list-inside pl-4 text-muted-foreground">
                        {seoResults.directFetchResults.h1Headings.map((h1, index) => <li key={index}>{h1}</li>)}
                      </ul>
                    ) : (
                      <span className="text-muted-foreground ml-1">{t('analyticsPage.seo.results.noH1s')}</span>
                    )}
                  </div>
                  {seoResults.directFetchResults?.keywordAnalysis && (
                    <div>
                      <h4 className="font-semibold">{t('analyticsPage.seo.results.keywordAnalysis.title', { keyword: seoResults.directFetchResults.keywordAnalysis.keyword })}</h4>
                      <p className="text-muted-foreground">
                        {t('analyticsPage.seo.results.keywordAnalysis.present')}:{' '}
                        <span className={`font-medium ${seoResults.directFetchResults.keywordAnalysis.isPresent ? 'text-green-600' : 'text-red-600'}`}>
                          {seoResults.directFetchResults.keywordAnalysis.isPresent ? t('analyticsPage.seo.results.keywordAnalysis.yes') : t('analyticsPage.seo.results.keywordAnalysis.no')}
                        </span>
                        {seoResults.directFetchResults.keywordAnalysis.isPresent && seoResults.directFetchResults.keywordAnalysis.count !== undefined && (
                          ` (${t('analyticsPage.seo.results.keywordAnalysis.count')}: ${seoResults.directFetchResults.keywordAnalysis.count})`
                        )}
                      </p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* SearxNG Search Results */}
            {seoResults.searxngSearchResults?.searchPerformed && (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-md flex items-center gap-2">
                      <SearchCode className="h-4 w-4 text-primary" />
                      {t('analyticsPage.seo.results.searxngTitle', { keyword: seoKeyword || t('analyticsPage.seo.results.targetUrlPlaceholder') })}
                  </CardTitle>
                  {seoResults.searxngSearchResults.fetchError && (
                      <Alert variant="destructive" className="mt-2">
                          <AlertCircle className="h-4 w-4"/>
                          <AlertTitle>{t('analyticsPage.seo.results.errorSearxngFetch')}</AlertTitle>
                          <AlertDescription>{seoResults.searxngSearchResults.fetchError}</AlertDescription>
                      </Alert>
                  )}
                   {seoResults.searxngSearchResults.searchUrl && (
                        <p className="text-xs text-muted-foreground">
                            {t('analyticsPage.seo.results.searxngQueryUrl')}: <a href={seoResults.searxngSearchResults.searchUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{seoResults.searxngSearchResults.searchUrl}</a>
                        </p>
                    )}
                </CardHeader>
                {!seoResults.searxngSearchResults?.fetchError && (
                    <CardContent className="space-y-3 text-sm">
                    {seoResults.searxngSearchResults.targetFoundInResults !== undefined && (
                        <div className="flex items-center">
                            {seoResults.searxngSearchResults.targetFoundInResults ? <CheckCircle className="h-5 w-5 text-green-500 mr-2"/> : <XCircle className="h-5 w-5 text-red-500 mr-2"/>}
                            <span className={seoResults.searxngSearchResults.targetFoundInResults ? 'text-green-600' : 'text-red-600'}>
                                {seoResults.searxngSearchResults.targetFoundInResults ? t('analyticsPage.seo.results.searxngTargetFound') : t('analyticsPage.seo.results.searxngTargetNotFound')}
                            </span>
                        </div>
                    )}
                    {seoResults.searxngSearchResults.targetFoundInResults && (
                        <>
                            <div>
                                <span className="font-semibold">{t('analyticsPage.seo.results.searxngResultTitle')}: </span>
                                <span className="text-muted-foreground">{seoResults.searxngSearchResults.resultTitle || t('analyticsPage.seo.results.notAvailable')}</span>
                            </div>
                            <div>
                                <span className="font-semibold">{t('analyticsPage.seo.results.searxngResultSnippet')}: </span>
                                <span className="text-muted-foreground">{seoResults.searxngSearchResults.resultSnippet || t('analyticsPage.seo.results.notAvailable')}</span>
                            </div>
                        </>
                    )}
                     {seoResults.searxngSearchResults.totalResultsEstimate && (
                        <div>
                            <span className="font-semibold">{t('analyticsPage.seo.results.searxngTotalResults')}: </span>
                            <span className="text-muted-foreground">{seoResults.searxngSearchResults.totalResultsEstimate}</span>
                        </div>
                    )}
                    {/* Show message if search performed but target not found and no total results either */}
                    {(seoResults.searxngSearchResults.targetFoundInResults === false && !seoResults.searxngSearchResults.totalResultsEstimate) && (
                         <p className="text-muted-foreground">{t('analyticsPage.seo.results.searxngNoSpecificResults')}</p>
                    )}
                    </CardContent>
                )}
              </Card>
            )}
             {!seoResults.searxngSearchResults?.searchPerformed && seoResults.searxngSearchResults?.fetchError && (
                 <Alert variant="default" className="mt-2">
                    <Info className="h-4 w-4"/>
                    <AlertTitle>{t('analyticsPage.seo.results.searxngNotPerformedTitle')}</AlertTitle>
                    <AlertDescription>{seoResults.searxngSearchResults.fetchError}</AlertDescription>
                </Alert>
             )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

