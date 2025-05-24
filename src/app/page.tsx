
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useTranslation } from "@/hooks/use-translation";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend as RechartsLegend } from "recharts";
import { ChartTooltipContent, ChartContainer, ChartConfig } from "@/components/ui/chart";
import { 
    TrendingUp, 
    ArrowRight, 
    PlusCircle, 
    Import, 
    FileText, 
    Briefcase, 
    CalendarClock, 
    ClipboardCheck,
    Users,
    Percent,
    Play,
    Pause,
    Settings2,
    MoreVertical,
    Zap as ZapIcon, 
    CheckCircle as CheckCircleIcon, 
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils"; 

const projectAnalyticsData = [
  { day: "S", value: 1500, fill: "var(--chart-2)" },
  { day: "M", value: 3000, fill: "var(--chart-1)" },
  { day: "T", value: 2000, fill: "var(--chart-2)" },
  { day: "W", value: 3200, fill: "var(--chart-1)" }, 
  { day: "T", value: 1800, fill: "var(--chart-2)" },
  { day: "F", value: 2500, fill: "var(--chart-1)" },
  { day: "S", value: 2200, fill: "var(--chart-2)" },
];

const chartConfig = {
  value: {
    label: "Projects",
    color: "hsl(var(--chart-1))",
  },
   fill: {} 
} satisfies ChartConfig;

// Updated teamMembers structure to be consistent with TeamMember type,
// but role is specific to this dashboard card.
const teamMembers = [
    { id: "static_tm_1", name: "Alexandra Deff", role: "Working on Github Project Repository", avatarUrl: "https://placehold.co/40x40.png", status: "Completed", dataAiHint: "woman face" },
    { id: "static_tm_2", name: "Edwin Adenike", role: "Working on Integrated User Authentication System", avatarUrl: "https://placehold.co/40x40.png", status: "In Progress", dataAiHint: "man face" },
    { id: "static_tm_3", name: "Isaac Oluwatemilorun", role: "Working on Develop Search and Filter Functionality", avatarUrl: "https://placehold.co/40x40.png", status: "Pending", dataAiHint: "man face" },
    { id: "static_tm_4", name: "David Oshodi", role: "Working on Responsive Layout for Homepage", avatarUrl: "https://placehold.co/40x40.png", status: "In Progress", dataAiHint: "man face" },
];

const LayoutGridIcon = ({className}: {className?: string}) => <TrendingUp className={className} />; 
const ActualZapIcon = ({className}: {className?: string}) => <ZapIcon className={className} />; 
const ActualCheckCircleIcon = ({className}: {className?: string}) => <CheckCircleIcon className={className} />;


const projectTasks = [
    { name: "Develop API Endpoints", dueDate: "Nov 28, 2024", icon: Settings2, iconColor: "text-blue-500" },
    { name: "Onboarding Flow", dueDate: "Nov 30, 2024", icon: Users, iconColor: "text-green-500"  },
    { name: "Build Dashboard", dueDate: "Nov 30, 2024", icon: LayoutGridIcon, iconColor: "text-purple-500" },
    { name: "Optimize Page Load", dueDate: "Dec 5, 2024", icon: ActualZapIcon, iconColor: "text-yellow-500"  },
    { name: "Cross-Browser Testing", dueDate: "Dec 8, 2024", icon: ActualCheckCircleIcon, iconColor: "text-red-500"  },
];


export default function DashboardPage() {
  const { t } = useTranslation();

  const StatCard = ({ title, value, change, icon, cardClass, valueClass, titleClass, iconBgClass }: { title: string, value: string | number, change?: string, icon: React.ElementType, cardClass?: string, valueClass?: string, titleClass?: string, iconBgClass?: string }) => {
    const IconComponent = icon;
    return (
      <Card className={cn("shadow-md rounded-xl", cardClass)}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className={cn("text-sm font-medium text-muted-foreground", titleClass)}>{title}</CardTitle>
            <div className={cn("p-1.5 rounded-full", iconBgClass || "bg-primary/10")}>
                <IconComponent className={cn("h-4 w-4", iconBgClass ? "text-white" : "text-primary")} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn("text-3xl font-bold", valueClass)}>{value}</div>
          {change && <p className="text-xs text-muted-foreground mt-1 flex items-center"><TrendingUp className="h-3 w-3 mr-1 text-green-500" /> {change}</p>}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-2">
        <div>
            <h1 className="text-3xl font-bold text-foreground">{t('dashboard.title')}</h1>
            <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex gap-3">
            <Button variant="outline" className="bg-card hover:bg-muted rounded-lg shadow-sm">
                <Import className="mr-2 h-4 w-4" /> {t('dashboard.importData')}
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-sm">
                <PlusCircle className="mr-2 h-4 w-4" /> {t('dashboard.addProject')}
            </Button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t('dashboard.totalProjects.title')} value="24" change={t('dashboard.increasedLastMonth')} icon={Briefcase} cardClass="bg-green-600 text-white" valueClass="text-white" titleClass="text-green-100" iconBgClass="bg-white/20"/>
        <StatCard title={t('dashboard.endedProjects.title')} value="10" change={t('dashboard.increasedLastMonth')} icon={ClipboardCheck} />
        <StatCard title={t('dashboard.runningProjects.title')} value="12" change={t('dashboard.increasedLastMonth')} icon={CalendarClock} />
        <StatCard title={t('dashboard.pendingProjects.title')} value="2" change={t('dashboard.onDiscuss')} icon={FileText} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column / Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-md rounded-xl">
            <CardHeader>
              <CardTitle>{t('dashboard.projectAnalytics.title')}</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px] pl-0 pr-2">
              <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
                <BarChart data={projectAnalyticsData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.5)" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} className="text-xs text-muted-foreground"/>
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} className="text-xs text-muted-foreground" domain={[0, 'dataMax + 500']}/>
                  <RechartsTooltip cursor={{ fill: "hsl(var(--accent) / 0.1)" }} content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[8, 8, 8, 8]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          
          <Card className="shadow-md rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t('dashboard.teamCollaboration.title')}</CardTitle>
                <Link href="/team" passHref>
                    <Button variant="outline" size="sm" className="rounded-lg text-xs">
                        <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> {t('dashboard.addMember')}
                    </Button>
                </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                        <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint={member.dataAiHint} />
                        <AvatarFallback>{member.name.substring(0,2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                        <p className="text-sm font-medium text-foreground">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                        </div>
                    </div>
                    <Badge 
                        variant={member.status === "Completed" ? "default" : member.status === "Pending" ? "destructive" : "secondary"}
                        className={cn(
                            "text-xs capitalize py-0.5 px-2 rounded-full",
                            member.status === "Completed" && "bg-green-100 text-green-700 border-green-300",
                            member.status === "Pending" && "bg-yellow-100 text-yellow-700 border-yellow-300",
                            member.status === "In Progress" && "bg-blue-100 text-blue-700 border-blue-300",
                        )}
                    >
                        {member.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card className="shadow-md rounded-xl">
            <CardHeader>
              <CardTitle>{t('dashboard.reminders.title')}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="bg-secondary p-4 rounded-lg">
                    <p className="font-semibold text-secondary-foreground">Meeting with Arc Company</p>
                    <p className="text-xs text-muted-foreground mb-3">Time: 02:00 PM - 04:00 PM</p>
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg">
                        <Play className="mr-2 h-4 w-4" />{t('dashboard.startMeeting')}
                    </Button>
                </div>
            </CardContent>
          </Card>

          <Card className="shadow-md rounded-xl">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium">{t('dashboard.project.title')}</CardTitle>
                <Button variant="outline" size="sm" className="rounded-lg text-xs">
                    <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> {t('dashboard.project.new')}
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {projectTasks.map(task => {
                        const Icon = task.icon;
                        return (
                            <div key={task.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn(`p-1.5 rounded-full bg-opacity-10`, task.iconColor.replace('text-','bg-').replace('-500','/10'))}>
                                      <Icon className={cn(`h-4 w-4`, task.iconColor)} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-foreground">{task.name}</p>
                                        <p className="text-xs text-muted-foreground">{task.dueDate}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
          </Card>

          <Card className="shadow-md rounded-xl">
            <CardHeader>
              <CardTitle>{t('dashboard.projectProgress.title')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="relative w-32 h-32 mb-2">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path className="text-slate-200" strokeWidth="3" fill="none" stroke="currentColor"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-primary" strokeWidth="3" fill="none" stroke="currentColor"
                        strokeDasharray="41, 100" 
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">41%</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{t('dashboard.projectProgress.projectEnded')}</p>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-green-500 mr-1.5"></span>{t('dashboard.projectProgress.completed')}</span>
                <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-primary mr-1.5"></span>{t('dashboard.projectProgress.inProgress')}</span>
                <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-slate-300 mr-1.5"></span>{t('dashboard.projectProgress.pending')}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md rounded-xl bg-green-700 text-white">
            <CardHeader>
              <CardTitle className="text-white">{t('dashboard.timeTracker.title')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <p className="text-4xl font-bold mb-4">01:24:08</p>
              <div className="flex gap-3">
                <Button variant="secondary" size="icon" className="bg-white/20 hover:bg-white/30 text-white rounded-full h-10 w-10">
                  <Pause className="h-5 w-5" />
                </Button>
                <Button variant="secondary" size="icon" className="bg-red-500 hover:bg-red-600 text-white rounded-full h-10 w-10">
                  <Play className="h-5 w-5" /> 
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
