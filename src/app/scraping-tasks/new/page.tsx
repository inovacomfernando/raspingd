
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrapingTaskForm, type ScrapingTaskFormSubmitValues } from "@/components/scraping-tasks/scraping-task-form";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from 'uuid';
import type { ScrapingTaskWithId } from "@/types/scraping-task";
import { useTranslation } from "@/hooks/use-translation";
import type { TeamMember } from "@/types/team-member";
import { Loader2 } from "lucide-react";

const LOCAL_STORAGE_TASKS_KEY = "scrapingTasksApp_tasks";
const LOCAL_STORAGE_TEAM_MEMBERS_KEY = "teamMembersApp_members";

export default function NewScrapingTaskPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);

  useEffect(() => {
    setIsLoadingMembers(true);
    try {
        const storedMembers = localStorage.getItem(LOCAL_STORAGE_TEAM_MEMBERS_KEY);
        if (storedMembers) {
          const parsedMembers = JSON.parse(storedMembers);
          if (Array.isArray(parsedMembers)) {
            setTeamMembers(parsedMembers);
          } else {
            console.warn(`localStorage item ${LOCAL_STORAGE_TEAM_MEMBERS_KEY} is not an array. Resetting.`);
            setTeamMembers([]);
            localStorage.setItem(LOCAL_STORAGE_TEAM_MEMBERS_KEY, JSON.stringify([]));
          }
        } else {
          localStorage.setItem(LOCAL_STORAGE_TEAM_MEMBERS_KEY, JSON.stringify([]));
          setTeamMembers([]);
        }
    } catch (error) {
        console.error(`Failed to parse ${LOCAL_STORAGE_TEAM_MEMBERS_KEY} from localStorage on new task page:`, error);
        localStorage.setItem(LOCAL_STORAGE_TEAM_MEMBERS_KEY, JSON.stringify([]));
        setTeamMembers([]);
    }
    setIsLoadingMembers(false);
  }, []);

  const handleCreateTask = async (data: ScrapingTaskFormSubmitValues) => {
    setIsSubmitting(true);
    
    const newTask: ScrapingTaskWithId = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      status: data.frequency === "once" ? "Pending" : "Scheduled",
      requesterName: data.requesterName, 
    };
    
    try {
      let currentTasks: ScrapingTaskWithId[] = [];
      const storedTasksJson = localStorage.getItem(LOCAL_STORAGE_TASKS_KEY);
      if (storedTasksJson) {
        try {
          const parsedTasks = JSON.parse(storedTasksJson);
          if (Array.isArray(parsedTasks)) {
            currentTasks = parsedTasks;
          } else {
            console.warn(`localStorage item ${LOCAL_STORAGE_TASKS_KEY} is not an array during task creation. Resetting to empty.`);
            currentTasks = [];
          }
        } catch (error) {
          console.error(`Failed to parse existing tasks from ${LOCAL_STORAGE_TASKS_KEY}. Starting with new task only.`, error);
          currentTasks = [];
        }
      }
      
      currentTasks.push(newTask);
      localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(currentTasks.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())));

      toast({
        title: t('scrapingTasks.toast.createdTitle'), 
        description: t('scrapingTasks.toast.createdDescription', { taskName: newTask.taskName }),
      });
      router.push('/scraping-tasks'); 
    } catch (error) {
        console.error("Error saving new task to localStorage:", error);
        toast({
            title: "Error",
            description: "Could not save the new task.",
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoadingMembers) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{t('scrapingTasks.new.title')}</CardTitle>
            <CardDescription>{t('scrapingTasks.new.description')}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center p-8">
 <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
 <p className="ml-4">{t('scrapingTasks.new.loadingMembers')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>{t('scrapingTasks.new.title')}</CardTitle>
          <CardDescription>
            {t('scrapingTasks.new.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrapingTaskForm
            onFormSubmit={handleCreateTask}
            isLoadingExternally={isSubmitting}
            teamMembers={teamMembers}
          />
        </CardContent>
      </Card>
    </div>
  );
}
