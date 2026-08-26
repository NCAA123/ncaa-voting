'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { approveCandidate, rejectCandidate } from '@/app/actions/candidates'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface CandidateCardProps {
  candidate: {
    id: string
    election_id: string
    user_id: string
    status: string
    zone?: string
    fide_title?: string
    created_at: string
    positions?: { id: string; title: string }
    profiles?: { first_name: string; last_name: string; avatar_url?: string }
  }
  documents: any[]
  onStatusChange: () => void
}

export function CandidateCard({
  candidate,
  documents,
  onStatusChange,
}: CandidateCardProps) {
  const [isApproving, setIsApproving] = useState(false)
  const [isRejectingOpen, setIsRejectingOpen] = useState(false)
  const [isViewingDocs, setIsViewingDocs] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const { toast } = useToast()
  const router = useRouter()

  const handleApprove = async () => {
    setIsApproving(true)
    const result = await approveCandidate({
      candidate_id: candidate.id,
      election_id: candidate.election_id,
    })
    setIsApproving(false)

    if (result.success) {
      toast({
        title: 'Success',
        description: 'Candidate approved',
      })
      onStatusChange()
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to approve candidate',
        variant: 'destructive',
      })
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Rejection reason is required',
        variant: 'destructive',
      })
      return
    }

    setIsApproving(true)
    const result = await rejectCandidate({
      candidate_id: candidate.id,
      election_id: candidate.election_id,
      rejection_reason: rejectionReason,
    })
    setIsApproving(false)

    if (result.success) {
      setRejectionReason('')
      setIsRejectingOpen(false)
      toast({
        title: 'Success',
        description: 'Candidate rejected',
      })
      onStatusChange()
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to reject candidate',
        variant: 'destructive',
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="p-4">
      <div className="flex gap-4">
        {candidate.profiles?.avatar_url && (
          <img
            src={candidate.profiles.avatar_url}
            alt={`${candidate.profiles.first_name} ${candidate.profiles.last_name}`}
            className="h-16 w-16 rounded-full object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold">
                {candidate.profiles?.first_name} {candidate.profiles?.last_name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {candidate.positions?.title}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {candidate.zone && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {candidate.zone}
                  </span>
                )}
                {candidate.fide_title && (
                  <span className="text-xs font-medium text-blue-600">
                    {candidate.fide_title}
                  </span>
                )}
              </div>
              <span
                className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(candidate.status)}`}
              >
                {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {candidate.status === 'pending' && (
          <div className="flex gap-2 flex-col sm:flex-row">
            <Dialog open={isViewingDocs} onOpenChange={setIsViewingDocs}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Docs
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Candidate Documents</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  {documents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No documents uploaded
                    </p>
                  ) : (
                    documents.map((doc) => (
                      <div key={doc.id} className="p-3 border rounded-lg">
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:underline break-all"
                        >
                          {doc.doc_type}
                        </a>
                        <p className="text-xs text-muted-foreground mt-1">
                          {doc.verified ? '✓ Verified' : 'Pending verification'}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Button
              size="sm"
              onClick={handleApprove}
              disabled={isApproving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isApproving ? 'Approving...' : 'Approve'}
            </Button>

            <AlertDialog open={isRejectingOpen} onOpenChange={setIsRejectingOpen}>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setIsRejectingOpen(true)}
              >
                Reject
              </Button>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reject Candidate</AlertDialogTitle>
                  <AlertDialogDescription>
                    Provide a reason for rejection. The candidate will be notified.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reason">Rejection Reason</Label>
                    <Textarea
                      id="reason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why this candidate is being rejected..."
                      className="mt-2"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleReject}
                    disabled={isApproving || !rejectionReason.trim()}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isApproving ? 'Rejecting...' : 'Confirm Rejection'}
                  </AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </Card>
  )
}
