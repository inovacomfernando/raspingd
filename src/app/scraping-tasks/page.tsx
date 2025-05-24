
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Settings2, Trash2, Edit, Info, Play, Eye, Loader2, AlertTriangle, FileText, DownloadCloud, Brain } from "lucide-react";
import NextImage from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { ScrapingTaskWithId } from "@/types/scraping-task";
import { useToast } from "@/hooks/use-toast";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ScrapingTaskForm, type ScrapingTaskFormSubmitValues } from "@/components/scraping-tasks/scraping-task-form";
import { useTranslation } from "@/hooks/use-translation";
import type { TeamMember } from "@/types/team-member";

const LOCAL_STORAGE_TASKS_KEY = "scrapingTasksApp_tasks";
const LOCAL_STORAGE_TEAM_MEMBERS_KEY = "teamMembersApp_members";


export default function ScrapingTasksPage() {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<ScrapingTaskWithId[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [taskToViewData, setTaskToViewData] = useState<ScrapingTaskWithId | null>(null);
  const [editingTask, setEditingTask] = useState<ScrapingTaskWithId | null>(null);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);
  const [runningTasks, setRunningTasks] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);


  const loadTasks = useCallback(() => {
    // console.log("[ScrapingTasksPage] loadTasks called");
    setIsLoadingTasks(true);
    let currentTasks: ScrapingTaskWithId[] = [];
    try {
      const storedTasksJson = localStorage.getItem(LOCAL_STORAGE_TASKS_KEY);
      if (storedTasksJson) {
        const parsedTasks = JSON.parse(storedTasksJson);
        if (Array.isArray(parsedTasks)) {
          currentTasks = parsedTasks;
        } else {
          console.warn(`[ScrapingTasksPage] localStorage item ${LOCAL_STORAGE_TASKS_KEY} is not an array. Resetting.`);
          localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify([]));
          currentTasks = []; // Ensure it's an empty array
        }
      } else {
        // console.log(`[ScrapingTasksPage] No tasks found in localStorage for key ${LOCAL_STORAGE_TASKS_KEY}. Initializing with empty array.`);
        localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify([]));
        currentTasks = []; // Ensure it's an empty array
      }
    } catch (error) {
      console.error(`[ScrapingTasksPage] Failed to parse ${LOCAL_STORAGE_TASKS_KEY} from localStorage. Resetting.`, error);
      localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify([]));
      currentTasks = []; // Ensure it's an empty array
    }
    
    const sortedTasks = currentTasks.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    // console.log("[ScrapingTasksPage] Tasks loaded from localStorage:", sortedTasks);
    setTasks([...sortedTasks]); // Ensure new array reference
    setIsLoadingTasks(false);
  }, []); // Removed toast and t as they are stable from hooks


  useEffect(() => {
    loadTasks();

    const handleStorageChange = (event: StorageEvent) => {
      // console.log('[ScrapingTasksPage] Storage event fired:', event.key);
      if (event.key === LOCAL_STORAGE_TASKS_KEY) {
        // console.log('[ScrapingTasksPage] Relevant storage event for tasks detected. Reloading tasks.');
        loadTasks(); 
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Load team members for the edit form
    try {
      const storedMembersJson = localStorage.getItem(LOCAL_STORAGE_TEAM_MEMBERS_KEY);
      if (storedMembersJson) {
        const parsedMembers = JSON.parse(storedMembersJson);
        if (Array.isArray(parsedMembers)) {
          setTeamMembers(parsedMembers);
        } else {
          console.warn(`[ScrapingTasksPage] localStorage item ${LOCAL_STORAGE_TEAM_MEMBERS_KEY} is not an array.`);
          setTeamMembers([]); // Default to empty array
        }
      } else {
        setTeamMembers([]); // Default to empty array
      }
    } catch (error) {
      console.error(`[ScrapingTasksPage] Failed to parse ${LOCAL_STORAGE_TEAM_MEMBERS_KEY} from localStorage.`, error);
      setTeamMembers([]); // Default to empty array
    }
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadTasks]);

  const saveTasksToLocalStorage = useCallback((updatedTasks: ScrapingTaskWithId[]) => {
    try {
        const sortedTasks = updatedTasks.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(sortedTasks));
        setTasks([...sortedTasks]); // Ensure new array reference and re-render
        // console.log("[ScrapingTasksPage] Tasks saved to localStorage and state updated:", sortedTasks);
    } catch (error) {
        console.error("[ScrapingTasksPage] Failed to save tasks to localStorage:", error);
        toast({
            title: t('scrapingTasks.toast.errorTitle', { context: 'save' }),
            description: t('scrapingTasks.toast.errorDescription.localStorage'),
            variant: "destructive"
        });
    }
  }, [toast, t]);

  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = tasks.find(taskItem => taskItem.id === taskId);
    const updatedTasks = tasks.filter(taskItem => taskItem.id !== taskId);
    saveTasksToLocalStorage(updatedTasks);
    toast({
      title: t('scrapingTasks.toast.deletedTitle'),
      description: t('scrapingTasks.toast.deletedDescription', {taskName: taskToDelete?.taskName || ''}),
    });
  };
  
  const handleEditTask = (task: ScrapingTaskWithId) => {
    setEditingTask(task);
  };

  const handleUpdateTask = async (data: ScrapingTaskFormSubmitValues) => {
    if (!editingTask) return;
    setIsUpdatingTask(true);

    const updatedTask: ScrapingTaskWithId = {
        ...editingTask, 
        ...data, 
        requesterName: data.requesterName, 
    };

    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

    // Read current tasks from state, update, then save
    const currentTasks = tasks.map(taskItem => taskItem.id === updatedTask.id ? updatedTask : taskItem);
    saveTasksToLocalStorage(currentTasks);

    toast({
      title: t('scrapingTasks.toast.updatedTitle'),
      description: t('scrapingTasks.toast.updatedDescription', {taskName: updatedTask.taskName}),
    });
    setIsUpdatingTask(false);
    setEditingTask(null); 
  };


  const handleRunTask = async (taskId: string) => {
    setRunningTasks(prev => new Set(prev).add(taskId));
    
    let taskToRun = tasks.find(item => item.id === taskId); 

    if (!taskToRun) {
      toast({ title: "Error", description: "Task not found.", variant: "destructive" });
      setRunningTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
      return;
    }

    // Optimistically update UI
    const tasksWithRunningStatus = tasks.map(task => 
      task.id === taskId ? { ...task, status: "Running" as const, lastScrapedData: t('scrapingTasks.status.running') } : task
    );
    saveTasksToLocalStorage(tasksWithRunningStatus); // Save this optimistic update

    let finalStatus: ScrapingTaskWithId['status'] = "Completed";
    let scrapedDataResult = "";

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          targetUrl: taskToRun.targetUrl, 
          selectors: taskToRun.selectors,
          dataToExtract: taskToRun.dataToExtract 
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('scrapingTasks.error.httpError', {status: response.status.toString()}));
      }
      
      scrapedDataResult = result.scrapedText || t('scrapingTasks.error.noDataFromApi');
      finalStatus = "Completed";
      toast({
        title: t('scrapingTasks.toast.completedTitle'),
        description: t('scrapingTasks.toast.completedDescription', {taskName: taskToRun.taskName}),
      });

    } catch (error: any) {
      console.error("[ScrapingTasksPage] Failed to run task:", error);
      finalStatus = "Failed";
      scrapedDataResult = t('scrapingTasks.error.scrapingFailed', {errorMessage: error.message});
      toast({
        title: t('scrapingTasks.toast.failedTitle'),
        description: t('scrapingTasks.toast.failedDescription', {taskName: taskToRun.taskName, errorMessage: error.message}),
        variant: "destructive",
      });
    }
    
    // Re-fetch current tasks from localStorage before final update to minimize race conditions
    let tasksFromStorageAfterRun: ScrapingTaskWithId[] = [];
    try {
        const currentTasksJson = localStorage.getItem(LOCAL_STORAGE_TASKS_KEY);
        if (currentTasksJson) {
            const parsed = JSON.parse(currentTasksJson);
            if (Array.isArray(parsed)) tasksFromStorageAfterRun = parsed;
            else tasksFromStorageAfterRun = []; // Fallback to empty if not an array
        } else {
            tasksFromStorageAfterRun = []; // Fallback to empty if key doesn't exist
        }
    } catch(e) {
        console.error("[ScrapingTasksPage] Error parsing current tasks from storage during run task final update", e);
        tasksFromStorageAfterRun = []; // Fallback to empty if parsing fails
    }
    
    const taskBeforeFinalUpdate = tasksFromStorageAfterRun.find(item => item.id === taskId) || taskToRun; 
    const updatedTaskAttempt: ScrapingTaskWithId = { 
      ...taskBeforeFinalUpdate, 
      status: finalStatus, 
      lastRun: new Date().toISOString(), 
      lastScrapedData: scrapedDataResult
    };
    
    const finalTasksState = tasksFromStorageAfterRun.map(taskItem => taskItem.id === taskId ? updatedTaskAttempt : taskItem); 
    saveTasksToLocalStorage(finalTasksState);
    
    setRunningTasks(prev => {
      const newSet = new Set(prev);
      newSet.delete(taskId);
      return newSet;
    });
  };

  const extractActualScrapedContent = (fullScrapedData: string | undefined): string => {
    if (!fullScrapedData) return "";
    const reportMarker = "--- Detailed Selector Report ---";
    const markerIndex = fullScrapedData.indexOf(reportMarker);
    
    let contentPart = markerIndex !== -1 ? fullScrapedData.substring(0, markerIndex) : fullScrapedData;
    
    contentPart = contentPart.replace(/^Successfully scraped content for "[^"]+":\s*\n*/i, "").trim();
    contentPart = contentPart.replace(/^No text content was extracted\.\s*\n*/i, "").trim();
    contentPart = contentPart.replace(/^Error during scraping:\s*\n*/i, "").trim();
    
    const runningStatusKey = 'scrapingTasks.status.running';
    const runningStatusText = t(runningStatusKey); 
    if (runningStatusText && runningStatusText !== runningStatusKey && runningStatusText !== "Executando...") { 
        contentPart = contentPart.replace(new RegExp(`^${runningStatusText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\.\\.\\.`, 'i'), "").trim();
    }

    return contentPart;
  };


  const handleExportToCSV = (task: ScrapingTaskWithId) => {
    if (!task.lastScrapedData) {
      toast({ title: t('scrapingTasks.export.noDataTitle'), variant: "destructive" });
      return;
    }

    const actualContent = extractActualScrapedContent(task.lastScrapedData);
    if (!actualContent.trim()) {
        toast({ title: t('scrapingTasks.export.noActualContentTitle'), variant: "destructive" });
        return;
    }
    
    const rows = actualContent.split(/\n---\n|\n/).map(line => line.trim()).filter(line => line.length > 0);
    if (rows.length === 0) {
        toast({ title: t('scrapingTasks.export.noRowsTitle'), variant: "destructive" });
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,ScrapedContent\n";
    rows.forEach(row => {
      const escapedRow = `"${row.replace(/"/g, '""')}"`; 
      csvContent += escapedRow + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${task.taskName.replace(/\s+/g, '_')}_scraped_data.csv`);
    document.body.appendChild(link); 
    link.click();
    document.body.removeChild(link);

    toast({ title: t('scrapingTasks.export.successTitle'), description: t('scrapingTasks.export.successDescription', {count: rows.length.toString()}) });
  };

  const handleGenerateAIInsights = (task: ScrapingTaskWithId) => {
    if (!task.lastScrapedData || task.status !== 'Completed') {
      toast({ title: t('scrapingTasks.aiInsights.noCompletedDataTitle'), description: t('scrapingTasks.aiInsights.noCompletedDataDescription'), variant: "destructive" });
      return;
    }
    const actualContent = extractActualScrapedContent(task.lastScrapedData);
     if (!actualContent.trim()) {
        toast({ title: t('scrapingTasks.aiInsights.noActualContentTitle'), variant: "destructive" });
        return;
    }
    localStorage.setItem('aiInsightsDataFromTask', actualContent);
    router.push('/ai-insights?fromTask=true');
  };


  if (isLoadingTasks) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{t('scrapingTasks.title')}</CardTitle>
            <CardDescription>{t('scrapingTasks.loadingDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('scrapingTasks.title')}</CardTitle>
            <CardDescription>{t('scrapingTasks.description')}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Link href="/scraping-tasks/new" passHref>
              <Button variant="default">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('scrapingTasks.buttons.createNew')}
              </Button>
            </Link>
            <Button variant="outline" disabled>
              <Settings2 className="mr-2 h-4 w-4" />
              {t('scrapingTasks.buttons.taskSettings')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg text-center bg-muted/20">
        <NextImage
          src="https://placehold.co/400x300.png"
          alt={t('scrapingTasks.noTasks.alt')}
          width={250}
          height={187}
          className="mb-6 rounded-md opacity-70 w-auto h-auto"
          data-ai-hint="empty list"
        />           
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                {t('scrapingTasks.noTasks.title')}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                {t('scrapingTasks.noTasks.description')}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('scrapingTasks.table.header.name')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('scrapingTasks.table.header.targetUrl')}</TableHead>
                  <TableHead>{t('scrapingTasks.table.header.frequency')}</TableHead>
                  <TableHead>{t('scrapingTasks.table.header.requester')}</TableHead>
                  <TableHead>{t('scrapingTasks.table.header.status')}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t('scrapingTasks.table.header.lastRun')}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t('scrapingTasks.table.header.createdAt')}</TableHead>
                  <TableHead className="text-right w-[240px]">{t('scrapingTasks.table.header.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.taskName}</TableCell>
                    <TableCell className="truncate max-w-[150px] hidden md:table-cell" title={task.targetUrl}>{task.targetUrl}</TableCell>
                    <TableCell>{t(`scrapingTaskForm.frequency.${task.frequency}`)}</TableCell>
                    <TableCell>{task.requesterName || t('scrapingTasks.table.requesterN_A')}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          task.status === "Completed" ? "default"
                          : task.status === "Running" ? "secondary"
                          : task.status === "Failed" ? "destructive"
                          : task.status === "Scheduled" ? "outline" 
                          : "outline" 
                        }
                        className={cn(
                          "text-xs", 
                          task.status === "Completed" && "bg-green-500 hover:bg-green-600 text-white",
                          task.status === "Running" && "bg-blue-500 hover:bg-blue-600 text-white",
                          task.status === "Pending" && "bg-yellow-400 hover:bg-yellow-500 text-black",
                          task.status === "Scheduled" && "bg-purple-500 hover:bg-purple-600 text-white",
                          task.status === "Failed" && "text-destructive-foreground"
                        )}
                      >
                        {runningTasks.has(task.id) || task.status === "Running" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                        {task.status === "Failed" && !runningTasks.has(task.id) ? <AlertTriangle className="mr-1 h-3 w-3" /> : null}
                        {t(`scrapingTasks.status.${task.status.toLowerCase()}`)}
                      </Badge>
                    </TableCell>
                     <TableCell className="hidden lg:table-cell">
                      {task.lastRun ? format(new Date(task.lastRun), "MMM d, yyyy HH:mm") : t('scrapingTasks.table.lastRunN_A')}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {format(new Date(task.createdAt), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      { (task.status === "Pending" || task.status === "Scheduled" || task.status === "Failed" || task.status === "Completed") && !runningTasks.has(task.id) && (
                        <Button variant="ghost" size="icon" onClick={() => handleRunTask(task.id)} title={t('scrapingTasks.actions.runTask')} className="text-green-600 hover:bg-green-500/10 hover:text-green-700" disabled={runningTasks.has(task.id)}>
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      { (task.status === "Completed" || task.status === "Failed") && task.lastScrapedData && !runningTasks.has(task.id) && (
                        <Button variant="ghost" size="icon" onClick={() => setTaskToViewData(task)} title={task.status === "Failed" ? t('scrapingTasks.actions.viewError') : t('scrapingTasks.actions.viewData')} 
                          className={cn(task.status === "Completed" ? "text-blue-600 hover:bg-blue-500/10 hover:text-blue-700" : "text-red-600 hover:bg-red-500/10 hover:text-red-700" )}
                          disabled={runningTasks.has(task.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleEditTask(task)} title={t('scrapingTasks.actions.editTask')} disabled={runningTasks.has(task.id)} className="text-muted-foreground hover:text-foreground">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" title={t('scrapingTasks.actions.deleteTask')} className="text-destructive hover:bg-destructive/10 hover:text-destructive-hover" disabled={runningTasks.has(task.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('scrapingTasks.deleteDialog.title')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('scrapingTasks.deleteDialog.description', { taskName: task.taskName })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('scrapingTasks.deleteDialog.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteTask(task.id)} className="bg-destructive hover:bg-destructive/90">
                              {t('scrapingTasks.deleteDialog.delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {tasks.length > 0 && (
        <Card className="shadow-sm bg-muted/30">
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                    <Info className="mr-2 h-4 w-4 text-blue-500"/>
                    {t('scrapingTasks.storageInfo.title')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                   {t('scrapingTasks.storageInfo.description')}
                </p>
            </CardContent>
        </Card>
      )}

      {taskToViewData && (
        <Dialog open={!!taskToViewData} onOpenChange={(isOpen) => !isOpen && setTaskToViewData(null)}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {taskToViewData.status === "Failed" ? t('scrapingTasks.viewDataDialog.errorTitle') : t('scrapingTasks.viewDataDialog.successTitle')} {taskToViewData.taskName}
              </DialogTitle>
              <DialogDescription>
                {t('scrapingTasks.viewDataDialog.targetUrl')}: {taskToViewData.targetUrl}
                <br />
                {t('scrapingTasks.viewDataDialog.lastRun')}: {taskToViewData.lastRun ? format(new Date(taskToViewData.lastRun), "MMM d, yyyy HH:mm:ss") : t('scrapingTasks.table.lastRunN_A')}
                 <br />
                {t('scrapingTasks.viewDataDialog.status')}: {t(`scrapingTasks.status.${taskToViewData.status.toLowerCase()}`)}
                {taskToViewData.requesterName && (<><br />{t('scrapingTasks.viewDataDialog.requester')}: {taskToViewData.requesterName}</>)}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <Textarea
                readOnly
                value={taskToViewData.lastScrapedData || t('scrapingTasks.viewDataDialog.noData')}
                rows={15}
                className={cn("font-mono text-xs bg-muted/30 w-full resize-y", taskToViewData.status === "Failed" ? "text-destructive" : "")}
              />
            </div>
            <DialogFooter className="mt-4 gap-2 sm:justify-end">
              {taskToViewData.status === 'Completed' && taskToViewData.lastScrapedData && (
                <Button onClick={() => handleGenerateAIInsights(taskToViewData)} variant="outline" className="bg-primary/10 text-primary hover:bg-primary/20">
                  <Brain className="mr-2 h-4 w-4" /> {t('scrapingTasks.actions.generateAIInsights')}
                </Button>
              )}
              <Button onClick={() => handleExportToCSV(taskToViewData)} variant="outline"  disabled={!taskToViewData.lastScrapedData || (taskToViewData.status !== 'Completed' && taskToViewData.status !== 'Failed')}>
                <DownloadCloud className="mr-2 h-4 w-4" /> {t('scrapingTasks.actions.exportToCSV')}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="default">
                  {t('scrapingTasks.viewDataDialog.closeButton')}
                </Button>
            </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

     {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={(isOpen) => { if (!isOpen) setEditingTask(null); }}>
          <DialogContent className="sm:max-w-2xl flex flex-col max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{t('scrapingTasks.editDialog.title', { taskName: editingTask.taskName })}</DialogTitle>
              <DialogDescription>
                {t('scrapingTasks.editDialog.description')}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="mt-4 flex-1">
              <div className="pb-6 pr-1"> 
                <ScrapingTaskForm
                    initialValues={{
                    taskName: editingTask.taskName,
                    targetUrl: editingTask.targetUrl,
                    dataToExtract: editingTask.dataToExtract,
                    selectors: editingTask.selectors,
                    frequency: editingTask.frequency,
                    description: editingTask.description || "",
                    requesterId: editingTask.requesterId,
                    }}
                    onFormSubmit={handleUpdateTask}
                    isLoadingExternally={isUpdatingTask}
                    teamMembers={teamMembers}
                    onCancel={() => setEditingTask(null)}
                />
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
    

    

    
