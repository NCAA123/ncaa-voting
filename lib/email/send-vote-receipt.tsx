import { Resend } from 'resend'
import { render } from '@react-email/render'
import { VoteReceiptEmail } from './vote-receipt'

// Never lets an email failure block or roll back a vote -- the vote and its
// receipt row are already committed by the time this runs, so this is a
// best-effort notification, not part of the transaction.
export async function sendVoteReceiptEmail(params: {
  recipientEmail: string
  electionTitle: string
  receiptHash: string
  timestamp: string
  voteCount: number
  electionId: string
}) {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set -- skipping vote receipt email')
    return
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vote.ncaaweb.com.ng'
    const verificationUrl = `${baseUrl}/home/${params.electionId}/receipt?hash=${params.receiptHash}`

    const html = await render(
      <VoteReceiptEmail
        recipientEmail={params.recipientEmail}
        electionTitle={params.electionTitle}
        receiptHash={params.receiptHash}
        timestamp={params.timestamp}
        voteCount={params.voteCount}
        verificationUrl={verificationUrl}
      />
    )

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'NCAA Voting <noreply@ncaaweb.com.ng>',
      to: params.recipientEmail,
      subject: `Vote Receipt - ${params.electionTitle}`,
      html,
    })

    if (error) {
      console.error('Failed to send vote receipt email:', error)
    }
  } catch (error) {
    console.error('Error sending vote receipt email:', error)
  }
}
