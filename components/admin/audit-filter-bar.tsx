'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Download } from 'lucide-react'
import Papa from 'papaparse'
import { formatWatDateTime } from '@/lib/utils'

interface AuditLog {
  id: string
  created_at: string
  action: string
  displayVoterId: string
  displayIpAddress: string
}

interface AuditFilterBarProps {
  logs: AuditLog[]
  onFilterChange: (filters: { action?: string; startDate?: string; endDate?: string }) => void
}

const actionTypes = [
  { label: 'Vote Cast', value: 'vote_cast' },
  { label: 'Vote Verified', value: 'vote_verified' },
  { label: 'Receipt Generated', value: 'receipt_generated' },
  { label: 'Anomaly Detected', value: 'anomaly_detected' },
  { label: 'Admin Action', value: 'admin_action' },
]

export function AuditFilterBar({ logs, onFilterChange }: AuditFilterBarProps) {
  const [action, setAction] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  const handleApplyFilters = () => {
    onFilterChange({
      action: action || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
  }

  const handleClearFilters = () => {
    setAction('')
    setStartDate('')
    setEndDate('')
    onFilterChange({})
  }

  const handleExportCSV = () => {
    const csvData = logs.map((log) => ({
      Timestamp: formatWatDateTime(log.created_at),
      Action: log.action,
      'Voter ID': log.displayVoterId,
      'IP Address': log.displayIpAddress,
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">Action Type</label>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger>
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All actions</SelectItem>
              {actionTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">Start Date</label>
          <Input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">End Date</label>
          <Input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <Button onClick={handleApplyFilters}>Apply Filters</Button>
        <Button variant="outline" onClick={handleClearFilters}>
          Clear
        </Button>
        <Button
          variant="outline"
          onClick={handleExportCSV}
          disabled={logs.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>
    </div>
  )
}
