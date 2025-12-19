"use client"

import { useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { MoreVertical, Edit, Trash } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface TestCase {
  id: number
  title: string
  priority: string
  type: string
  assigned_to_name?: string
  steps_count: number
}

interface TestCaseTableProps {
  testCases: TestCase[]
  onEdit?: (testCase: TestCase) => void
  onDelete?: (id: number) => void
  canEdit: boolean
  selectedIds: number[]
  onSelectIds: (ids: number[]) => void
}

export function TestCaseTable({ testCases, onEdit, onDelete, canEdit, selectedIds, onSelectIds }: TestCaseTableProps) {
  const allSelected = useMemo(
    () => testCases.length > 0 && testCases.every((tc) => selectedIds.includes(tc.id)),
    [testCases, selectedIds],
  )

  const toggleAll = () => {
    if (allSelected) {
      onSelectIds([])
    } else {
      onSelectIds(testCases.map((tc) => tc.id))
    }
  }

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      onSelectIds(selectedIds.filter((sid) => sid !== id))
    } else {
      onSelectIds([...selectedIds, id])
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "destructive"
      case "High":
        return "default"
      case "Medium":
        return "secondary"
      case "Low":
        return "outline"
      default:
        return "secondary"
    }
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {canEdit && (
              <TableHead className="w-12">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              </TableHead>
            )}
            <TableHead>Title</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Steps</TableHead>
            {canEdit && <TableHead className="w-12"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {testCases.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canEdit ? 7 : 6} className="text-center py-8 text-muted-foreground">
                No test cases found
              </TableCell>
            </TableRow>
          ) : (
            testCases.map((testCase) => (
              <TableRow key={testCase.id}>
                {canEdit && (
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(testCase.id)}
                      onCheckedChange={() => toggleSelect(testCase.id)}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <Link href={`/test-cases/${testCase.id}`} className="hover:underline font-medium">
                    {testCase.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={getPriorityColor(testCase.priority) as any}>{testCase.priority}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{testCase.type}</Badge>
                </TableCell>
                <TableCell>{testCase.assigned_to_name || "Unassigned"}</TableCell>
                <TableCell>{testCase.steps_count} steps</TableCell>
                {canEdit && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit?.(testCase)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete?.(testCase.id)} className="text-destructive">
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
