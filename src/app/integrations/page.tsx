
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IntegrationForm, type IntegrationFormValues } from "@/components/integrations/integration-form";
import { IntegrationList, type Integration } from "@/components/integrations/integration-list";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from "@/hooks/use-translation";

const LOCAL_STORAGE_INTEGRATIONS_KEY = "marketwiseApp_integrations";

export default function IntegrationsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isAddingIntegration, setIsAddingIntegration] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);


  const handleAddIntegration = async (data: IntegrationFormValues) => {
    setIsAddingIntegration(true);
    
    const newIntegration: Integration = {
      id: uuidv4(),
      name: data.name,
      serviceType: data.type as Integration['serviceType'],
      apiUrl: data.type === 'searxng_instance' ? data.credentials : undefined,
      apiKey: data.type !== 'searxng_instance' ? data.credentials : undefined,
      status: "Active",
      lastUsed: new Date().toISOString(),
      description: data.description || "",
    };

    try {
      let integrations: Integration[] = [];
      const storedIntegrationsJson = localStorage.getItem(LOCAL_STORAGE_INTEGRATIONS_KEY);
      if (storedIntegrationsJson) {
        try {
          const parsedIntegrations = JSON.parse(storedIntegrationsJson);
          if (Array.isArray(parsedIntegrations)) {
            integrations = parsedIntegrations;
          } else {
            console.warn(`localStorage item ${LOCAL_STORAGE_INTEGRATIONS_KEY} is not an array. Resetting.`);
            localStorage.setItem(LOCAL_STORAGE_INTEGRATIONS_KEY, JSON.stringify([])); // Reset
            integrations = []; // Fallback to empty array if not an array
          }
        } catch (parseError) {
          console.error(`Failed to parse integrations from ${LOCAL_STORAGE_INTEGRATIONS_KEY}. Resetting.`, parseError);
          localStorage.setItem(LOCAL_STORAGE_INTEGRATIONS_KEY, JSON.stringify([])); // Reset
          integrations = []; 
        }
      } else {
         localStorage.setItem(LOCAL_STORAGE_INTEGRATIONS_KEY, JSON.stringify([])); // Initialize if not exists
         integrations = [];
      }
      
      integrations.push(newIntegration);
      localStorage.setItem(LOCAL_STORAGE_INTEGRATIONS_KEY, JSON.stringify(integrations));

      toast({
        title: t('integrations.toast.addedTitle'),
        description: t('integrations.toast.addedDesc', { name: newIntegration.name }),
      });
      setRefreshKey(prevKey => prevKey + 1); 
    } catch (error) {
      console.error("Failed to save integration:", error);
      toast({
        title: t('integrations.toast.addErrorTitle'),
        description: String(error) || t('integrations.toast.addErrorDesc'),
        variant: "destructive",
      });
    }
    
    setIsAddingIntegration(false);
  };

  return (
    <div className="flex flex-col gap-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>{t('integrations.add.title')}</CardTitle>
          <CardDescription>
            {t('integrations.add.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IntegrationForm 
            onFormSubmit={handleAddIntegration}
            isLoadingExternally={isAddingIntegration}
          />
        </CardContent>
      </Card>
      
      <Separator />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>{t('integrations.list.title')}</CardTitle>
          <CardDescription>{t('integrations.list.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <IntegrationList refreshKey={refreshKey} />
        </CardContent>
      </Card>
    </div>
  );
}

