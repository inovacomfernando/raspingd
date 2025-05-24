
import type { ScrapingTaskFormValues } from "@/components/scraping-tasks/scraping-task-form";

export interface ScrapingTaskWithId extends ScrapingTaskFormValues {
  id: string;
  createdAt: string; // ISO string format
  status: "Pending" | "Running" | "Completed" | "Failed" | "Scheduled";
  lastRun?: string; // ISO string format for when the task was last run
  lastScrapedData?: string; // Content of the last scrape
  requesterId?: string;
  requesterName?: string;
}
