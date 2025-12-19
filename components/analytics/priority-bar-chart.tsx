"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PriorityBarChartProps {
  data: {
    critical: number
    high: number
    medium: number
    low: number
  }
}

export function PriorityBarChart({ data }: PriorityBarChartProps) {
  const chartData = useMemo(
    () => [
      { priority: "Critical", count: data.critical, fill: "hsl(var(--chart-2))" },
      { priority: "High", count: data.high, fill: "hsl(var(--chart-3))" },
      { priority: "Medium", count: data.medium, fill: "hsl(var(--chart-4))" },
      { priority: "Low", count: data.low, fill: "hsl(var(--chart-5))" },
    ],
    [data],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Cases by Priority</CardTitle>
        <CardDescription>Distribution of test cases across priority levels</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="priority" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="hsl(var(--chart-1))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
