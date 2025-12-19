"use client"

import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface TrendsLineChartProps {
  data: Array<{
    date: string
    passed: string
    failed: string
    blocked: string
    skipped: string
  }>
}

export function TrendsLineChart({ data }: TrendsLineChartProps) {
  const chartData = useMemo(
    () =>
      data.map((item) => ({
        date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        Passed: Number.parseInt(item.passed),
        Failed: Number.parseInt(item.failed),
        Blocked: Number.parseInt(item.blocked),
        Skipped: Number.parseInt(item.skipped),
      })),
    [data],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Execution Trends</CardTitle>
        <CardDescription>Test execution results over the last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Passed" stroke="hsl(var(--chart-1))" strokeWidth={2} />
            <Line type="monotone" dataKey="Failed" stroke="hsl(var(--chart-2))" strokeWidth={2} />
            <Line type="monotone" dataKey="Blocked" stroke="hsl(var(--chart-3))" strokeWidth={2} />
            <Line type="monotone" dataKey="Skipped" stroke="hsl(var(--chart-4))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
