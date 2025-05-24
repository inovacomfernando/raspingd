"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartTooltipContent, ChartContainer, ChartConfig } from "@/components/ui/chart"

const chartData = [
  { month: "January", scrapedItems: 186 },
  { month: "February", scrapedItems: 305 },
  { month: "March", scrapedItems: 237 },
  { month: "April", scrapedItems: 273 },
  { month: "May", scrapedItems: 209 },
  { month: "June", scrapedItems: 250 },
];

const chartConfig = {
  scrapedItems: {
    label: "Scraped Items",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function SampleChart() {
  return (
    <div className="h-[300px] w-full">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis />
            <RechartsTooltip cursor={{ fill: "hsl(var(--accent) / 0.3)" }} content={<ChartTooltipContent />} />
            <Bar dataKey="scrapedItems" fill="var(--color-scrapedItems)" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
