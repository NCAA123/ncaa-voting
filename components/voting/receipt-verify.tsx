'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { getReceiptByHash } from '@/app/actions/reads'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export function ReceiptVerify() {
  const router = useRouter()
  const [hash, setHash] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [receipt, setReceipt] = useState<any | null>(null)
  const [notFound, setNotFound] = useState(false)
  const { toast } = useToast()

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!hash.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a receipt hash',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    setNotFound(false)
    setReceipt(null)

    const result = await getReceiptByHash(hash.trim())

    setIsLoading(false)

    if (!result) {
      setNotFound(true)
      toast({
        title: 'Not Found',
        description: 'Receipt hash not found. Please check and try again.',
        variant: 'destructive',
      })
      return
    }

    setReceipt(result)
    // Reflects the found hash in the URL so this page is bookmarkable/
    // shareable, without a full navigation (the component already shows the
    // result itself via local state).
    router.replace(`?hash=${result.receipt_hash}`, { scroll: false })
    toast({
      title: 'Success',
      description: 'Receipt verified successfully',
    })
  }

  if (receipt) {
    return (
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <CardTitle>Receipt Verified</CardTitle>
              <CardDescription>Your vote has been confirmed</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Election</p>
              <p className="font-semibold">{receipt.elections?.title}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receipt Hash</p>
              <p className="font-mono text-xs break-all">{receipt.receipt_hash}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date & Time</p>
              <p className="font-semibold">
                {formatDate(new Date(receipt.created_at))}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Votes Cast</p>
              <p className="font-semibold">
                {receipt.vote_count} vote{receipt.vote_count !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setReceipt(null)
              setHash('')
            }}
            variant="outline"
            className="w-full"
          >
            Verify Another Receipt
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify Your Vote Receipt</CardTitle>
        <CardDescription>
          Enter your receipt hash to confirm your vote was recorded
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <Input
              placeholder="Enter receipt hash"
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              disabled={isLoading}
              className={notFound ? 'border-destructive' : ''}
            />
            {notFound && (
              <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Receipt not found
              </p>
            )}
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Verify Receipt
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
