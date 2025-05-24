
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/use-translation";
import type { Integration } from "@/types/integration"; // Ensure Integration type is available for serviceType

const integrationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: "integrations.form.validation.nameMinLength" }),
  // This 'type' field in the form corresponds to 'serviceType' in the Integration object
  type: z.enum(["api_key", "oauth_token", "access_token", "pagespeed_api_key", "searxng_instance"], {
    required_error: "integrations.form.validation.typeRequired",
  }),
  credentials: z.string().optional().refine(val => {
    // Basic validation: if provided, must be at least 10 chars.
    // More specific validation (e.g. URL for searxng) could be added if needed.
    return !val || val.trim().length === 0 || val.trim().length >= 10;
  }, {
    message: "integrations.form.validation.credentialsMinLengthIfProvided",
  }),
  description: z.string().optional(),
});

export type IntegrationFormValues = z.infer<typeof integrationSchema>;

interface IntegrationFormProps {
  initialValues?: IntegrationFormValues;
  onFormSubmit: (data: IntegrationFormValues) => Promise<void>;
  isLoadingExternally?: boolean;
  submitText?: string;
  onCancel?: () => void;
  cancelText?: string;
}

export function IntegrationForm({
  initialValues,
  onFormSubmit,
  isLoadingExternally = false,
  submitText,
  onCancel,
  cancelText = "Cancel"
}: IntegrationFormProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<IntegrationFormValues>({
    resolver: zodResolver(integrationSchema),
    defaultValues: initialValues || {
      name: "",
      type: undefined,
      credentials: "", 
      description: "",
    },
  });

  const selectedIntegrationType = form.watch("type");

  useEffect(() => {
    if (initialValues) {
      form.reset({ ...initialValues, credentials: initialValues.credentials || "" });
    } else {
      form.reset({
        name: "",
        type: undefined,
        credentials: "",
        description: "",
        id: undefined,
      });
    }
  }, [initialValues, form]);

  async function handleSubmit(data: IntegrationFormValues) {
    setIsSubmitting(true);
    const submitData = {
      ...data,
      credentials: data.credentials?.trim() === "" ? undefined : data.credentials?.trim(),
    };
    await onFormSubmit(submitData);
    setIsSubmitting(false);
    if (!initialValues?.id) {
       form.reset({
        name: "",
        type: undefined,
        credentials: "",
        description: "",
        id: undefined,
      });
    }
  }

  const effectiveSubmitText = submitText || (initialValues?.id ? t('integrations.form.submitUpdate') : t('integrations.form.submitAdd'));

  let credentialsLabel = t('integrations.form.credentials.labelGeneric');
  let credentialsPlaceholder = t('integrations.form.credentials.placeholderEdit');
  let credentialsDescription = initialValues?.id ? t('integrations.form.credentials.descriptionEdit') : t('integrations.form.credentials.descriptionAdd');

  if (selectedIntegrationType === 'searxng_instance') {
    credentialsLabel = t('integrations.form.credentials.labelSearxNG');
    credentialsPlaceholder = t('integrations.form.credentials.placeholderSearxNG');
    credentialsDescription = t('integrations.form.credentials.descriptionSearxNG');
  } else if (selectedIntegrationType === 'pagespeed_api_key') {
    credentialsLabel = t('integrations.form.credentials.labelPageSpeed');
    credentialsPlaceholder = t('integrations.form.credentials.placeholderPageSpeed');
    credentialsDescription = t('integrations.form.credentials.descriptionPageSpeed');
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('integrations.form.name.label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('integrations.form.name.placeholder')} {...field} className="shadow-sm" />
              </FormControl>
              <FormDescription>{t('integrations.form.name.description')}</FormDescription>
              <FormMessage>{form.formState.errors.name && t(form.formState.errors.name.message as string)}</FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('integrations.form.type.label')}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="shadow-sm">
                    <SelectValue placeholder={t('integrations.form.type.placeholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="api_key">{t('integrations.type.apiKey')}</SelectItem>
                  <SelectItem value="oauth_token">{t('integrations.type.oauthToken')}</SelectItem>
                  <SelectItem value="access_token">{t('integrations.type.accessToken')}</SelectItem>
                  <SelectItem value="pagespeed_api_key">{t('integrations.type.pagespeedApiKey')}</SelectItem>
                  <SelectItem value="searxng_instance">{t('integrations.type.searxngInstance')}</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>{t('integrations.form.type.description')}</FormDescription>
              <FormMessage>{form.formState.errors.type && t(form.formState.errors.type.message as string)}</FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="credentials"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{credentialsLabel}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={credentialsPlaceholder}
                  rows={selectedIntegrationType === 'searxng_instance' ? 2 : 4} // Shorter for URL
                  {...field}
                  className="shadow-sm"
                />
              </FormControl>
              <FormDescription>{credentialsDescription}</FormDescription>
              <FormMessage>{form.formState.errors.credentials && t(form.formState.errors.credentials.message as string)}</FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('integrations.form.description.label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('integrations.form.description.placeholder')} {...field} value={field.value || ''} className="shadow-sm" />
              </FormControl>
              <FormDescription>{t('integrations.form.description.description')}</FormDescription>
              <FormMessage>{form.formState.errors.description && t(form.formState.errors.description.message as string)}</FormMessage>
            </FormItem>
          )}
        />

        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting || isLoadingExternally}>
              {cancelText}
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting || isLoadingExternally} className="min-w-[120px]">
            {isSubmitting || isLoadingExternally ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {initialValues?.id ? t('integrations.form.loadingUpdate') : t('integrations.form.loadingAdd')}
              </>
            ) : (
              effectiveSubmitText
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
