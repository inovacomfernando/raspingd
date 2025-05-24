
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Power, PowerOff, Eye, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState, useEffect, useCallback } from "react";
import { IntegrationForm, type IntegrationFormValues } from "./integration-form";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { format } from 'date-fns';
import type { Integration } from "@/types/integration";

const LOCAL_STORAGE_INTEGRATIONS_KEY = "marketwiseApp_integrations";

const initialIntegrationsSeedData: Integration[] = [
  { id: "seed_int_1", name: "Google Analytics (Sample)", serviceType: "oauth_token", apiKey: "sample_oauth_token_data_seed_1", status: "Active", lastUsed: new Date(Date.now() - 86400000 * 2).toISOString(), description: "Tracks website visitors" },
  { id: "seed_int_2", name: "Mailchimp (Sample)", serviceType: "api_key", apiKey: "sample_api_key_data_seed_2", status: "Active", lastUsed: new Date(Date.now() - 86400000 * 4).toISOString(), description: "For email campaigns" },
  { id: "seed_int_3", name: "My PageSpeed API", serviceType: "pagespeed_api_key", apiKey: "YOUR_PAGESPEED_API_KEY_HERE", status: "Active", lastUsed: new Date().toISOString(), description: "For PageSpeed Insights"},
  { id: "seed_int_4", name: "Public SearxNG Instance", serviceType: "searxng_instance", apiUrl: "https://searx.work", status: "Active", lastUsed: new Date().toISOString(), description: "A public SearxNG instance"},
];

function formatIntegrationType(serviceType: Integration['serviceType'], t: (key: string) => string): string {
  switch (serviceType) {
    case 'api_key': return t('integrations.type.apiKey');
    case 'oauth_token': return t('integrations.type.oauthToken');
    case 'access_token': return t('integrations.type.accessToken');
    case 'pagespeed_api_key': return t('integrations.type.pagespeedApiKey');
    case 'searxng_instance': return t('integrations.type.searxngInstance');
    default:
      const exhaustiveCheck: never = serviceType; // Should cause a compile-time error if a case is missed
      return String(serviceType); // Fallback for any unhandled cases (shouldn't happen with exhaustive check)
  }
}

interface IntegrationListProps {
  refreshKey?: number;
}

export function IntegrationList({ refreshKey }: IntegrationListProps) {
  const { t } = useTranslation();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingIntegrationFormValues, setEditingIntegrationFormValues] = useState<IntegrationFormValues | null>(null);
  const [viewingIntegration, setViewingIntegration] = useState<Integration | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const loadIntegrations = useCallback(() => {
    setIsLoading(true);
    let loadedIntegrations: Integration[] = [];
    try {
      const storedIntegrationsJson = localStorage.getItem(LOCAL_STORAGE_INTEGRATIONS_KEY);
      if (storedIntegrationsJson) {
        const parsedIntegrations = JSON.parse(storedIntegrationsJson);
        if (Array.isArray(parsedIntegrations)) {
          loadedIntegrations = parsedIntegrations;
        } else {
          console.warn(`localStorage item ${LOCAL_STORAGE_INTEGRATIONS_KEY} is not an array. Resetting with seed data.`);
          localStorage.setItem(LOCAL_STORAGE_INTEGRATIONS_KEY, JSON.stringify(initialIntegrationsSeedData));
          loadedIntegrations = initialIntegrationsSeedData;
        }
      } else { // Key doesn't exist, seed initial data
        console.log(`Seeding initial integrations data to ${LOCAL_STORAGE_INTEGRATIONS_KEY}.`);
        localStorage.setItem(LOCAL_STORAGE_INTEGRATIONS_KEY, JSON.stringify(initialIntegrationsSeedData));
        loadedIntegrations = initialIntegrationsSeedData;
      }
    } catch (error) {
      console.error(`Failed to parse ${LOCAL_STORAGE_INTEGRATIONS_KEY} from localStorage. Resetting with seed data.`, error);
      localStorage.setItem(LOCAL_STORAGE_INTEGRATIONS_KEY, JSON.stringify(initialIntegrationsSeedData));
      loadedIntegrations = initialIntegrationsSeedData;
    }
    setIntegrations([...loadedIntegrations]); // Ensure new array reference
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations, refreshKey]);


  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LOCAL_STORAGE_INTEGRATIONS_KEY) {
        loadIntegrations();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadIntegrations]);


  const saveIntegrations = useCallback((updatedIntegrations: Integration[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_INTEGRATIONS_KEY, JSON.stringify(updatedIntegrations));
      setIntegrations([...updatedIntegrations]); // Ensure new array reference for re-render
    } catch (error) {
      console.error("Failed to save integrations to localStorage:", error);
      toast({
        title: t('integrations.toast.saveErrorTitle'),
        description: t('integrations.toast.saveErrorDesc'),
        variant: "destructive",
      });
    }
  }, [toast, t]);

  const toggleStatus = (id: string) => {
    const updatedIntegrations = integrations.map(int =>
      int.id === id ? { ...int, status: int.status === "Active" ? "Inactive" : "Active" } : int
    );
    saveIntegrations(updatedIntegrations);
  };

  const handleDelete = (id: string) => {
    const integrationToDelete = integrations.find(int => int.id === id);
    const updatedIntegrations = integrations.filter(int => int.id !== id);
    saveIntegrations(updatedIntegrations);
    toast({
      title: t('integrations.toast.deletedTitle'),
      description: t('integrations.toast.deletedDesc', { name: integrationToDelete?.name || 'Integration' }),
    });
  };

  const handleEdit = (integration: Integration) => {
    setEditingIntegrationFormValues({
      id: integration.id,
      name: integration.name,
      type: integration.serviceType, // Use serviceType for the form's 'type' field
      credentials: integration.serviceType === 'searxng_instance' ? integration.apiUrl : integration.apiKey,
      description: integration.description || "",
    });
  };

  const handleView = (integration: Integration) => {
    setViewingIntegration(integration);
  };

  const handleUpdateIntegration = async (formData: IntegrationFormValues) => {
    if (!formData.id) return;
    setIsUpdating(true);

    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

    const updatedIntegrations = integrations.map(int => {
      if (int.id === formData.id) {
        const updatedIntegration: Integration = {
          ...int, // Preserve existing fields like lastUsed, status
          name: formData.name,
          serviceType: formData.type as Integration['serviceType'],
          description: formData.description || "",
        };

        if (formData.credentials && formData.credentials.trim() !== "") {
          if (formData.type === 'searxng_instance') {
            updatedIntegration.apiUrl = formData.credentials.trim();
            // Keep existing apiKey or clear it based on more complex logic if needed
            // updatedIntegration.apiKey = undefined; 
          } else {
            updatedIntegration.apiKey = formData.credentials.trim();
            // Keep existing apiUrl or clear it
            // updatedIntegration.apiUrl = undefined;
          }
        } else {
          // If credentials field was blank, keep existing values. This prevents accidental wiping.
          // This logic ensures that if type changes, old credential might be kept if not relevant, or one might need to clear it manually
          // For simplicity, we assume if the type changes and new credential is not provided, the old one is irrelevant.
          // More sophisticated logic would clear the "other" credential type if the serviceType changes.
          // For now, just ensure that if we don't provide new credentials, the correct old one for the *current* type is maintained.
           if (int.serviceType === 'searxng_instance' && formData.type === 'searxng_instance') {
             updatedIntegration.apiUrl = int.apiUrl; // Keep old URL if not updating
           } else if (int.serviceType !== 'searxng_instance' && formData.type !== 'searxng_instance') {
             updatedIntegration.apiKey = int.apiKey; // Keep old API key if not updating
           }
           // If type changed AND credentials not provided, the old credentials might be for the wrong type.
           // This part might need refinement based on desired behavior when type changes + credentials are blank.
           // For instance, if changing from SearxNG to API Key and credentials blank, should apiUrl be cleared?
           // Let's assume for now the most critical is not to lose the *current* credential if not actively changed.
        }
        return updatedIntegration;
      }
      return int;
    });
    saveIntegrations(updatedIntegrations);

    toast({
      title: t('integrations.toast.updatedTitle'),
      description: t('integrations.toast.updatedDesc', { name: formData.name }),
    });
    setEditingIntegrationFormValues(null);
    setIsUpdating(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1,2,3].map(i => (
          <Card key={i} className="shadow-sm animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="h-6 w-1/3 bg-muted rounded"></div>
              <div className="h-4 w-1/4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 w-1/2 bg-muted rounded mb-2"></div>
              <div className="h-4 w-1/4 bg-muted rounded"></div>
              <div className="flex space-x-2 mt-3">
                <div className="h-8 w-24 bg-muted rounded"></div>
                <div className="h-8 w-8 bg-muted rounded-full"></div>
                <div className="h-8 w-8 bg-muted rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
         <div className="flex items-center justify-center p-8">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
          </div>
      </div>
    );
  }

  if (integrations.length === 0 && !isLoading) {
    return <p className="text-muted-foreground">{t('integrations.list.noIntegrations')}</p>;
  }

  return (
    <div className="space-y-4">
      {integrations.map((integration) => (
        <Card key={integration.id} className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-start justify-between pb-2 gap-2">
            <div>
              <CardTitle className="text-lg">{integration.name}</CardTitle>
              <CardDescription className="text-xs">{formatIntegrationType(integration.serviceType, t)}</CardDescription>
            </div>
            <Badge variant={integration.status === "Active" ? "default" : "outline"}
              className={cn(
                integration.status === "Active" ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-700/30 dark:text-green-300 dark:border-green-700/50"
                                            : "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700/30 dark:text-gray-300 dark:border-gray-700/50"
              )}
            >
              {integration.status === "Active" ? t('integrations.status.active') : t('integrations.status.inactive')}
            </Badge>
          </CardHeader>
          <CardContent>
            {integration.description && (
                 <p className="text-sm text-muted-foreground mb-2">{integration.description}</p>
            )}
            <div className="text-sm text-muted-foreground mb-3">
              {t('integrations.list.lastUsed')}: {integration.lastUsed ? format(new Date(integration.lastUsed), "P p") : 'N/A'}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => toggleStatus(integration.id)}>
                {integration.status === "Active" ? <PowerOff className="mr-2 h-4 w-4" /> : <Power className="mr-2 h-4 w-4" />}
                {integration.status === "Active" ? t('integrations.actions.deactivate') : t('integrations.actions.activate')}
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => handleView(integration)} title={t('integrations.actions.view')}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">{t('integrations.actions.view')}</span>
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => handleEdit(integration)} title={t('integrations.actions.edit')}>
                <Edit2 className="h-4 w-4" />
                <span className="sr-only">{t('integrations.actions.edit')}</span>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive-hover" title={t('integrations.actions.delete')}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">{t('integrations.actions.delete')}</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('integrations.deleteDialog.title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('integrations.deleteDialog.description', { name: integration.name })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('integrations.deleteDialog.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(integration.id)} className="bg-destructive hover:bg-destructive/90">
                      {t('integrations.deleteDialog.delete')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      ))}

      {editingIntegrationFormValues && (
        <Dialog open={!!editingIntegrationFormValues} onOpenChange={(isOpen) => !isOpen && setEditingIntegrationFormValues(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t('integrations.editDialog.title')}</DialogTitle>
              <DialogDescription>
                {t('integrations.editDialog.description')}
              </DialogDescription>
            </DialogHeader>
            <IntegrationForm
              initialValues={editingIntegrationFormValues}
              onFormSubmit={handleUpdateIntegration}
              isLoadingExternally={isUpdating}
              onCancel={() => setEditingIntegrationFormValues(null)}
              cancelText={t('integrations.form.cancelButton')}
            />
          </DialogContent>
        </Dialog>
      )}

      {viewingIntegration && (
        <Dialog open={!!viewingIntegration} onOpenChange={(isOpen) => !isOpen && setViewingIntegration(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('integrations.viewDialog.title', { name: viewingIntegration.name })}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4 text-sm">
              <div>
                <span className="font-semibold text-muted-foreground">{t('integrations.form.name.label')}: </span>
                <span>{viewingIntegration.name}</span>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground">{t('integrations.form.type.label')}: </span>
                <span>{formatIntegrationType(viewingIntegration.serviceType, t)}</span>
              </div>
              {viewingIntegration.description && (
                <div>
                  <span className="font-semibold text-muted-foreground">{t('integrations.form.description.label')}: </span>
                  <span>{viewingIntegration.description}</span>
                </div>
              )}
              <div>
                 <span className="font-semibold text-muted-foreground">
                  {viewingIntegration.serviceType === 'searxng_instance' ? t('integrations.form.credentials.labelSearxNG') : t('integrations.form.credentials.labelGeneric')}:
                </span>
                <span className="font-mono bg-muted px-2 py-1 rounded text-xs ml-1">
                  {(viewingIntegration.serviceType === 'searxng_instance' ? viewingIntegration.apiUrl : viewingIntegration.apiKey) ? '••••••••••••••••' : t('integrations.viewDialog.noCredentialsSet')}
                </span>
              </div>
               <div>
                <span className="font-semibold text-muted-foreground">{t('integrations.status.label')}: </span>
                <Badge variant={viewingIntegration.status === "Active" ? "default" : "outline"}
                  className={cn(
                    viewingIntegration.status === "Active" ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-700/30 dark:text-green-300 dark:border-green-700/50"
                                                : "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700/30 dark:text-gray-300 dark:border-gray-700/50"
                  )}
                >
                  {viewingIntegration.status === "Active" ? t('integrations.status.active') : t('integrations.status.inactive')}
                </Badge>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground">{t('integrations.list.lastUsed')}: </span>
                <span>{viewingIntegration.lastUsed ? format(new Date(viewingIntegration.lastUsed), "P p") : 'N/A'}</span>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">{t('integrations.viewDialog.closeButton')}</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

