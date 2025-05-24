
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
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
import type { TeamMember } from "@/types/team-member";
import { useTranslation } from "@/hooks/use-translation";

const scrapingTaskSchema = z.object({
  taskName: z.string().min(3, { message: "Task name must be at least 3 characters." }),
  targetUrl: z.string().url({ message: "Please enter a valid URL." }),
  dataToExtract: z.string().min(1, { message: "Specify what data to extract (e.g., product titles, prices)." }),
  selectors: z.string().min(1, { message: "CSS selectors or XPath are required." }),
  frequency: z.enum(["once", "hourly", "daily", "weekly", "monthly"], {
    required_error: "You need to select a scraping frequency.",
  }),
  description: z.string().optional(),
  requesterId: z.string().optional(),
  // requesterName is not part of the form schema, it's derived
});

// Values including the derived requesterName for submission
export interface ScrapingTaskFormSubmitValues extends z.infer<typeof scrapingTaskSchema> {
  requesterName?: string;
}

// Values used by the form internally
export type ScrapingTaskFormValues = z.infer<typeof scrapingTaskSchema>;


interface ScrapingTaskFormProps {
  initialValues?: ScrapingTaskFormValues; // Should not include requesterName
  onFormSubmit: (data: ScrapingTaskFormSubmitValues) => Promise<void>;
  isLoadingExternally?: boolean;
  submitButtonText?: string;
  onCancel?: () => void;
  cancelButtonText?: string;
  teamMembers: TeamMember[];
}

export function ScrapingTaskForm({
  initialValues,
  onFormSubmit,
  isLoadingExternally = false,
  submitButtonText: propSubmitButtonText, // Renamed to avoid conflict
  onCancel,
  cancelButtonText: propCancelButtonText = "Cancel", // Renamed
  teamMembers,
}: ScrapingTaskFormProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultSubmitText = initialValues ? t('scrapingTaskForm.submitButton.update') : t('scrapingTaskForm.submitButton.create');
  const submitButtonText = propSubmitButtonText || defaultSubmitText;
  const cancelButtonText = propCancelButtonText || t('scrapingTaskForm.cancelButton');


  const form = useForm<ScrapingTaskFormValues>({
    resolver: zodResolver(scrapingTaskSchema),
    defaultValues: initialValues || {
      taskName: "",
      targetUrl: "",
      dataToExtract: "",
      selectors: "",
      frequency: undefined,
      description: "",
      requesterId: undefined,
    },
  });

  useEffect(() => {
    if (initialValues) {
      form.reset(initialValues);
    } else {
      form.reset({
        taskName: "",
        targetUrl: "",
        dataToExtract: "",
        selectors: "",
        frequency: undefined,
        description: "",
        requesterId: undefined,
      });
    }
  }, [initialValues, form]);

  async function handleSubmit(data: ScrapingTaskFormValues) {
    setIsSubmitting(true);
    const selectedRequester = teamMembers.find(tm => tm.id === data.requesterId);
    const submitData: ScrapingTaskFormSubmitValues = {
      ...data,
      requesterName: selectedRequester?.name,
    };
    await onFormSubmit(submitData);
    setIsSubmitting(false);
    if (!initialValues) { // Only reset if it's an "add" form
       form.reset({
        taskName: "",
        targetUrl: "",
        dataToExtract: "",
        selectors: "",
        frequency: undefined,
        description: "",
        requesterId: undefined,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="taskName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('scrapingTaskForm.taskName.label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('scrapingTaskForm.taskName.placeholder')} {...field} className="shadow-sm" />
              </FormControl>
              <FormDescription>{t('scrapingTaskForm.taskName.description')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="targetUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('scrapingTaskForm.targetUrl.label')}</FormLabel>
              <FormControl>
                <Input type="url" placeholder={t('scrapingTaskForm.targetUrl.placeholder')} {...field} className="shadow-sm" />
              </FormControl>
              <FormDescription>{t('scrapingTaskForm.targetUrl.description')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dataToExtract"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('scrapingTaskForm.dataToExtract.label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('scrapingTaskForm.dataToExtract.placeholder')} {...field} className="shadow-sm" />
              </FormControl>
              <FormDescription>{t('scrapingTaskForm.dataToExtract.description')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="selectors"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('scrapingTaskForm.selectors.label')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('scrapingTaskForm.selectors.placeholder')}
                  rows={4}
                  {...field}
                  className="shadow-sm font-mono text-sm"
                />
              </FormControl>
              <FormDescription>{t('scrapingTaskForm.selectors.description')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('scrapingTaskForm.frequency.label')}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="shadow-sm">
                    <SelectValue placeholder={t('scrapingTaskForm.frequency.placeholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="once">{t('scrapingTaskForm.frequency.once')}</SelectItem>
                  <SelectItem value="hourly">{t('scrapingTaskForm.frequency.hourly')}</SelectItem>
                  <SelectItem value="daily">{t('scrapingTaskForm.frequency.daily')}</SelectItem>
                  <SelectItem value="weekly">{t('scrapingTaskForm.frequency.weekly')}</SelectItem>
                  <SelectItem value="monthly">{t('scrapingTaskForm.frequency.monthly')}</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>{t('scrapingTaskForm.frequency.description')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requesterId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('scrapingTaskForm.requester.label')}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="shadow-sm">
                    <SelectValue placeholder={t('scrapingTaskForm.requester.placeholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {teamMembers && teamMembers.length > 0 ? (
                    teamMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} ({member.role})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-members" disabled>
                      {t('scrapingTaskForm.requester.noMembers')}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormDescription>{t('scrapingTaskForm.requester.description')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('scrapingTaskForm.description.label')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('scrapingTaskForm.description.placeholder')}
                  rows={3}
                  {...field}
                  value={field.value || ''} 
                  className="shadow-sm"
                />
              </FormControl>
              <FormDescription>{t('scrapingTaskForm.description.description')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting || isLoadingExternally}>
              {cancelButtonText}
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting || isLoadingExternally || (teamMembers.length === 0 && !form.watch('requesterId'))} className="min-w-[120px]">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {initialValues ? t('scrapingTaskForm.submitButton.updating') : t('scrapingTaskForm.submitButton.creating')}
              </>
            ) : (
              submitButtonText
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

