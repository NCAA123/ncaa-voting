'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Eye, MoreHorizontal, Pencil, Lock, CheckCircle2 } from 'lucide-react'
import { Election, ElectionStatus, ElectionType } from '@/types/elections'
import { publishElection, closeElection } from '@/app/actions/elections'

interface ElectionsTableProps {
  elections: Election[]
}

const statusColors: Record<ElectionStatus, { bg: string; text: string; label: string }> = {
  [ElectionStatus.DRAFT]: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    label: 'Draft',
  },
  [ElectionStatus.SCHEDULED]: {
    bg: 'bg-blue-100 dark:bg-blue-900',
    text: 'text-blue-700 dark:text-blue-300',
    label: 'Scheduled',
  },
  [ElectionStatus.ACTIVE]: {
    bg: 'bg-green-100 dark:bg-green-900',
    text: 'text-green-700 dark:text-green-300',
    label: 'Active',
  },
  [ElectionStatus.CLOSED]: {
    bg: 'bg-orange-100 dark:bg-orange-900',
    text: 'text-orange-700 dark:text-orange-300',
    label: 'Closed',
  },
  [ElectionStatus.ARCHIVED]: {
    bg: 'bg-purple-100 dark:bg-purple-900',
    text: 'text-purple-700 dark:text-purple-300',
    label: 'Archived',
  },
}

const typeLabels: Record<ElectionType, string> = {
  [ElectionType.GENERAL]: 'General',
  [ElectionType.SPECIAL]: 'Special',
  [ElectionType.RUNOFF]: 'Runoff',
  [ElectionType.ZONAL]: 'Zonal',
  [ElectionType.COMMITTEE]: 'Committee',
  [ElectionType.REFERENDUM]: 'Referendum',
  [ElectionType.POLL]: 'Poll',
}

export function ElectionsTable({ elections }: ElectionsTableProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handlePublish = async (electionId: string) => {
    setLoading(electionId)
    try {
      const result = await publishElection(electionId)
      if (!result.success) {
        console.error('Failed to publish:', result.error)
      }
    } finally {
      setLoading(null)
    }
  }

  const handleClose = async (electionId: string) => {
    setLoading(electionId)
    try {
      const result = await closeElection(electionId)
      if (!result.success) {
        console.error('Failed to close:', result.error)
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 dark:bg-slate-900">
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead className="text-right">Positions</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {elections.map((election) => {
            const statusInfo = statusColors[election.status]
            const isLocked = election.status === ElectionStatus.ACTIVE || election.status === ElectionStatus.CLOSED
            return (
              <TableRow key={election.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <TableCell className="font-medium">{election.title}</TableCell>
                <TableCell>{typeLabels[election.type]}</TableCell>
                <TableCell>
                  <Badge
                    className={`${statusInfo.bg} ${statusInfo.text} border-0`}
                  >
                    {statusInfo.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                  {election.start_time ? format(new Date(election.start_time), 'MMM d, h:mm a') : '—'}
                </TableCell>
                <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                  {election.end_time ? format(new Date(election.end_time), 'MMM d, h:mm a') : '—'}
                </TableCell>
                <TableCell className="text-right text-sm font-medium">
                  {election.positions_count || 0}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={loading === election.id}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/elections/${election.id}`} className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/elections/${election.id}/edit`} className="flex items-center gap-2">
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      {election.status === ElectionStatus.DRAFT && (
                        <DropdownMenuItem
                          onClick={() => handlePublish(election.id)}
                          disabled={loading === election.id}
                          className="flex items-center gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Publish
                        </DropdownMenuItem>
                      )}
                      {election.status === ElectionStatus.ACTIVE && (
                        <DropdownMenuItem
                          onClick={() => handleClose(election.id)}
                          disabled={loading === election.id}
                          className="flex items-center gap-2"
                        >
                          <Lock className="h-4 w-4" />
                          Close
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {elections.length === 0 && (
        <div className="flex items-center justify-center h-40 text-slate-500 dark:text-slate-400">
          No elections yet
        </div>
      )}
    </div>
  )
}
