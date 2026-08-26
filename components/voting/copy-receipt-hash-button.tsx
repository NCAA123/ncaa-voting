'use client'

import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function CopyReceiptHashButton({ hash }: { hash: string }) {
  const { toast } = useToast()

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => {
        navigator.clipboard.writeText(hash)
        toast({ title: 'Copied', description: 'Receipt hash copied to clipboard' })
      }}
    >
      <Copy className="w-4 h-4" />
    </Button>
  )
}
