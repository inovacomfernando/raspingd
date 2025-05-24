
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; 
import { InsightsGenerator } from "@/components/ai/insights-generator";
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from "react";

export default function AiInsightsPage() {
  const searchParams = useSearchParams();
  const [initialData, setInitialData] = useState<string | undefined>(undefined);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (searchParams.get('fromTask') === 'true') {
      const dataFromTask = localStorage.getItem('aiInsightsDataFromTask');
      if (dataFromTask) {
        setInitialData(dataFromTask);
        // Optional: remove the item after reading to prevent re-use on refresh
        // localStorage.removeItem('aiInsightsDataFromTask'); 
      }
    }
    setIsLoadingData(false);
  }, [searchParams]);

  if (isLoadingData && searchParams.get('fromTask') === 'true') {
    return (
        <div className="flex flex-col gap-6">
            <Card className="shadow-lg">
                <CardHeader>
                <CardTitle>AI-Driven Insights</CardTitle>
                <CardDescription>Loading data for analysis...</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center p-8">
                    {/* You can use a spinner or loader component here */}
                    <p>Loading data...</p>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>AI-Driven Insights</CardTitle>
          <CardDescription> 
            Leverage AI to analyze your scraped data, identify key trends, anomalies, and correlations, 
            and receive actionable business recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InsightsGenerator initialScrapedData={initialData} />
        </CardContent>
      </Card>
    </div>
  );
}
