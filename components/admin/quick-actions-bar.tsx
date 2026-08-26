'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { releaseResults } from '@/app/actions/voting'
import { closeElection } from '@/app/actions/elections'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Users, Monitor, BarChart3, Lock, ListChecks, UserPlus, Pencil, FileClock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface QuickActionsBarProps {
  electionId: string
  canReleaseResults: boolean
  canCloseElection: boolean
}

export function QuickActionsBar({
  electionId,
  canReleaseResults,
  canCloseElection,
}: QuickActionsBarProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleReleaseResults = async () => {
    setIsLoading(true)
    try {
      const result = await releaseResults(electionId)
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Results have been released',
        })
        router.refresh()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to release results',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseElection = async () => {
    if (!confirm('Are you sure you want to close this election? This cannot be undone.')) {
      return
    }

    setIsLoading(true)
    try {
      const result = await closeElection(electionId)
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Election has been closed',
        })
        router.refresh()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to close election',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Link href={`/admin/elections/${electionId}/edit`}>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-2" />
          Edit Election
        </Button>
      </Link>

      <Link href={`/admin/elections/${electionId}/positions`}>
        <Button variant="outline" size="sm">
          <ListChecks className="h-4 w-4 mr-2" />
          Manage Positions
        </Button>
      </Link>

      <Link href={`/admin/elections/${electionId}/nominate`}>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Nominate Candidate
        </Button>
      </Link>

      <Link href={`/admin/elections/${electionId}/candidates`}>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-2" />
          View Candidates
        </Button>
      </Link>

      <Link href={`/admin/elections/${electionId}/monitor`}>
        <Button variant="outline" size="sm">
          <Monitor className="h-4 w-4 mr-2" />
          Monitor Live
        </Button>
      </Link>

      <Link href={`/admin/elections/${electionId}/audit`}>
        <Button variant="outline" size="sm">
          <FileClock className="h-4 w-4 mr-2" />
          Audit Log
        </Button>
      </Link>

      <Button
        onClick={handleReleaseResults}
        disabled={!canReleaseResults || isLoading}
        size="sm"
        variant={canReleaseResults ? 'default' : 'secondary'}
      >
        <BarChart3 className="h-4 w-4 mr-2" />
        Release Results
      </Button>

      <Button
        onClick={handleCloseElection}
        disabled={!canCloseElection || isLoading}
        size="sm"
        variant="destructive"
      >
        <Lock className="h-4 w-4 mr-2" />
        Close Election
      </Button>
    </div>
  )
}
