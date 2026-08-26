'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Copy } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface VoteSuccessProps {
  receiptHash: string
  electionId: string
  voteCount: number
}

export function VoteSuccess({
  receiptHash,
  electionId,
  voteCount,
}: VoteSuccessProps) {
  const { toast } = useToast()

  const handleCopyHash = () => {
    navigator.clipboard.writeText(receiptHash)
    toast({
      title: 'Copied',
      description: 'Receipt hash copied to clipboard',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center gap-4">
        <CheckCircle className="w-16 h-16 text-green-600" />
        <div className="text-center">
          <h1 className="text-2xl font-bold">Vote Submitted Successfully</h1>
          <p className="text-muted-foreground mt-2">
            Your votes have been securely recorded
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Receipt Hash</CardTitle>
          <CardDescription>
            Save this for your records and verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg break-all font-mono text-sm">
            {receiptHash}
          </div>
          <Button
            onClick={handleCopyHash}
            variant="outline"
            className="w-full"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Receipt Hash
          </Button>
        </CardContent>
      </Card>

      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Positions voted:</strong> {voteCount} vote{voteCount !== 1 ? 's' : ''} cast
        </p>
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
          A confirmation email with your receipt hash has been sent to your email address.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Link href={`/home/${electionId}/receipt`}>
          <Button variant="outline" className="w-full">
            View Full Receipt
          </Button>
        </Link>
        <Link href="/dashboard/elections">
          <Button className="w-full">
            Back to Elections
          </Button>
        </Link>
      </div>
    </div>
  )
}
