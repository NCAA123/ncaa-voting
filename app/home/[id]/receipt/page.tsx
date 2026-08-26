import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ReceiptVerify } from '@/components/voting/receipt-verify'
import { CopyReceiptHashButton } from '@/components/voting/copy-receipt-hash-button'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface PageProps {
  searchParams: Promise<{
    hash?: string
    receipt?: string
  }>
}

async function getReceiptData(hash?: string) {
  if (!hash) return null

  try {
    const { getReceiptByHash } = await import('@/lib/supabase/voting-queries')
    const receipt = await getReceiptByHash(hash)
    return receipt
  } catch (error) {
    console.error('Error fetching receipt:', error)
    return null
  }
}

export default async function ReceiptPage({ searchParams }: PageProps) {
  const { hash } = await searchParams
  const receipt = hash ? await getReceiptData(hash) : null

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Vote Receipt</h1>
        <p className="text-muted-foreground">
          Verify your vote and view your receipt hash
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {receipt ? (
            <>
              <Card className="border-green-200 dark:border-green-800">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <div>
                      <CardTitle>Receipt Verified</CardTitle>
                      <CardDescription>Your vote has been securely recorded</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Election</p>
                      <p className="font-semibold text-lg">{receipt.elections?.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Type</p>
                      <p className="font-semibold capitalize">{receipt.elections?.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Date & Time</p>
                      <p className="font-semibold">
                        {formatDate(new Date(receipt.created_at))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Votes Cast</p>
                      <p className="font-semibold">
                        {receipt.vote_count} vote{receipt.vote_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">Receipt Hash</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 font-mono text-xs break-all">
                        {receipt.receipt_hash}
                      </code>
                      <CopyReceiptHashButton hash={receipt.receipt_hash} />
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>Privacy Note:</strong> Your receipt contains only your receipt hash and vote count. Your specific candidate choices remain completely anonymous.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Link href="/dashboard/elections">
                <Button className="w-full">Back to Elections</Button>
              </Link>
            </>
          ) : (
            <>
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-amber-900 dark:text-amber-100">
                    <strong>Verify a receipt:</strong> Enter your receipt hash below to confirm your vote was recorded.
                  </p>
                </div>
              </div>

              <div className="bg-muted/50 border border-dashed rounded-lg p-8 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No Receipt Hash Provided</h3>
                <p className="text-muted-foreground mb-4">
                  Use the verification tool on the right to look up your receipt
                </p>
              </div>
            </>
          )}
        </div>

        <div className="lg:sticky lg:top-8 lg:self-start">
          <ReceiptVerify />
        </div>
      </div>
    </div>
  )
}
