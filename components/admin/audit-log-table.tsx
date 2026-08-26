'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatWatDateTime } from '@/lib/utils'

interface AuditLog {
  id: string
  created_at: string
  action: string
  displayVoterId: string
  displayIpAddress: string
}

interface AuditLogTableProps {
  logs: AuditLog[]
  isLoading?: boolean
}

const actionColors: Record<string, string> = {
  vote_cast: 'bg-blue-100 text-blue-800',
  vote_verified: 'bg-green-100 text-green-800',
  receipt_generated: 'bg-purple-100 text-purple-800',
  anomaly_detected: 'bg-red-100 text-red-800',
  admin_action: 'bg-yellow-100 text-yellow-800',
}

export function AuditLogTable({ logs, isLoading }: AuditLogTableProps) {
  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading audit logs...</div>
  }

  if (logs.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No audit logs found</div>
  }

  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted">
            <TableHead>Timestamp</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Voter ID</TableHead>
            <TableHead>IP Address</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id} className="hover:bg-muted/50">
              <TableCell className="text-sm whitespace-nowrap">
                {formatWatDateTime(log.created_at)}
              </TableCell>
              <TableCell>
                <Badge className={actionColors[log.action] || 'bg-gray-100 text-gray-800'}>
                  {log.action.replace(/_/g, ' ')}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-sm">{log.displayVoterId}</TableCell>
              <TableCell className="font-mono text-sm">{log.displayIpAddress}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
