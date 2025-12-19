"use client"

import type React from "react"

import { useCallback, useMemo, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { TestCase } from "@/lib/types"

interface VirtualTestListProps {
  testCases: TestCase[]
  selectedIds: Set<number>
  onSelectionChange: (ids: Set<number>) => void
  onEdit: (testCase: TestCase) => void
  onView: (id: number) => void
  userRole: string
}

const ITEM_HEIGHT = 80
const VISIBLE_ITEMS = 10

export function VirtualTestList({
  testCases,
  selectedIds,
  onSelectionChange,
  onEdit,
  onView,
  userRole,
}: VirtualTestListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  const { startIndex, endIndex, offsetY } = useMemo(() => {
    const start = Math.floor(scrollTop / ITEM_HEIGHT)
    const end = Math.min(start + VISIBLE_ITEMS + 5, testCases.length)
    const offset = start * ITEM_HEIGHT
    return { startIndex: start, endIndex: end, offsetY: offset }
  }, [scrollTop, testCases.length])

  const visibleItems = useMemo(() => testCases.slice(startIndex, endIndex), [testCases, startIndex, endIndex])

  const totalHeight = testCases.length * ITEM_HEIGHT

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === testCases.length) {
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set(testCases.map((tc) => tc.id)))
    }
  }, [selectedIds.size, testCases, onSelectionChange])

  const handleSelect = useCallback(
    (id: number, checked: boolean) => {
      const newSet = new Set(selectedIds)
      if (checked) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      onSelectionChange(newSet)
    },
    [selectedIds, onSelectionChange],
  )

  const canEdit = userRole === "admin" || userRole === "test-lead"

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-t-md border-b">
        <Checkbox
          checked={selectedIds.size === testCases.length && testCases.length > 0}
          onCheckedChange={handleSelectAll}
        />
        <span className="text-sm text-muted-foreground">
          {selectedIds.size} of {testCases.length} selected
        </span>
      </div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="relative overflow-auto border rounded-b-md"
        style={{ height: `${VISIBLE_ITEMS * ITEM_HEIGHT}px` }}
      >
        <div style={{ height: `${totalHeight}px`, position: "relative" }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleItems.map((testCase, index) => (
              <div
                key={testCase.id}
                className="flex items-center gap-4 p-4 border-b hover:bg-muted/50 transition-colors"
                style={{ height: `${ITEM_HEIGHT}px` }}
              >
                <Checkbox
                  checked={selectedIds.has(testCase.id)}
                  onCheckedChange={(checked) => handleSelect(testCase.id, checked as boolean)}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{testCase.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{testCase.priority}</Badge>
                    <Badge variant="secondary">{testCase.type}</Badge>
                    {testCase.assignee_name && (
                      <span className="text-sm text-muted-foreground">Assigned to: {testCase.assignee_name}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => onView(testCase.id)}>
                    View
                  </Button>
                  {canEdit && (
                    <Button variant="outline" size="sm" onClick={() => onEdit(testCase)}>
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
