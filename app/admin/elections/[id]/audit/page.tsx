'use client'

import { use, useState, useEffect } from 'react'
import { notFound, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AuditLogTable } from '@/components/admin/audit-log-table'
import { AuditFilterBar } from '@/components/admin/audit-filter-bar'
import { getAuditLogs } from '@/app/actions/reads'

interface AuditLog {
  id: string
  created_at: string
  action: string
  displayVoterId: string
  displayIpAddress: string
}

export default function AuditLogPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: electionId } = use(params)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<{
    action?: string
    startDate?: string
    endDate?: string
  }>({})

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true)
      try {
        const auditLogs = await getAuditLogs(electionId, filters)
        setLogs(auditLogs as AuditLog[])
      } catch (error) {
        console.error('Failed to fetch audit logs:', error)
        setLogs([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchLogs()
  }, [electionId, filters])

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground mt-1">
          View all voting and system events for this election
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditFilterBar logs={logs} onFilterChange={handleFilterChange} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Audit Logs
            {logs.length > 0 && (
              <span className="text-sm text-muted-foreground ml-2">
                ({logs.length} entries)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AuditLogTable logs={logs} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}
