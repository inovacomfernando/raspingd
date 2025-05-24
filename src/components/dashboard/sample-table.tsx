import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils"; // Use global cn

const tasks = [
  {
    id: "TSK001",
    sourceUrl: "competitor-a.com/products",
    dataType: "Prices",
    lastScraped: "2024-07-28 10:00 AM",
    status: "Completed",
  },
  {
    id: "TSK002",
    sourceUrl: "social-media-trends.com/fashion",
    dataType: "Consumer Behavior",
    lastScraped: "2024-07-28 09:30 AM",
    status: "Running",
  },
  {
    id: "TSK003",
    sourceUrl: "news-aggregator.com/tech",
    dataType: "URLs",
    lastScraped: "2024-07-27 05:00 PM",
    status: "Failed",
  },
  {
    id: "TSK004",
    sourceUrl: "competitor-b.com/electronics",
    dataType: "Prices",
    lastScraped: "2024-07-28 11:00 AM",
    status: "Scheduled",
  },
];

export function SampleTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task ID</TableHead>
          <TableHead>Source URL</TableHead>
          <TableHead>Data Type</TableHead>
          <TableHead>Last Scraped</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell className="font-medium">{task.id}</TableCell>
            <TableCell className="truncate max-w-[150px]">{task.sourceUrl}</TableCell>
            <TableCell>{task.dataType}</TableCell>
            <TableCell>{task.lastScraped}</TableCell>
            <TableCell>
              <Badge
                variant={
                  task.status === "Completed"
                    ? "default"
                    : task.status === "Running"
                    ? "secondary"
                    : task.status === "Failed"
                    ? "destructive"
                    : "outline" 
                }
                className={cn(
                  task.status === "Completed" && "bg-green-500 hover:bg-green-600 text-white",
                  task.status === "Running" && "bg-blue-500 hover:bg-blue-600 text-white",
                  task.status === "Scheduled" && "bg-yellow-500 hover:bg-yellow-600 text-black"
                )}
              >
                {task.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
