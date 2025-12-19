"use client"

import { useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface StatusPieChartProps {
  data: {
    passed: number
    failed: number
    blocked: number
    skipped: number
    pending: number
  }
}

export function StatusPieChart({ data }: StatusPieChartProps) {
  const chartData = useMemo(
    () => [
      { name: "Passed", value: data.passed, color: "hsl(var(--chart-1))" },
      { name: "Failed", value: data.failed, color: "hsl(var(--chart-2))" },
      { name: "Blocked", value: data.blocked, color: "hsl(var(--chart-3))" },
      { name: "Skipped", value: data.skipped, color: "hsl(var(--chart-4))" },
      { name: "Pending", value: data.pending, color: "hsl(var(--chart-5))" },
    ],
    [data],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Status Distribution</CardTitle>
        <CardDescription>Current status of all test cases</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
